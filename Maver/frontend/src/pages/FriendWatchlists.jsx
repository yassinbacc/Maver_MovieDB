import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AnimatedBackground from '../components/layout/AnimatedBackground'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import FriendButton from '../components/layout/FriendButton'
import { userService, API_BASE, getAuthHeaders } from '../services/api'
import './Watchlist.css'

function FriendWatchlists() {
  const navigate = useNavigate()
  const { friendId } = useParams()
  const [user, setUser] = useState({ nom: 'Fan' })
  const [friend, setFriend] = useState(null)
  const [watchlists, setWatchlists] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const userData = await userService.getCurrentUser().catch(() => null)
        if (!userData || !userData.email) {
          navigate('/login', { replace: true })
          return
        }
        setUser(userData)

        const friendIdInt = parseInt(friendId, 10)
        if (isNaN(friendIdInt)) {
          setErrorMessage('Invalid friend ID')
          setLoading(false)
          return
        }

        const res = await fetch(`${API_BASE}/api/watchlists/friend/${friendIdInt}`, {
          headers: getAuthHeaders()
        })
        
        if (!res.ok) {
          if (res.status === 401) {
            navigate('/login', { replace: true })
            return
          } else if (res.status === 403) {
            setErrorMessage('You can only view watchlists of your friends')
            return
          } else if (res.status === 404) {
            setErrorMessage('Friend not found')
            return
          }
          const errorText = await res.text()
          throw new Error(errorText || 'Failed to load watchlists')
        }

        const data = await res.json()
        console.log('Friend watchlists response:', data)
        console.log('Watchlists array:', data.watchlists)
        
        if (!data.friend) {
          throw new Error('Invalid response: friend data missing')
        }
        
        setFriend(data.friend)
        
        const watchlistsArray = Array.isArray(data.watchlists) ? data.watchlists : []
        console.log('Watchlists count:', watchlistsArray.length)
        
        const normalized = watchlistsArray.map(list => {
          console.log('Processing list:', list.name, 'Movies count:', list.movies ? list.movies.length : 0)
          return {
            ...list,
            movies: (Array.isArray(list.movies) ? list.movies : []).map(m => ({
              ...m,
              id: m.filmId || m.id,
              filmId: m.filmId || m.id,
              url: m.url || (m.posterPath ? `https://image.tmdb.org/t/p/w500${m.posterPath}` : null),
              titre: m.titre || m.title || m.filmId || m.id,
              title: m.title || m.titre || m.filmId || m.id,
              annee_sortie: m.annee_sortie || null,
              genre: m.genre || null,
              rank: m.rankNum || m.rank || 0,
              rankNum: m.rankNum || m.rank || 0
            })).sort((a, b) => (a.rank || 0) - (b.rank || 0))
          }
        })
        
        console.log('Normalized watchlists:', normalized)
        setWatchlists(normalized)
      } catch (error) {
        console.error('Error loading friend watchlists:', error)
        setErrorMessage(error.message || 'Failed to load watchlists. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (friendId) {
      loadData()
    }
  }, [friendId, navigate])

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

        <button 
          className="btn-back"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </button>

        <div className="watchlist-header">
          <h1 className="watchlist-title">
            <i className="bi bi-bookmark-fill me-2"></i>
            {friend ? `${friend.nom}'s Watchlists` : 'Friend\'s Watchlists'}
          </h1>
        </div>

        <div className="watchlist-content">
          {loading ? (
            <div className="empty-state">
              <i className="bi bi-hourglass-split"></i>
              <h3>Loading watchlists...</h3>
            </div>
          ) : watchlists.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-bookmark"></i>
              <h3>No watchlists yet</h3>
              <p>{friend ? `${friend.nom} hasn't created any watchlists yet.` : 'This friend has no watchlists yet.'}</p>
            </div>
          ) : (
            <div className="watchlists-grid">
              {watchlists.map(list => (
                <div key={list.id} className="watchlist-card">
                  <div className="watchlist-card-header">
                    <h3 className="watchlist-card-title">{list.name}</h3>
                  </div>
                  <div className="watchlist-movies">
                    {list.movies.length === 0 ? (
                      <p className="empty-list">No movies in this watchlist</p>
                    ) : (
                      list.movies
                        .sort((a, b) => (a.rank || a.rankNum || 0) - (b.rank || b.rankNum || 0))
                        .map((movie, idx) => {
                          const movieId = movie.filmId || movie.id
                          const movieUrl = movie.url || null
                          const movieTitle = movie.titre || movieId
                          const movieYear = movie.annee_sortie || 'N/A'
                          const movieGenre = movie.genre || ''
                          
                          return (
                            <div key={`${list.id}-${movieId}-${idx}`} className="watchlist-movie-item">
                              <div className="movie-rank">
                                <span className="rank-number">{movie.rank || movie.rankNum || idx + 1}</span>
                              </div>
                              {movieUrl ? (
                                <img
                                  src={movieUrl}
                                  alt={movieTitle}
                                  className="watchlist-movie-poster"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    const placeholder = e.target.nextElementSibling
                                    if (placeholder) placeholder.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div className="watchlist-movie-poster-placeholder" style={{ display: movieUrl ? 'none' : 'flex' }}>
                                <i className="bi bi-film"></i>
                              </div>
                              <div className="watchlist-movie-info">
                                <h4>{movieTitle}</h4>
                                <p>{movieYear}{movieGenre ? ` • ${movieGenre}` : ''}</p>
                              </div>
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <FriendButton />
    </div>
  )
}

export default FriendWatchlists

