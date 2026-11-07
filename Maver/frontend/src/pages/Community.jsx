import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedBackground from '../components/layout/AnimatedBackground'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import FriendButton from '../components/layout/FriendButton'
import { userService, communityService, filmService, actorService } from '../services/api'
import './Community.css'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185'

function Community() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ nom: 'Fan' })
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [postContent, setPostContent] = useState('')
  const [mentionType, setMentionType] = useState('movie') // 'movie' or 'actor'
  const [mentionSearchQuery, setMentionSearchQuery] = useState('')
  const [mentionSearchResults, setMentionSearchResults] = useState([])
  const [selectedMovies, setSelectedMovies] = useState([])
  const [selectedActors, setSelectedActors] = useState([])
  const [searchingMention, setSearchingMention] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const userData = await userService.getCurrentUser().catch(() => null)
        if (!userData || !userData.email) {
          navigate('/login', { replace: true })
          return
        }
        setUser(userData || { nom: 'Fan' })
        await loadPosts()
      } catch (error) {
        console.error('Error loading data:', error)
        setErrorMessage('Failed to load community data')
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [navigate])

  const loadPosts = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const postsData = await communityService.getAllPosts()
      console.log('Loaded posts from API:', postsData)
      console.log('Number of posts received:', Array.isArray(postsData) ? postsData.length : 'Not an array')
      
      if (!Array.isArray(postsData)) {
        console.warn('Expected array but got:', typeof postsData, postsData)
        if (showLoading) {
          setLoading(false)
        }
        return
      }
      
      postsData.forEach((post, index) => {
        console.log(`Post ${index + 1}:`, {
          id: post.id,
          userId: post.user?.id,
          userName: post.user?.nom,
          content: post.content?.substring(0, 50) + '...'
        })
      })
      
      const normalizedPosts = postsData
        .filter(post => post && post.id && post.user && post.user.id) // Filter out invalid posts
        .map(post => ({
          ...post,
          mentionedMovies: Array.isArray(post.mentionedMovies) ? post.mentionedMovies : [],
          mentionedActors: Array.isArray(post.mentionedActors) ? post.mentionedActors : []
        }))
      
        console.log('Normalized posts count:', normalizedPosts.length)
      console.log('Current user:', user)
      console.log('Current user ID:', user?.id)
      if (user?.id) {
        console.log('Posts from other users:', normalizedPosts.filter(p => p.user && p.user.id !== user.id).length)
      }
      
      console.log('Updating posts from database - this is the source of truth')
      setPosts(normalizedPosts)
      setErrorMessage('') // Clear any previous errors
      
      if (normalizedPosts.length === 0) {
        console.warn('No posts found in database. This could mean:')
        console.warn('1. Database tables don\'t exist')
        console.warn('2. No posts have been created yet')
        console.warn('3. Database connection issue')
      }
    } catch (error) {
      console.error('Error loading posts:', error)
      const errorMsg = error && error.message ? error.message : 'Failed to load posts'
      setErrorMessage(errorMsg)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const searchMention = async (query) => {
    if (!query || query.trim().length < 2) {
      setMentionSearchResults([])
      return
    }
    setSearchingMention(true)
    try {
      if (mentionType === 'movie') {
        const results = await filmService.searchMoviesLightweight(query.trim())
        setMentionSearchResults(Array.isArray(results) ? results : [])
      } else {
        const TMDB_API_KEY = 'b2524dcdf8e11a2cb256f322b5cef254'
        const response = await fetch(
          `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query.trim())}&include_adult=false&page=1`
        )
        
        if (!response.ok) {
          throw new Error('Failed to search actors')
        }
        
        const data = await response.json()
        const actors = (data.results || []).slice(0, 5).map(person => ({
          tmdbId: person.id,
          name: person.name || 'Unknown Actor',
          profilePath: person.profile_path || null
        }))
        
        setMentionSearchResults(actors)
      }
    } catch (error) {
      console.error('Error searching:', error)
      setMentionSearchResults([])
    } finally {
      setSearchingMention(false)
    }
  }

  const handleMovieSelect = (movie) => {
    console.log('handleMovieSelect called with:', movie)
    
    const tmdbId = movie.tmdb_id || movie.tmdbId || movie.id || null
    
    if (!tmdbId) {
      console.error('Movie has no TMDB ID:', movie)
      return
    }
    
    const tmdbIdNum = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId
    
    let posterPath = null
    if (movie.poster_path) {
      posterPath = movie.poster_path.startsWith('/') ? movie.poster_path : `/${movie.poster_path}`
    } else if (movie.url) {
      const urlMatch = movie.url.match(/\/w\d+\/(.+)$/)
      if (urlMatch) {
        const path = urlMatch[1]
        posterPath = path.startsWith('/') ? path : `/${path}`
      }
    }
    
    const newMovie = {
      tmdbId: tmdbIdNum,
      title: movie.titre || movie.title || '',
      posterPath: posterPath
    }
    
    setSelectedMovies([newMovie])
    setSelectedActors([])
    setMentionSearchQuery('')
    setMentionSearchResults([])
  }

  const handleActorSelect = (actor) => {
    console.log('handleActorSelect called with:', actor)
    
    setSelectedActors([actor])
    setSelectedMovies([])
    setMentionSearchQuery('')
    setMentionSearchResults([])
  }

  const removeMovie = (tmdbId) => {
    setSelectedMovies(selectedMovies.filter(m => m.tmdbId !== tmdbId))
  }

  const removeActor = (tmdbId) => {
    setSelectedActors(selectedActors.filter(a => a.tmdbId !== tmdbId))
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!postContent || !postContent.trim()) {
      setErrorMessage('Please enter some content for your post')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    if (posting) {
      console.warn('Post submission already in progress, ignoring duplicate request')
      return
    }

    setPosting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (selectedMovies.length > 0 && selectedActors.length > 0) {
        setErrorMessage('You can only mention either a movie OR an actor, not both')
        setTimeout(() => setErrorMessage(''), 3000)
        setPosting(false)
        return
      }
      
      const movieTmdbIds = (selectedMovies && Array.isArray(selectedMovies) && selectedMovies.length > 0)
        ? [selectedMovies[0].tmdbId].filter(id => id != null && id !== undefined && !isNaN(id))
        : []
      
      const actorTmdbIds = (selectedActors && Array.isArray(selectedActors) && selectedActors.length > 0)
        ? [selectedActors[0].tmdbId].filter(id => id != null && id !== undefined && !isNaN(id))
        : []
      
      const movieData = (selectedMovies && Array.isArray(selectedMovies) && selectedMovies.length > 0)
        ? [{
            tmdbId: selectedMovies[0].tmdbId,
            title: selectedMovies[0].title || selectedMovies[0].titre || '',
            posterPath: (() => {
              let path = selectedMovies[0].posterPath
              if (!path && selectedMovies[0].url) {
                if (selectedMovies[0].url.includes('image.tmdb.org')) {
                  const urlMatch = selectedMovies[0].url.match(/\/w\d+\/(.+)$/)
                  path = urlMatch ? urlMatch[1] : null
                }
              }
              if (path && !path.startsWith('/')) {
                path = `/${path}`
              }
              return path || ''
            })()
          }]
        : []
      
      const actorData = (selectedActors && Array.isArray(selectedActors) && selectedActors.length > 0)
        ? [{
            tmdbId: selectedActors[0].tmdbId,
            name: selectedActors[0].name || '',
            profilePath: (() => {
              let path = selectedActors[0].profilePath
              if (!path && selectedActors[0].profile_image) {
                if (selectedActors[0].profile_image.includes('image.tmdb.org')) {
                  const urlMatch = selectedActors[0].profile_image.match(/\/w\d+\/(.+)$/)
                  path = urlMatch ? urlMatch[1] : null
                }
              }
              if (path && !path.startsWith('/')) {
                path = `/${path}`
              }
              return path || ''
            })()
          }]
        : []
      
      const content = postContent.trim()
      
      console.log('Creating post:', { 
        content: content.substring(0, 50) + '...', 
        movieCount: movieTmdbIds.length, 
        actorCount: actorTmdbIds.length,
        movieData: movieData,
        actorData: actorData
      })
      
      const result = await communityService.createPost(content, movieTmdbIds, actorTmdbIds, movieData, actorData)
      
      if (!result || !result.id) {
        throw new Error('Invalid response from server')
      }
      
      console.log('Post created successfully:', result)
      
      const newPost = {
        ...result,
        mentionedMovies: Array.isArray(result.mentionedMovies) ? result.mentionedMovies : [],
        mentionedActors: Array.isArray(result.mentionedActors) ? result.mentionedActors : []
      }
      
      setPostContent('')
      setSelectedMovies([])
      setSelectedActors([])
      setMentionSearchQuery('')
      setMentionSearchResults([])
      setMentionType('movie')
      
      setShowCreateModal(false)
      
      setSuccessMessage('Post created successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      
      setPosts(prevPosts => {
        const exists = prevPosts.some(p => p.id === newPost.id)
        if (exists) {
          return prevPosts
        }
        return [newPost, ...prevPosts]
      })
      
    } catch (error) {
      console.error('Error creating post:', error)
      
      let errorMsg = 'Failed to create post. Please try again.'
      if (error && error.message) {
        errorMsg = error.message
      } else if (typeof error === 'string') {
        errorMsg = error
      }
      
      setErrorMessage(errorMsg)
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setPosting(false)
    }
  }

  const handleReaction = async (postId, reactionType) => {
    try {
      const post = posts.find(p => p.id === postId)
      if (!post) {
        console.error('Post not found:', postId)
        return
      }

      const wasSameReaction = post.userReaction === reactionType
      const previousReaction = post.userReaction
      
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id !== postId) return p
        
        const updatedPost = { ...p }
        
        if (wasSameReaction) {
          updatedPost.userReaction = null
          if (previousReaction && updatedPost.reactionCounts) {
            updatedPost.reactionCounts = {
              ...updatedPost.reactionCounts,
              [previousReaction]: Math.max(0, (updatedPost.reactionCounts[previousReaction] || 0) - 1)
            }
          }
        } else {
          if (previousReaction && updatedPost.reactionCounts) {
            updatedPost.reactionCounts = {
              ...updatedPost.reactionCounts,
              [previousReaction]: Math.max(0, (updatedPost.reactionCounts[previousReaction] || 0) - 1)
            }
          }
          updatedPost.userReaction = reactionType
          if (updatedPost.reactionCounts) {
            updatedPost.reactionCounts = {
              ...updatedPost.reactionCounts,
              [reactionType]: (updatedPost.reactionCounts[reactionType] || 0) + 1
            }
          } else {
            updatedPost.reactionCounts = {
              LOVE: 0,
              THUMBS_UP: 0,
              SAD: 0,
              ANGRY: 0,
              [reactionType]: 1
            }
          }
        }
        
        return updatedPost
      }))
      
      if (wasSameReaction) {
        await communityService.removeReaction(postId)
      } else {
        await communityService.addOrUpdateReaction(postId, reactionType)
      }
      
      setTimeout(async () => {
        try {
          const allPosts = await communityService.getAllPosts()
          if (Array.isArray(allPosts)) {
            const updatedPost = allPosts.find(p => p.id === postId)
            if (updatedPost) {
              setPosts(prevPosts => prevPosts.map(p => 
                p.id === postId 
                  ? {
                      ...p,
                      userReaction: updatedPost.userReaction || null,
                      reactionCounts: updatedPost.reactionCounts || p.reactionCounts
                    }
                  : p
              ))
            }
          }
        } catch (error) {
          console.error('Error refreshing reaction data:', error)
        }
      }, 500)
      
    } catch (error) {
      console.error('Error updating reaction:', error)
      await loadPosts(false)
      setErrorMessage(error.message || 'Failed to update reaction')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
    setPostContent(post.content)
    const movies = post.mentionedMovies && post.mentionedMovies.length > 0 
      ? [post.mentionedMovies[0]].map(m => ({
          tmdbId: m.tmdbId,
          title: m.title,
          posterPath: m.posterPath
        }))
      : []
    const actors = post.mentionedActors && post.mentionedActors.length > 0
      ? [post.mentionedActors[0]].map(a => ({
          tmdbId: a.tmdbId,
          name: a.name,
          profilePath: a.profilePath
        }))
      : []
    setSelectedMovies(movies)
    setSelectedActors(actors)
    setMentionSearchQuery('')
    setMentionSearchResults([])
    if (movies.length > 0) {
      setMentionType('movie')
    } else if (actors.length > 0) {
      setMentionType('actor')
    } else {
      setMentionType('movie')
    }
    setShowEditModal(true)
  }

  const handleUpdatePost = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!postContent || !postContent.trim()) {
      setErrorMessage('Please enter some content for your post')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    if (!editingPost || !editingPost.id) {
      setErrorMessage('Invalid post to update')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    if (posting) {
      console.warn('Post update already in progress, ignoring duplicate request')
      return
    }

    setPosting(true)
    setErrorMessage('')
    setSuccessMessage('')

    const postId = editingPost.id
    const originalPost = posts.find(p => p.id === postId)
    if (!originalPost) {
      setPosting(false)
      setErrorMessage('Post not found')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    try {
      const content = postContent.trim()
      
      console.log('Updating post:', postId, 'Content only - mentions cannot be changed')
      
      const originalMovies = originalPost.mentionedMovies || []
      const originalActors = originalPost.mentionedActors || []
      
      const optimisticUpdate = {
        ...originalPost,
        content: content,
        mentionedMovies: originalMovies,
        mentionedActors: originalActors
      }
      
      setPosts(prevPosts => prevPosts.map(p => 
        p.id === postId ? optimisticUpdate : p
      ))
      
      setPostContent('')
      setSelectedMovies([])
      setSelectedActors([])
      setMentionSearchQuery('')
      setMentionSearchResults([])
      setMentionType('movie')
      setEditingPost(null)
      setShowEditModal(false)
      
      setSuccessMessage('Post updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      
      const result = await communityService.updatePost(postId, content, [], [])
      
      if (!result || !result.id) {
        throw new Error('Invalid response from server')
      }
      
      console.log('Post updated successfully:', result.id)
      
      const updatedPost = {
        ...result,
        mentionedMovies: Array.isArray(result.mentionedMovies) ? result.mentionedMovies : [],
        mentionedActors: Array.isArray(result.mentionedActors) ? result.mentionedActors : []
      }
      
      setPosts(prevPosts => prevPosts.map(p => 
        p.id === updatedPost.id ? updatedPost : p
      ))
      
    } catch (error) {
      console.error('Error updating post:', error)
      
      if (originalPost) {
        setPosts(prevPosts => prevPosts.map(p => 
          p.id === originalPost.id ? originalPost : p
        ))
      }
      
      let errorMsg = 'Failed to update post. Please try again.'
      if (error && error.message) {
        errorMsg = error.message
      } else if (typeof error === 'string') {
        errorMsg = error
      }
      
      setErrorMessage(errorMsg)
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setPosting(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId))
      
      await communityService.deletePost(postId)
      setSuccessMessage('Post deleted successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      
      setTimeout(async () => {
        await loadPosts(false)
      }, 500)
    } catch (error) {
      console.error('Error deleting post:', error)
      await loadPosts(false)
      setErrorMessage(error.message || 'Failed to delete post')
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  const resetForm = () => {
    setPostContent('')
    setSelectedMovies([])
    setSelectedActors([])
    setMentionSearchQuery('')
    setMentionSearchResults([])
    setMentionType('movie')
    setEditingPost(null)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const reactions = [
    { type: 'LOVE', emoji: '❤️', label: 'Love' },
    { type: 'THUMBS_UP', emoji: '👍', label: 'Thumbs Up' },
    { type: 'SAD', emoji: '😢', label: 'Sad' },
    { type: 'ANGRY', emoji: '😡', label: 'Angry' }
  ]

  return (
    <div className="fan-dashboard">
      <AnimatedBackground />
      <Navbar user={user} />
      
      <div className="container main-content">
        <button 
          className="btn-back"
          onClick={() => navigate('/')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Home
        </button>

        <div className="community-hero">
          <h1 className="community-title">
            <span className="emoji">💬</span> Community
          </h1>
          <p className="community-subtitle">
            Share your thoughts about movies and actors with the community
          </p>
        </div>

        <AlertMessage 
          message={errorMessage} 
          type="error" 
          onClose={() => setErrorMessage('')} 
        />
        <AlertMessage 
          message={successMessage} 
          type="success" 
          onClose={() => setSuccessMessage('')} 
        />

        <div className="create-post-prompt">
          <div className="create-post-prompt-content" onClick={() => setShowCreateModal(true)}>
            <div className="user-avatar-small">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user?.nom || 'User'}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <span style={{ display: user?.profilePicture ? 'none' : 'flex' }}>
                {user.nom ? user.nom.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="create-post-input-placeholder">
              <span>What's on your mind, {user?.nom || 'User'}?</span>
            </div>
            <div className="create-post-actions-preview">
              <i className="bi bi-image"></i>
              <i className="bi bi-film"></i>
              <i className="bi bi-person"></i>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : (
          <div className="posts-container">
            {posts.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-inbox"></i>
                <p>No posts yet. Be the first to share!</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-user">
                      <div className="user-avatar">
                        {post.user?.profilePicture ? (
                          <img 
                            src={post.user.profilePicture} 
                            alt={post.user?.nom || 'User'}
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <span style={{ display: post.user?.profilePicture ? 'none' : 'flex' }}>
                          {post.user?.nom ? post.user.nom.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <div className="user-info">
                        <div className="user-name">{post.user?.nom || 'Unknown User'}</div>
                        <div className="post-date">{formatDate(post.createdAt)}</div>
                      </div>
                    </div>
                    {post.user?.id === user?.id && (
                      <div className="post-actions">
                        <button
                          className="post-action-btn edit-btn"
                          onClick={() => handleEditPost(post)}
                          title="Edit post"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="post-action-btn delete-btn"
                          onClick={() => handleDeletePost(post.id)}
                          title="Delete post"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="post-body">
                    <div className="post-content-wrapper">
                      <div className="post-content">
                        <p>{post.content}</p>
                      </div>
                    </div>
                    
                    {((post.mentionedMovies && Array.isArray(post.mentionedMovies) && post.mentionedMovies.length > 0) || 
                     (post.mentionedActors && Array.isArray(post.mentionedActors) && post.mentionedActors.length > 0)) && (
                      <div className="post-mention-sidebar">
                        {post.mentionedMovies && Array.isArray(post.mentionedMovies) && post.mentionedMovies.length > 0 && (
                          post.mentionedMovies.map((movie, idx) => {
                            console.log(`Movie ${idx}:`, movie)
                            const posterPath = movie.posterPath ? (movie.posterPath.startsWith('/') ? movie.posterPath : `/${movie.posterPath}`) : null
                            const posterUrl = posterPath ? `${TMDB_IMAGE_BASE}${posterPath}` : null
                            console.log(`Movie ${idx} poster URL:`, posterUrl)
                            return (
                              <div key={movie.tmdbId || idx} className="mention-sidebar-card movie-sidebar">
                                <div className="mention-sidebar-image">
                                  {posterUrl ? (
                                    <img 
                                      src={posterUrl} 
                                      alt={movie.title || 'Movie'}
                                      className="mention-sidebar-poster"
                                      onError={(e) => {
                                        console.error('Failed to load poster:', posterUrl, movie)
                                        e.target.style.display = 'none'
                                        const placeholder = e.target.nextElementSibling
                                        if (placeholder && placeholder.classList.contains('mention-sidebar-placeholder-fallback')) {
                                          placeholder.style.display = 'flex'
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div className="mention-sidebar-placeholder" style={{ display: movie.posterPath ? 'none' : 'flex' }}>
                                    <i className="bi bi-film"></i>
                                  </div>
                                  {movie.posterPath && (
                                    <div className="mention-sidebar-placeholder mention-sidebar-placeholder-fallback" style={{ display: 'none' }}>
                                      <i className="bi bi-film"></i>
                                    </div>
                                  )}
                                  <div className="mention-sidebar-overlay">
                                    <div className="mention-sidebar-title">{movie.title || 'Unknown Movie'}</div>
                                  </div>
                                </div>
                                <div className="mention-sidebar-info">
                                  <i className="bi bi-film-fill"></i>
                                  <span className="mention-sidebar-name">{movie.title || 'Unknown Movie'}</span>
                                </div>
                              </div>
                            )
                          })
                        )}
                        {post.mentionedActors && Array.isArray(post.mentionedActors) && post.mentionedActors.length > 0 && (
                          post.mentionedActors.map((actor, idx) => {
                            console.log(`Actor ${idx}:`, actor)
                            const profilePath = actor.profilePath ? (actor.profilePath.startsWith('/') ? actor.profilePath : `/${actor.profilePath}`) : null
                            const profileUrl = profilePath ? `${TMDB_PROFILE_BASE}${profilePath}` : null
                            console.log(`Actor ${idx} profile URL:`, profileUrl)
                            return (
                              <div key={actor.tmdbId || idx} className="mention-sidebar-card actor-sidebar">
                                <div className="mention-sidebar-image">
                                  {profileUrl ? (
                                    <img 
                                      src={profileUrl} 
                                      alt={actor.name || 'Actor'}
                                      className="mention-sidebar-profile"
                                      onError={(e) => {
                                        console.error('Failed to load profile:', profileUrl, actor)
                                        e.target.style.display = 'none'
                                        const placeholder = e.target.nextElementSibling
                                        if (placeholder && placeholder.classList.contains('mention-sidebar-placeholder-fallback')) {
                                          placeholder.style.display = 'flex'
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div className="mention-sidebar-placeholder actor-sidebar-placeholder" style={{ display: actor.profilePath ? 'none' : 'flex' }}>
                                    <i className="bi bi-person-circle"></i>
                                  </div>
                                  {actor.profilePath && (
                                    <div className="mention-sidebar-placeholder mention-sidebar-placeholder-fallback actor-sidebar-placeholder" style={{ display: 'none' }}>
                                      <i className="bi bi-person-circle"></i>
                                    </div>
                                  )}
                                  <div className="mention-sidebar-overlay">
                                    <div className="mention-sidebar-title">{actor.name || 'Unknown Actor'}</div>
                                  </div>
                                </div>
                                <div className="mention-sidebar-info">
                                  <i className="bi bi-person-fill"></i>
                                  <span className="mention-sidebar-name">{actor.name || 'Unknown Actor'}</span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <div className="post-reactions">
                    {reactions.map(reaction => {
                      const count = post.reactionCounts?.[reaction.type] || 0
                      const isActive = post.userReaction === reaction.type
                      return (
                        <button
                          key={reaction.type}
                          className={`reaction-btn ${isActive ? 'active' : ''}`}
                          onClick={() => handleReaction(post.id, reaction.type)}
                          title={reaction.label}
                        >
                          <span className="reaction-emoji">{reaction.emoji}</span>
                          {count > 0 && <span className="reaction-count">{count}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCreateModal(false)
            resetForm()
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Post</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="create-post-form">
              <div className="form-group">
                <label>What's on your mind?</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share your thoughts about a movie or actor..."
                  rows="5"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mention (optional - only one movie OR one actor allowed)</label>
                
                <div className="mention-type-selector">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="mentionType"
                      value="movie"
                      checked={mentionType === 'movie'}
                      onChange={(e) => {
                        setMentionType(e.target.value)
                        setMentionSearchQuery('')
                        setMentionSearchResults([])
                        setSelectedActors([])
                      }}
                    />
                    <span>   </span>
                    <span>   </span>
                    <i className="bi bi-film"> </i>
                    <span> Movie</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="mentionType"
                      value="actor"
                      checked={mentionType === 'actor'}
                      onChange={(e) => {
                        setMentionType(e.target.value)
                        setMentionSearchQuery('')
                        setMentionSearchResults([])
                        setSelectedMovies([])
                      }}
                    />
                    <i className="bi bi-person"> </i>
                    <span>Actor</span>
                  </label>
                </div>

                <input
                  type="text"
                  value={mentionSearchQuery}
                  onChange={(e) => {
                    setMentionSearchQuery(e.target.value)
                    searchMention(e.target.value)
                  }}
                  placeholder={mentionType === 'movie' ? 'Search for a movie...' : 'Search for an actor...'}
                  disabled={selectedMovies.length > 0 || selectedActors.length > 0}
                />

                {mentionSearchResults.length > 0 && (
                  <div className="search-results">
                    {mentionType === 'movie' ? (
                      mentionSearchResults.map(movie => (
                        <div
                          key={movie.tmdb_id}
                          className="search-result-item"
                          onClick={() => handleMovieSelect(movie)}
                        >
                          {movie.url && (
                            <img src={movie.url} alt={movie.titre} className="result-image" />
                          )}
                          <span>{movie.titre}</span>
                        </div>
                      ))
                    ) : (
                      mentionSearchResults.map(actor => (
                        <div
                          key={actor.tmdbId}
                          className="search-result-item"
                          onClick={() => handleActorSelect(actor)}
                        >
                          {actor.profilePath && (
                            <img 
                              src={`${TMDB_PROFILE_BASE}${actor.profilePath}`} 
                              alt={actor.name} 
                              className="result-image" 
                            />
                          )}
                          <span>{actor.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedMovies.length > 0 && (
                  <div className="selected-items">
                    {selectedMovies.map(movie => (
                      <div key={movie.tmdbId} className="selected-item">
                        <span>{movie.title}</span>
                        <button
                          type="button"
                          onClick={() => removeMovie(movie.tmdbId)}
                          className="remove-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedActors.length > 0 && (
                  <div className="selected-items">
                    {selectedActors.map(actor => (
                      <div key={actor.tmdbId} className="selected-item">
                        <span>{actor.name}</span>
                        <button
                          type="button"
                          onClick={() => removeActor(actor.tmdbId)}
                          className="remove-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline-hero"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-film"
                  disabled={posting || !postContent.trim()}
                >
                  {posting ? (
                    <>
                      <span className="spinner-small"></span>
                      Posting...
                    </>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingPost && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowEditModal(false)
            resetForm()
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Post</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false)
                  resetForm()
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdatePost} className="create-post-form">
              <div className="form-group">
                <label>What's on your mind?</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share your thoughts about a movie or actor..."
                  rows="5"
                  required
                />
              </div>

              {selectedMovies.length > 0 && (
                <div className="form-group">
                  <label>Mentioned Movie (cannot be changed)</label>
                  <div className="selected-items" style={{ opacity: 0.7, pointerEvents: 'none' }}>
                    {selectedMovies.map(movie => (
                      <div key={movie.tmdbId} className="selected-item">
                        <span>{movie.title}</span>
                      </div>
                    ))}
                  </div>
                  <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>
                    You can only edit the text content, not the mentioned movie or actor.
                  </small>
                </div>
              )}

              {selectedActors.length > 0 && (
                <div className="form-group">
                  <label>Mentioned Actor (cannot be changed)</label>
                  <div className="selected-items" style={{ opacity: 0.7, pointerEvents: 'none' }}>
                    {selectedActors.map(actor => (
                      <div key={actor.tmdbId} className="selected-item">
                        <span>{actor.name}</span>
                      </div>
                    ))}
                  </div>
                  <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>
                    You can only edit the text content, not the mentioned movie or actor.
                  </small>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline-hero"
                  onClick={() => {
                    setShowEditModal(false)
                    resetForm()
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-film"
                  disabled={posting || !postContent.trim()}
                >
                  {posting ? (
                    <>
                      <span className="spinner-small"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Post'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
      <FriendButton />
    </div>
  )
}

export default Community

