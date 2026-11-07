import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AnimatedBackground from '../components/layout/AnimatedBackground'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import CommentModal from '../components/movies/CommentModal'
import FriendButton from '../components/layout/FriendButton'
import { actorService, filmService, userService, commentService } from '../services/api'
import './MovieDetails.css'

function ActorDetails() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const actorId = searchParams.get('id')
  
  const [actor, setActor] = useState(null)
  const [actorFilms, setActorFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [comments, setComments] = useState([])
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [commentForm, setCommentForm] = useState({
    rating: 0,
    comment: ''
  })
  const [hoveredRating, setHoveredRating] = useState(0)
  const [actorStats, setActorStats] = useState({
    totalFilms: 0,
    genres: [],
    years: []
  })

  // Fetch actor details from TMDB API
  useEffect(() => {
    const fetchActorData = async () => {
      if (!actorId) {
        setErrorMessage('No actor ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Don't set user here, will be set after actor data is loaded

        // Fetch full actor details from TMDB API
        const actorData = await actorService.getActorById(actorId)
        
        setActor({
          nom: actorData.nom,
          biography: actorData.biography,
          profile_image: actorData.profile_image,
          known_for: actorData.known_for,
          birthday: actorData.birthday,
          place_of_birth: actorData.place_of_birth,
          age: actorData.age,
          popularity: actorData.popularity,
          totalFilms: actorData.total_movies || 0,
          tmdb_id: actorData.tmdb_id,
        })
        
        // Check if current user is an actor viewing their own page
        const currentUser = await userService.getCurrentUser().catch(() => null)
        if (currentUser?.role === 'acteur' && currentUser?.nom === actorData.nom) {
          // Actor viewing their own page - they cannot comment
          setUser({ ...currentUser, isViewingSelf: true })
        } else {
          setUser(currentUser || null)
        }
        
        // Set filmography
        setActorFilms(actorData.filmography || [])
        
        // Calculate statistics from filmography
        // Note: TMDB combined_credits doesn't include genre, so we'll skip genre stats
        const years = actorData.filmography?.map(f => f.annee_sortie).filter(Boolean).filter(y => y !== 'N/A').sort() || []
        const firstYear = years[0] || 'N/A'
        const lastYear = years[years.length - 1] || 'N/A'
        
        setActorStats({
          totalFilms: actorData.filmography?.length || 0,
          genres: [], // TMDB combined_credits doesn't include genre info
          years: years,
          firstYear: firstYear,
          lastYear: lastYear,
        })

        // Fetch actor comments
        const commentsData = await commentService.getActorComments(actorId)
        setComments(commentsData)
      } catch (error) {
        console.error('Error fetching actor data:', error)
        setErrorMessage('Failed to load actor details. Please try again.')
        // Set fallback actor data
        const fallbackName = actorId.replace(/_actor_/g, ' ')
        setActor({ 
          nom: fallbackName, 
          biography: 'No information available about this actor.',
          totalFilms: 0,
        })
        setActorFilms([])
        setActorStats({
          totalFilms: 0,
          genres: [],
          years: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchActorData()
  }, [actorId])

  // Check if actor is in favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!actor || !actor.tmdb_id) return
      
      try {
        const base = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
        const token = localStorage.getItem('authToken')
        if (!token) {
          setIsFavorite(false)
          return
        }
        
        const headers = { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        }
        
        const res = await fetch(`${base}/api/favorites/actors`, { headers })
        if (res.ok) {
          const favoriteActors = await res.json()
          const tmdbActorId = actor.tmdb_id.toString()
          const isInFavorites = favoriteActors.some(a => 
            (a.actorId || a.id || '').toString() === tmdbActorId
          )
          setIsFavorite(isInFavorites)
        } else {
          setIsFavorite(false)
        }
      } catch (error) {
        console.error('Error checking favorite status:', error)
        setIsFavorite(false)
      }
    }
    
    checkFavoriteStatus()
  }, [actor])

  // Auto-hide messages
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Cleanup modal overflow
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Handle comment modal open
  const handleOpenCommentModal = () => {
    setShowCommentModal(true)
    setCommentForm({ rating: 0, comment: '' })
    document.body.style.overflow = 'hidden'
  }

  // Handle comment modal close
  const handleCloseModal = () => {
    setShowCommentModal(false)
    setCommentForm({ rating: 0, comment: '' })
    document.body.style.overflow = 'unset'
  }

  // Handle rating click
  const handleRatingClick = (rating) => {
    setCommentForm({ ...commentForm, rating })
  }

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentForm.rating || !commentForm.comment) {
      setErrorMessage('Please fill in all required fields.')
      return
    }
    
    try {
      await commentService.submitActorComment(actorId, {
        rating: commentForm.rating,
        comment: commentForm.comment
      })
      setSuccessMessage('Comment added successfully!')
      
      // Refresh comments
      const commentsData = await commentService.getActorComments(actorId)
      setComments(commentsData)
      
      handleCloseModal()
    } catch (error) {
      console.error('Error submitting comment:', error)
      setErrorMessage(error.response?.data?.message || 'Failed to submit comment. Please try again.')
    }
  }

  // Calculate average rating from comments
  const calculateAverageRating = () => {
    if (comments.length === 0) return 0
    const sum = comments.reduce((acc, comment) => acc + (comment.note || 0), 0)
    return (sum / comments.length).toFixed(1)
  }

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      await commentService.deleteActorComment(actorId, commentId)
      setSuccessMessage('Comment deleted successfully!')
      
      // Refresh comments
      const commentsData = await commentService.getActorComments(actorId)
      setComments(commentsData)
    } catch (error) {
      console.error('Error deleting comment:', error)
      setErrorMessage('Failed to delete comment. Please try again.')
    }
  }

  // Handle add to favorites
  const handleAddToFavorites = async () => {
    if (!actor || !actor.nom) {
      setErrorMessage('Actor information not available.')
      return
    }

    try {
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      
      // Use TMDB actor ID (actorId should be the TMDB ID)
      const tmdbActorId = actor.tmdb_id ? actor.tmdb_id.toString() : actorId
      
      if (isFavorite) {
        const res = await fetch(`${base}/api/favorites/actors/${encodeURIComponent(tmdbActorId)}`, {
          method: 'DELETE',
          headers
        })
        if (!res.ok) throw new Error('Failed to remove')
        setIsFavorite(false)
        setSuccessMessage(`${actor.nom} removed from favorite actors!`)
      } else {
        // Build query params with profile image URL
        const params = new URLSearchParams({
          actorName: actor.nom
        })
        if (actor.profile_image) {
          params.append('profileImageUrl', actor.profile_image)
        }
        
        const res = await fetch(`${base}/api/favorites/actors/${encodeURIComponent(tmdbActorId)}?${params.toString()}`, {
          method: 'POST',
          headers
        })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(txt || 'Failed to add')
        }
        setIsFavorite(true)
        setSuccessMessage(`${actor.nom} added to favorite actors!`)
      }
    } catch (error) {
      console.error('Error managing favorites:', error)
      setErrorMessage('Failed to update favorites. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="fan-dashboard">
        <AnimatedBackground />
        <Navbar user={user} />
        <div className="main-content">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading actor details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!actor) {
    return (
      <div className="fan-dashboard">
        <AnimatedBackground />
        <Navbar user={user} />
        <div className="main-content">
          <div className="text-center py-5">
            <h2 className="text-white">Actor not found</h2>
            <button 
              className="btn btn-film mt-3"
              onClick={() => navigate('/')}
            >
              Go Back Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="fan-dashboard">
      <AnimatedBackground />
      <Navbar user={user} />
      
      <div className="container main-content">
        <AlertMessage 
          type="danger" 
          message={errorMessage} 
          onClose={() => setErrorMessage('')} 
        />
        <AlertMessage 
          type="success" 
          message={successMessage} 
          onClose={() => setSuccessMessage('')} 
        />

        {/* Back Button */}
        <button 
          className="btn-back"
          onClick={() => navigate('/')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Movies
        </button>

        {/* Actor Header Section */}
        <div className="movie-details-header">
          <div className="movie-poster-section">
            {actor.profile_image ? (
              <img 
                src={actor.profile_image} 
                alt={actor.nom}
                className="actor-image-large"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div className="actor-icon-large" style={{ display: actor.profile_image ? 'none' : 'flex' }}>
              <i className="bi bi-person-circle"></i>
            </div>
          </div>
          
          <div className="movie-info-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <h1 className="movie-title" style={{ flex: 1, margin: 0 }}>{actor.nom || 'Unknown Actor'}</h1>
              <button
                className="btn-add-favorite-actor"
                onClick={handleAddToFavorites}
                title={isFavorite ? "Remove from Favorite Actors" : "Add to Favorite Actors"}
                style={{
                  position: 'relative',
                  top: 0,
                  right: 0,
                  background: isFavorite ? 'var(--maver-lightblue)' : 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${isFavorite ? 'var(--maver-lightblue)' : 'rgba(65, 173, 213, 0.4)'}`,
                  color: 'var(--maver-white)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (!isFavorite) {
                    e.target.style.background = 'rgba(80, 189, 211, 0.2)'
                    e.target.style.borderColor = 'var(--maver-lightblue)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isFavorite) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.target.style.borderColor = 'rgba(65, 173, 213, 0.4)'
                  }
                }}
              >
                <i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}`}></i>
              </button>
            </div>
            
            <div className="movie-meta-info">
              <span className="movie-genre-badge">Actor</span>
              {actor.totalFilms > 0 && (
                <span className="movie-genre-badge" style={{ marginLeft: '0.5rem' }}>
                  <i className="bi bi-film me-1"></i>
                  {actor.totalFilms} {actor.totalFilms === 1 ? 'Film' : 'Films'}
                </span>
              )}
              {comments.length > 0 && (
                <span className="movie-genre-badge" style={{ marginLeft: '0.5rem' }}>
                  <i className="bi bi-star-fill me-1"></i>
                  {calculateAverageRating()}/5 ({comments.length} {comments.length === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>

            {/* Actor Information */}
            <div className="movie-additional-info" style={{ marginTop: '1.5rem' }}>
              {actor.birthday && (
                <div className="info-item">
                  <strong><i className="bi bi-calendar3 me-2"></i>Birthday:</strong>
                  <span>{new Date(actor.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}{actor.age ? ` (${actor.age} years old)` : ''}</span>
                </div>
              )}
              {actor.place_of_birth && (
                <div className="info-item">
                  <strong><i className="bi bi-geo-alt me-2"></i>Place of Birth:</strong>
                  <span>{actor.place_of_birth}</span>
                </div>
              )}
              {actor.known_for && (
                <div className="info-item">
                  <strong><i className="bi bi-star me-2"></i>Known For:</strong>
                  <span>{actor.known_for}</span>
                </div>
              )}
              {actorStats.firstYear && actorStats.lastYear && (
                <div className="info-item">
                  <strong><i className="bi bi-calendar-range me-2"></i>Career Span:</strong>
                  <span>{actorStats.firstYear} - {actorStats.lastYear}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Biography Section */}
        {actor.biography && (
          <div className="movie-section">
            <h2 className="section-title-details">
              <i className="bi bi-file-text-fill me-2"></i>
              Biography
            </h2>
            <div className="actor-biography">
              <p className="movie-description">{actor.biography}</p>
            </div>
          </div>
        )}

        {/* Actor Films Section */}
        {actorFilms.length > 0 && (
          <div className="movie-section">
            <h2 className="section-title-details">
              <i className="bi bi-collection-play-fill me-2"></i>
              Filmography ({actorFilms.length} {actorFilms.length === 1 ? 'Credit' : 'Credits'})
            </h2>
            <div className="similar-movies-grid">
              {actorFilms.slice(0, 6).map((film, idx) => (
                <div 
                  key={film.id ?? `film-${idx}`}
                  className="similar-movie-card"
                  onClick={() => navigate(`/film-details?id=${film.id}`)}
                  title={film.character ? `As ${film.character}` : film.titre}
                >
                  <img
                    src={film.url}
                    alt={film.titre}
                    className="similar-movie-poster"
                    onError={(e) => {
                      e.target.src = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=400&fit=crop&crop=faces`
                    }}
                  />
                  <div className="similar-movie-overlay">
                    <h5>{film.titre}</h5>
                    <span className="similar-movie-year">{film.annee_sortie}</span>
                    {film.character && (
                      <span className="similar-movie-character" style={{ 
                        display: 'block', 
                        fontSize: '0.85rem', 
                        fontStyle: 'italic', 
                        marginTop: '0.25rem',
                        color: 'rgba(255, 255, 255, 0.9)'
                      }}>
                        as {film.character}
                      </span>
                    )}
                    {film.media_type && film.media_type !== 'movie' && (
                      <span className="similar-movie-type" style={{ 
                        display: 'block', 
                        fontSize: '0.75rem', 
                        marginTop: '0.25rem',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}>
                        {film.media_type === 'tv' ? 'TV Series' : film.media_type}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="movie-section">
          <div className="comments-header">
            <h2 className="section-title-details">
              <i className="bi bi-chat-left-text-fill me-2"></i>
              Comments & Reviews
            </h2>
            {!(user?.role === 'acteur' && user?.isViewingSelf) && (
              <button 
                className="btn btn-film"
                onClick={handleOpenCommentModal}
              >
                <i className="bi bi-plus-circle-fill me-1"></i>
                Add Comment
              </button>
            )}
          </div>

          {comments.length === 0 ? (
            <div className="no-comments">
              <i className="bi bi-chat-left-dots"></i>
              <p>No comments yet. Be the first to review this actor!</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment, idx) => {
                const isOwner = user && comment.fan && (comment.fan.id === user.id || comment.fanId === user.id)
                return (
                  <div key={comment.id ?? `comment-${idx}`} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-user-info">
                        <div className="comment-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`comment-star ${star <= comment.note ? 'active' : ''}`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="comment-rating-value">{comment.note}/5</span>
                        </div>
                        <div className="comment-author">
                          <i className="bi bi-person-fill"></i>
                          <span className="comment-author-name">
                            {comment.fan?.nom || comment.fanName || 'Anonymous'}
                          </span>
                          {comment.fan?.email && (
                            <span className="comment-author-email">({comment.fan.email})</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="comment-date">
                          {new Date(comment.dateCommentaire || comment.date).toLocaleDateString()}
                        </span>
                        {isOwner && (
                          <button
                            className="btn-delete-comment"
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Delete comment"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="comment-text">{comment.commentaire}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <CommentModal 
        show={showCommentModal}
        selectedFilm={{ titre: actor?.nom || 'Actor', annee_sortie: '' }}
        commentForm={commentForm}
        hoveredRating={hoveredRating}
        onClose={handleCloseModal}
        onSubmit={handleCommentSubmit}
        onRatingClick={handleRatingClick}
        onRatingHover={setHoveredRating}
        onCommentChange={(value) => setCommentForm({ ...commentForm, comment: value })}
      />

      <Footer />
      <FriendButton />
    </div>
  )
}

export default ActorDetails

