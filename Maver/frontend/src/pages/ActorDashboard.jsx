import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import AnimatedBackground from '../components/layout/AnimatedBackground'
import FriendButton from '../components/layout/FriendButton'
import { userService } from '../services/api'
import './ActorDashboard.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

function ActorDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [movies, setMovies] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const userData = await userService.getCurrentUser()
        if (!userData || userData.role !== 'acteur') {
          setErrorMessage('Access denied. Actor role required.')
          setTimeout(() => navigate('/'), 2000)
          return
        }
        setUser(userData)
        // Update page title based on role
        document.title = 'MAVER | Actor Space'

        // Fetch actor movies and comments in parallel
        const [moviesRes, commentsRes] = await Promise.all([
          fetch(`${API_BASE}/api/actor-dashboard/movies`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/api/actor-dashboard/comments`, { headers: getAuthHeaders() })
        ])

        if (!moviesRes.ok) {
          const txt = await moviesRes.text()
          throw new Error(txt || 'Failed to load movies')
        }
        if (!commentsRes.ok) {
          const txt = await commentsRes.text()
          throw new Error(txt || 'Failed to load comments')
        }

        const moviesData = await moviesRes.json()
        const commentsData = await commentsRes.json()

        setMovies(Array.isArray(moviesData) ? moviesData : [])
        setComments(Array.isArray(commentsData) ? commentsData : [])
      } catch (error) {
        console.error('Error loading actor dashboard:', error)
        setErrorMessage(error.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [navigate])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A'
    try {
      const date = new Date(dateTimeString)
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateTimeString
    }
  }

  if (loading) {
    return (
      <div className="actor-dashboard-page">
        <Navbar />
        <AnimatedBackground />
        <div className="container main-content" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-white">Loading your dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="actor-dashboard-page">
      <Navbar />
      <AnimatedBackground />
      <div className="container main-content">
        <AlertMessage type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
        <AlertMessage type="success" message={successMessage} onClose={() => setSuccessMessage('')} />

        <div className="actor-dashboard-header">
          <h1 className="dashboard-title">
            <i className="bi bi-person-badge me-2"></i>
            Actor Dashboard
          </h1>
          <p className="dashboard-subtitle">Welcome back, {user?.nom || 'Actor'}!</p>
        </div>

        {/* Movies Section */}
        <div className="dashboard-section">
          <h2 className="section-title">
            <i className="bi bi-film me-2"></i>
            Movies You Participated In
          </h2>
          {movies.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-film"></i>
              <h3>No movies found</h3>
              <p>Movies you participated in will appear here once they are stored in the database.</p>
            </div>
          ) : (
            <div className="movies-grid">
              {movies.map((movie) => (
                <div 
                  key={movie.tmdbId || movie.id} 
                  className="dashboard-movie-card"
                  onClick={() => navigate(`/film-details?id=${movie.id || movie.tmdbId}`)}
                >
                  <div className="movie-poster-wrapper">
                    <img
                      src={movie.posterUrl || 'https://via.placeholder.com/300x400?text=No+Poster'}
                      alt={movie.title}
                      className="movie-poster"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x400?text=No+Poster'
                      }}
                    />
                    <div className="movie-overlay">
                      <div className="movie-info-overlay">
                        <h5 className="movie-title-overlay">{movie.title}</h5>
                        <p className="movie-year-overlay">{movie.releaseDate ? movie.releaseDate.slice(0, 4) : 'N/A'}</p>
                        {movie.characterName && movie.characterName !== 'N/A' && (
                          <p className="movie-character-overlay">
                            <i className="bi bi-person me-1"></i>
                            as {movie.characterName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="dashboard-section">
          <h2 className="section-title">
            <i className="bi bi-chat-left-text me-2"></i>
            Comments & Critiques from Fans
          </h2>
          {comments.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-chat-left"></i>
              <h3>No comments yet</h3>
              <p>Comments from fans will appear here once they leave reviews on your actor details page.</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <div className="comment-header">
                    <div className="comment-author">
                      <i className="bi bi-person-circle me-2"></i>
                      <strong>{comment.fanName || 'Anonymous Fan'}</strong>
                      {comment.fanEmail && (
                        <span className="comment-email"> ({comment.fanEmail})</span>
                      )}
                    </div>
                    <div className="comment-rating">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i
                          key={i}
                          className={`bi ${i < comment.note ? 'bi-star-fill' : 'bi-star'}`}
                          style={{ color: i < comment.note ? '#ffc107' : '#666' }}
                        ></i>
                      ))}
                    </div>
                  </div>
                  <div className="comment-content">
                    <p>{comment.commentaire || 'No comment text'}</p>
                  </div>
                  <div className="comment-footer">
                    <span className="comment-date">
                      <i className="bi bi-calendar me-1"></i>
                      {formatDateTime(comment.dateCommentaire)}
                    </span>
                    {comment.filmTitle && (
                      <span className="comment-film">
                        <i className="bi bi-film me-1"></i>
                        Related to: {comment.filmTitle}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
      
    </div>
  )
}

export default ActorDashboard

