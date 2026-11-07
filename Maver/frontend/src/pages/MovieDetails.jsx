import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './MovieDetails.css'
import AnimatedBackground from '../components/layout/AnimatedBackground'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import CommentModal from '../components/movies/CommentModal'
import FriendButton from '../components/layout/FriendButton'
import { filmService, commentService, userService, API_BASE, getAuthHeaders } from '../services/api'

function MovieDetails() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const filmId = searchParams.get('id')
  
  const [film, setFilm] = useState(null)
  const [similarFilms, setSimilarFilms] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const isActor = user?.role === 'acteur'
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [commentForm, setCommentForm] = useState({
    rating: 0,
    comment: ''
  })
  const [hoveredRating, setHoveredRating] = useState(0)
  const [showWatchlistModal, setShowWatchlistModal] = useState(false)
  const [watchlists, setWatchlists] = useState([])
  const [loadingWatchlists, setLoadingWatchlists] = useState(false)

  // Fetch movie details and related data
  useEffect(() => {
    const fetchMovieData = async () => {
      if (!filmId) {
        setErrorMessage('No movie ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [filmData, userData] = await Promise.all([
          filmService.getFilmById(filmId),
          userService.getCurrentUser().catch(() => null)
        ])
        
        setFilm(filmData)
        setUser(userData)
        
        // Fetch similar movies in the same genre
        if (filmData.genre) {
          const similarData = await filmService.getFilms({ genre: filmData.genre })
          // Filter out the current movie and limit to 6 similar movies
          const similar = similarData
            .filter(f => f.id !== filmId)
            .slice(0, 6)
          setSimilarFilms(similar)
        }
        
        // Fetch comments
        const commentsData = await commentService.getFilmComments(filmId)
        setComments(commentsData)
      } catch (error) {
        console.error('Error fetching movie data:', error)
        setErrorMessage('Failed to load movie details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchMovieData()
  }, [filmId])

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
    
    // Check if user is logged in
    if (!user || !localStorage.getItem('authToken')) {
      setErrorMessage('You must be logged in to post comments.')
      return
    }
    
    try {
      await commentService.submitComment(filmId, {
        rating: commentForm.rating,
        comment: commentForm.comment
      })
      setSuccessMessage('Comment added successfully!')
      
      // Refresh comments
      const commentsData = await commentService.getFilmComments(filmId)
      setComments(commentsData)
      
      handleCloseModal()
    } catch (error) {
      console.error('Error submitting comment:', error)
      setErrorMessage(error.message || 'Failed to submit comment. Please try again.')
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
      await commentService.deleteComment(filmId, commentId)
      setSuccessMessage('Comment deleted successfully!')
      
      // Refresh comments
      const commentsData = await commentService.getFilmComments(filmId)
      setComments(commentsData)
    } catch (error) {
      console.error('Error deleting comment:', error)
      setErrorMessage('Failed to delete comment. Please try again.')
    }
  }

  // Load watchlists when modal opens
  useEffect(() => {
    if (showWatchlistModal) {
      loadWatchlists()
    }
  }, [showWatchlistModal])

  // Load watchlists
  const loadWatchlists = async () => {
    try {
      setLoadingWatchlists(true)
      const res = await fetch(`${API_BASE}/api/watchlists`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setWatchlists(Array.isArray(data) ? data : [])
      } else {
        if (res.status === 401) {
          setErrorMessage('Please log in to add movies to watchlists.')
          setShowWatchlistModal(false)
        } else {
          setWatchlists([])
        }
      }
    } catch (error) {
      console.error('Error loading watchlists:', error)
      setWatchlists([])
    } finally {
      setLoadingWatchlists(false)
    }
  }

  // Handle adding movie to watchlist
  const handleAddToWatchlist = async (listId) => {
    try {
      const res = await fetch(`${API_BASE}/api/watchlists/${listId}/movies/${encodeURIComponent(filmId)}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (!res.ok) {
        const txt = await res.text()
        if (res.status === 409) {
          throw new Error('Movie is already in this watchlist')
        }
        throw new Error(txt || 'Failed to add movie to watchlist')
      }
      setSuccessMessage(`Movie added to watchlist successfully!`)
      setShowWatchlistModal(false)
      // Reload watchlists to update the "already added" status
      loadWatchlists()
    } catch (error) {
      console.error('Error adding movie to watchlist:', error)
      setErrorMessage(error.message || 'Failed to add movie to watchlist.')
    }
  }

  // Auto-hide messages
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
        setErrorMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage])

  // Cleanup modal overflow
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

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
            <p className="mt-3">Loading movie details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!film) {
    return (
      <div className="fan-dashboard">
        <AnimatedBackground />
        <Navbar user={user} />
        <div className="main-content">
          <div className="text-center py-5">
            <h2 className="text-white">Movie not found</h2>
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

  const averageRating = calculateAverageRating()
  const tmdbRating = film.vote_average ? film.vote_average.toFixed(1) : 'N/A'
  const plot = film.overview || 'No description available.'
  const director = film.director || 'N/A'
  const writer = film.writer || 'N/A'
  const runtime = film.runtime || 'N/A'
  const released = film.release_date || film.annee_sortie
  const trailerKey = film.trailer_key

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

        {/* Movie Header Section */}
        <div className="movie-details-header">
          <div className="movie-poster-section">
            <img
              src={film.url}
              alt={film.titre}
              className="movie-details-poster"
              onError={(e) => {
                e.target.src = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=400&fit=crop&crop=faces`
              }}
            />
          </div>
          
          <div className="movie-info-section">
            <h1 className="movie-title">{film.titre}</h1>
            
            <div className="movie-meta-info">
              <span className="movie-year">
                <i className="bi bi-calendar3 me-1"></i>
                {released}
              </span>
              <span className="movie-genre-badge">{film.genre}</span>
              {runtime !== 'N/A' && (
                <span className="movie-runtime">
                  <i className="bi bi-clock me-1"></i>
                  {runtime}
                </span>
              )}
            </div>

            {/* Ratings */}
            <div className="movie-ratings">
              {tmdbRating !== 'N/A' && (
                <div className="rating-item">
                  <span className="rating-label">TMDB Rating:</span>
                  <span className="rating-value">{tmdbRating}/10</span>
                  <i className="bi bi-star-fill rating-icon"></i>
                </div>
              )}
              {comments.length > 0 && (
                <div className="rating-item">
                  <span className="rating-label">User Rating:</span>
                  <span className="rating-value">{averageRating}/5</span>
                  <i className="bi bi-star-fill rating-icon"></i>
                  <span className="rating-count">({comments.length} {comments.length === 1 ? 'review' : 'reviews'})</span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="movie-additional-info">
              {director !== 'N/A' && (
                <div className="info-item">
                  <strong><i className="bi bi-camera-reels me-2"></i>Director:</strong>
                  <span>{director}</span>
                </div>
              )}
              {writer !== 'N/A' && (
                <div className="info-item">
                  <strong><i className="bi bi-pencil me-2"></i>Writer:</strong>
                  <span>{writer}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!isActor && (
              <div className="movie-action-buttons">
                <button 
                  className="btn btn-film btn-add-watchlist"
                  onClick={() => setShowWatchlistModal(true)}
                >
                  <i className="bi bi-bookmark-plus-fill me-2"></i>
                  Add to Watchlist
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trailer and Description Section - Side by Side */}
        <div className="movie-section">
          <div className="trailer-description-grid">
            {/* Trailer Section */}
            <div className="trailer-section-side">
              <h2 className="section-title-details">
                <i className="bi bi-play-circle-fill me-2"></i>
                Trailer & Videos
              </h2>
              <div className="trailer-container">
                {trailerKey ? (
                  <>
                    <div className="trailer-wrapper">
                      <iframe
                        src={`https://www.youtube.com/embed/${trailerKey}`}
                        title={`${film.titre} Trailer`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="trailer-iframe"
                      ></iframe>
                    </div>
                    <p className="trailer-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Official trailer for "{film.titre}"
                    </p>
                  </>
                ) : (
                  <div className="no-trailer">
                    <i className="bi bi-film"></i>
                    <p>No trailer available for this movie.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="description-section-side">
              <h2 className="section-title-details">
                <i className="bi bi-file-text-fill me-2"></i>
                Description
              </h2>
              <p className="movie-description">{plot}</p>
            </div>
          </div>
        </div>

        {/* Actors Section */}
        {film.acteurs && film.acteurs.length > 0 && (
          <div className="movie-section">
            <h2 className="section-title-details">
              <i className="bi bi-people-fill me-2"></i>
              Cast
            </h2>
            <div className="actors-grid">
              {film.acteurs?.map((actor, index) => {
                // Use the actor's existing ID if available, otherwise construct it
                // The actor ID should include tmdb_id for proper lookup
                const actorId = actor.id || `${filmId}_actor_${actor.tmdb_id || index}`
                
                return (
                  <div 
                    key={actor.id ?? `actor-${index}`} 
                    className="actor-card"
                    onClick={() => navigate(`/acteur-details?id=${actorId}`)}
                  >
                    {actor.profile_image ? (
                      <img
                        src={actor.profile_image}
                        alt={actor.nom}
                        className="actor-image"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className="actor-icon" style={{ display: actor.profile_image ? 'none' : 'flex' }}>
                      <i className="bi bi-person-circle"></i>
                    </div>
                    <span className="actor-name">{actor.nom}</span>
                    {actor.character && (
                      <span className="actor-character">{actor.character}</span>
                    )}
                    <button
                      className="btn-add-favorite-actor"
                      onClick={async (e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        try {
                          // Use the actual TMDB actor ID (not the constructed ID)
                          const tmdbActorId = actor.tmdb_id ? actor.tmdb_id.toString() : actorId
                          const base = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
                          const token = localStorage.getItem('authToken')
                          
                          if (!token) {
                            setErrorMessage('Please log in to add favorite actors.')
                            return
                          }
                          
                          const headers = { 
                            'Content-Type': 'application/json', 
                            Authorization: `Bearer ${token}` 
                          }
                          
                          // Build query params with profile image URL
                          const params = new URLSearchParams({
                            actorName: actor.nom || 'Unknown Actor'
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
                            throw new Error(txt || 'Failed to add favorite actor')
                          }
                          
                          setSuccessMessage(`${actor.nom} added to favorite actors!`)
                          setTimeout(() => setSuccessMessage(''), 3000)
                        } catch (err) {
                          console.error('Error adding favorite actor:', err)
                          setErrorMessage(err.message || 'Failed to add favorite actor.')
                          setTimeout(() => setErrorMessage(''), 3000)
                        }
                      }}
                      title="Add to Favorite Actors"
                    >
                      <i className="bi bi-heart"></i>
                    </button>
                  </div>
                )
              })}
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
            {!isActor && user && localStorage.getItem('authToken') && (
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
              <p>No comments yet. Be the first to review this movie!</p>
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
                            {comment.fan?.nom || comment.fanName || 'Unknown User'}
                          </span>
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

        {/* Similar Movies Section */}
        {similarFilms.length > 0 && (
          <div className="movie-section">
            <h2 className="section-title-details">
              <i className="bi bi-collection-play-fill me-2"></i>
              Similar Movies
            </h2>
            <div className="similar-movies-grid">
              {similarFilms.map((similarFilm, idx) => (
                <div 
                  key={similarFilm.id ?? `similar-${idx}`}
                  className="similar-movie-card"
                  onClick={() => navigate(`/film-details?id=${similarFilm.id}`)}
                >
                  <img
                    src={similarFilm.url}
                    alt={similarFilm.titre}
                    className="similar-movie-poster"
                    onError={(e) => {
                      e.target.src = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=400&fit=crop&crop=faces`
                    }}
                  />
                  <div className="similar-movie-overlay">
                    <h5>{similarFilm.titre}</h5>
                    <span className="similar-movie-year">{similarFilm.annee_sortie}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isActor && (
        <CommentModal 
          show={showCommentModal}
          selectedFilm={film}
          commentForm={commentForm}
          hoveredRating={hoveredRating}
          onClose={handleCloseModal}
          onSubmit={handleCommentSubmit}
          onRatingClick={handleRatingClick}
          onRatingHover={setHoveredRating}
          onCommentChange={(value) => setCommentForm({ ...commentForm, comment: value })}
        />
      )}

      {/* Watchlist Selection Modal */}
      {showWatchlistModal && (
        <div className="modal-overlay" onClick={() => setShowWatchlistModal(false)}>
          <div className="modal-content modal-watchlist" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-bookmark-fill me-2"></i>
                Add to Watchlist
              </h5>
              <button className="modal-close" onClick={() => setShowWatchlistModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {loadingWatchlists ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading watchlists...</p>
                </div>
              ) : watchlists.length === 0 ? (
                <div className="empty-state text-center py-4">
                  <i className="bi bi-bookmark" style={{ fontSize: '3rem', color: '#666', marginBottom: '1rem' }}></i>
                  <h4>No watchlists yet</h4>
                  <p>Create a watchlist first to add movies to it.</p>
                  <button 
                    className="btn btn-film mt-3"
                    onClick={() => {
                      setShowWatchlistModal(false)
                      navigate('/watchlist')
                    }}
                  >
                    <i className="bi bi-plus-circle-fill me-2"></i>
                    Create Watchlist
                  </button>
                </div>
              ) : (
                <div className="watchlist-selection-list">
                  {watchlists.map((list) => {
                    const isMovieInList = list.movies?.some(m => (m.filmId || m.id) === filmId)
                    return (
                      <div 
                        key={list.id} 
                        className={`watchlist-selection-item ${isMovieInList ? 'disabled' : ''}`}
                        onClick={() => !isMovieInList && handleAddToWatchlist(list.id)}
                      >
                        <div className="watchlist-selection-info">
                          <h6 className="watchlist-selection-name">
                            <i className="bi bi-bookmark-fill me-2"></i>
                            {list.name}
                          </h6>
                          <p className="watchlist-selection-count">
                            {list.movies?.length || 0} {list.movies?.length === 1 ? 'movie' : 'movies'}
                          </p>
                        </div>
                        {isMovieInList ? (
                          <span className="watchlist-selection-badge">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            Already added
                          </span>
                        ) : (
                          <button className="btn btn-film btn-sm">
                            <i className="bi bi-plus-circle me-1"></i>
                            Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowWatchlistModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-film"
                onClick={() => {
                  setShowWatchlistModal(false)
                  navigate('/watchlist')
                }}
              >
                <i className="bi bi-plus-circle-fill me-2"></i>
                Create New Watchlist
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <FriendButton />
    </div>
  )
}

export default MovieDetails



