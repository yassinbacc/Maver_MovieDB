import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedBackground from '../components/layout/AnimatedBackground'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import FriendButton from '../components/layout/FriendButton'
import { filmService, userService, API_BASE, getAuthHeaders } from '../services/api'
import './Watchlist.css'

function Watchlist() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ nom: 'Fan' })
  const [watchlists, setWatchlists] = useState([])
  const [favoriteActors, setFavoriteActors] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingList, setEditingList] = useState(null)
  const [newListName, setNewListName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState('watchlists')
  const [showAddMovieModal, setShowAddMovieModal] = useState(false)
  const [selectedListForMovie, setSelectedListForMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [movieSearchQuery, setMovieSearchQuery] = useState('')
  const [movieSearchResults, setMovieSearchResults] = useState([])
  const [suggestedMovies, setSuggestedMovies] = useState([])
  const [searchingMovies, setSearchingMovies] = useState(false)

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

        const wlRes = await fetch(`${API_BASE}/api/watchlists`, { headers: getAuthHeaders() })
        if (!wlRes.ok) {
          if (wlRes.status === 401) {
            navigate('/login', { replace: true })
            return
          }
          console.error('Failed to load watchlists:', wlRes.status, await wlRes.text())
          setWatchlists([])
        } else {
          const wlData = await wlRes.json()
          const normalized = (Array.isArray(wlData) ? wlData : []).map(list => ({
            ...list,
            movies: (Array.isArray(list.movies) ? list.movies : []).map(m => ({
              ...m,
              id: m.filmId || m.id,
              filmId: m.filmId || m.id,
              url: m.url || (m.posterPath ? `https://image.tmdb.org/t/p/w500${m.posterPath}` : null),
              titre: m.titre || m.title || m.filmId || m.id,
              title: m.title || m.titre || m.filmId || m.id,
              annee_sortie: m.annee_sortie || (m.releaseDate ? new Date(m.releaseDate).getFullYear() : null),
              genre: m.genre || null,
              rank: m.rankNum || m.rank || 0,
              rankNum: m.rankNum || m.rank || 0
            })).sort((a, b) => (a.rank || 0) - (b.rank || 0))
          }))
          setWatchlists(normalized)
        }

        const favRes = await fetch(`${API_BASE}/api/favorites/actors`, { headers: getAuthHeaders() })
        const favData = favRes.ok ? await favRes.json() : []
        
        const favoriteActorsList = (Array.isArray(favData) ? favData : []).map((actor) => ({
          actorId: actor.actorId || actor.id,
          actorName: actor.actorName || actor.nom || 'Unknown Actor',
          profile_image: actor.profileImageUrl || actor.profile_image || null,
          tmdb_id: actor.actorId || null // Actor ID is the TMDB ID
        }))
        
        setFavoriteActors(favoriteActorsList)
      } catch (error) {
        console.error('Error loading data:', error)
        setErrorMessage('Failed to load watchlists. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (showAddMovieModal) {
      const loadSuggestedMovies = async () => {
        try {
          setSearchingMovies(true)
          const { filmService } = await import('../services/api')
          const TMDB_API_KEY = 'b2524dcdf8e11a2cb256f322b5cef254'
          const response = await fetch(
            `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&page=1`
          )
          if (response.ok) {
            const data = await response.json()
            const movies = (data.results || []).slice(0, 10).map(movie => ({
              id: movie.id,
              tmdbId: movie.id,
              title: movie.title,
              rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
              releaseDate: movie.release_date
            }))
            setSuggestedMovies(movies)
          }
        } catch (error) {
          console.error('Error loading suggested movies:', error)
        } finally {
          setSearchingMovies(false)
        }
      }
      loadSuggestedMovies()
    } else {
      setMovieSearchQuery('')
      setMovieSearchResults([])
      setSuggestedMovies([])
    }
  }, [showAddMovieModal])

  useEffect(() => {
    if (!showAddMovieModal) return
    
    const searchMovies = async () => {
      if (!movieSearchQuery || movieSearchQuery.trim().length < 2) {
        setMovieSearchResults([])
        return
      }
      
      setSearchingMovies(true)
      try {
        const results = await filmService.searchMoviesLightweight(movieSearchQuery.trim())
        const formattedResults = results.map(movie => ({
          id: movie.id || movie.tmdbId,
          tmdbId: movie.id || movie.tmdbId,
          title: movie.title || movie.titre,
          rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
          releaseDate: movie.release_date
        }))
        setMovieSearchResults(formattedResults)
      } catch (error) {
        console.error('Error searching movies:', error)
        setMovieSearchResults([])
      } finally {
        setSearchingMovies(false)
      }
    }
    
    const timeoutId = setTimeout(searchMovies, 300)
    return () => clearTimeout(timeoutId)
  }, [movieSearchQuery, showAddMovieModal])

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setErrorMessage('Please enter a name for your watchlist.')
      return
    }

    const listName = newListName.trim()
    const tempId = Date.now()
    const optimisticList = {
      id: tempId,
      name: listName,
      movies: [],
      createdAt: new Date().toISOString()
    }

    setWatchlists(prev => [...prev, optimisticList])
    setNewListName('')
    setShowCreateModal(false)

    try {
      const res = await fetch(`${API_BASE}/api/watchlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: listName })
      })
      if (!res.ok) {
        const txt = await res.text()
        setWatchlists(prev => prev.filter(l => l.id !== tempId))
        throw new Error(txt || 'Failed to create list')
      }
      const created = await res.json()
      setWatchlists(prev => prev.map(l => l.id === tempId ? { ...created, movies: created.movies || [] } : l))
      setSuccessMessage('Watchlist created successfully!')
    } catch (e) {
      console.error('Error creating watchlist:', e)
      setErrorMessage(e.message || 'Failed to create watchlist.')
    }
  }

  const handleUpdateList = async (listId, newName) => {
    if (!newName.trim()) {
      setErrorMessage('Please enter a name for your watchlist.')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/watchlists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: newName.trim() })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to update list')
      }
      const updated = await res.json()
      setWatchlists(prev => prev.map(list => 
        list.id === listId ? { ...list, name: updated.name } : list
      ))
      setSuccessMessage('Watchlist updated successfully!')
    } catch (e) {
      console.error('Error updating watchlist:', e)
      setErrorMessage(e.message || 'Failed to update watchlist.')
    }
  }

  const handleDeleteList = async (listId) => {
    if (window.confirm('Are you sure you want to delete this watchlist?')) {
      try {
        const res = await fetch(`${API_BASE}/api/watchlists/${listId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })
        if (!res.ok) throw new Error('Failed to delete list')
        setWatchlists(prev => prev.filter(l => l.id !== listId))
        setSuccessMessage('Watchlist deleted successfully!')
      } catch (e) {
        setErrorMessage(e.message || 'Failed to delete watchlist.')
      }
    }
  }

  const handleAddMovie = async (listId, movie) => {
    const movieId = movie.id || movie.tmdb_id || movie.tmdbId
    if (!movieId) {
      setErrorMessage('Invalid movie ID')
      return
    }
    
    const existingMovie = watchlists.find(l => l.id === listId)?.movies?.find(m => (m.filmId || m.id) == movieId)
    if (existingMovie) {
      setErrorMessage('Movie is already in this watchlist')
      return
    }

    const nextRank = watchlists.find(l => l.id === listId)?.movies?.length + 1 || 1
    const optimisticMovie = {
      id: `temp-${Date.now()}`,
      filmId: movieId,
      rankNum: nextRank,
      rank: nextRank,
      url: movie.url || (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null),
      titre: movie.titre || movie.title || movieId,
      title: movie.title || movie.titre || movieId,
      annee_sortie: movie.annee_sortie || (movie.release_date ? new Date(movie.release_date).getFullYear() : null),
      genre: movie.genre || null
    }

    setWatchlists(prev => prev.map(list => {
      if (list.id !== listId) return list
      const existingMovie = list.movies.find(m => (m.filmId || m.id) === movieId)
      if (existingMovie) return list
      return { 
        ...list, 
        movies: [...(list.movies || []), optimisticMovie].sort((a, b) => (a.rank || 0) - (b.rank || 0))
      }
    }))

    try {
      const res = await fetch(`${API_BASE}/api/watchlists/${listId}/movies/${encodeURIComponent(movieId)}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (!res.ok) {
        const txt = await res.text()
        setWatchlists(prev => prev.map(list => {
          if (list.id !== listId) return list
          return { 
            ...list, 
            movies: (list.movies || []).filter(m => m.id !== optimisticMovie.id)
          }
        }))
        throw new Error(txt || 'Failed to add movie')
      }
      
      const addedMovie = await res.json()
      const enrichedMovie = {
        ...addedMovie,
        id: addedMovie.filmId || addedMovie.id,
        filmId: addedMovie.filmId || addedMovie.id,
        url: addedMovie.url || (addedMovie.posterPath ? `https://image.tmdb.org/t/p/w500${addedMovie.posterPath}` : null),
        titre: addedMovie.titre || addedMovie.title || addedMovie.filmId,
        title: addedMovie.title || addedMovie.titre || addedMovie.filmId,
        annee_sortie: addedMovie.annee_sortie || null,
        genre: addedMovie.genre || null,
        rank: addedMovie.rankNum || addedMovie.rank || nextRank,
        rankNum: addedMovie.rankNum || addedMovie.rank || nextRank
      }

      setWatchlists(prev => prev.map(list => {
        if (list.id !== listId) return list
        return { 
          ...list, 
          movies: list.movies
            .filter(m => m.id !== optimisticMovie.id)
            .concat([enrichedMovie])
            .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        }
      }))
      
      setShowAddMovieModal(false)
      setSelectedListForMovie(null)
      setSuccessMessage('Movie added to watchlist!')
    } catch (e) {
      setErrorMessage(e.message || 'Failed to add movie.')
    }
  }

  const handleRemoveMovie = async (listId, movieId) => {
    try {
      const filmIdToDelete = movieId
      const res = await fetch(`${API_BASE}/api/watchlists/${listId}/movies/${encodeURIComponent(filmIdToDelete)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to remove movie')
      }
      
      setWatchlists(prev => prev.map(list => {
        if (list.id !== listId) return list
        
        const filtered = (list.movies || []).filter(m => {
          const mId = m.id || m.filmId
          const mFilmId = m.filmId || m.id
          return mId !== movieId && mFilmId !== movieId && mId !== filmIdToDelete && mFilmId !== filmIdToDelete
        })
        
        const reRanked = filtered.map((m, idx) => ({
          ...m,
          rank: idx + 1,
          rankNum: idx + 1
        }))
        
        return { ...list, movies: reRanked }
      }))
      
      setSuccessMessage('Movie removed from watchlist!')
    } catch (e) {
      console.error('Error removing movie:', e)
      setErrorMessage(e.message || 'Failed to remove movie.')
    }
  }

  const handleMoveRank = async (listId, movieId, direction) => {
    try {
      const filmIdToMove = movieId
      const res = await fetch(`${API_BASE}/api/watchlists/${listId}/movies/${encodeURIComponent(filmIdToMove)}/rank?direction=${encodeURIComponent(direction)}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to update rank')
      }
      
      setWatchlists(prev => prev.map(list => {
        if (list.id !== listId) return list
        
        const movies = [...(list.movies || [])]
        
        const currentIndex = movies.findIndex(m => {
          const mId = m.id || m.filmId
          const mFilmId = m.filmId || m.id
          return mId === movieId || mFilmId === movieId || mId === filmIdToMove || mFilmId === filmIdToMove
        })
        
        if (currentIndex === -1) {
          console.warn('Movie not found for rank update:', movieId)
          return list
        }
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
        
        if (newIndex < 0 || newIndex >= movies.length) {
          return list
        }
        
        const [movedMovie] = movies.splice(currentIndex, 1)
        movies.splice(newIndex, 0, movedMovie)
        
        const updatedMovies = movies.map((movie, idx) => ({
          ...movie,
          rank: idx + 1,
          rankNum: idx + 1
        }))
        
        return { ...list, movies: updatedMovies }
      }))
      
      setSuccessMessage('Rank updated successfully!')
    } catch (e) {
      console.error('Error updating rank:', e)
      setErrorMessage(e.message || 'Failed to update rank.')
    }
  }

  const handleAddFavoriteActor = async (actor) => {
    try {
      const actorId = actor.tmdb_id ? actor.tmdb_id.toString() : (actor.id || actor.actorId || actor.tmdbId)
      const actorName = actor.nom || actor.actorName || actor.name
      const profileImageUrl = actor.profile_image || actor.profilePath || actor.profile_path || null
      
      if (!actorId || !actorName) {
        throw new Error('Invalid actor data')
      }
      
      const params = new URLSearchParams({
        actorName: actorName
      })
      if (profileImageUrl) {
        params.append('profileImageUrl', profileImageUrl)
      }
      
      const res = await fetch(`${API_BASE}/api/favorites/actors/${encodeURIComponent(actorId)}?${params.toString()}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to add favorite actor')
      }
      
      const favRes = await fetch(`${API_BASE}/api/favorites/actors`, { headers: getAuthHeaders() })
      if (favRes.ok) {
        const favData = await favRes.json()
        
        const favoriteActorsList = (Array.isArray(favData) ? favData : []).map((act) => ({
          actorId: act.actorId || act.id,
          actorName: act.actorName || act.nom || 'Unknown Actor',
          profile_image: act.profileImageUrl || act.profile_image || null,
          tmdb_id: act.actorId || null
        }))
        
        setFavoriteActors(favoriteActorsList)
      }
      
      setSuccessMessage('Actor added to favorites!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (e) {
      console.error('Error adding favorite actor:', e)
      setErrorMessage(e.message || 'Actor is already in your favorites.')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleRemoveFavoriteActor = async (actorId) => {
    try {
      const res = await fetch(`${API_BASE}/api/favorites/actors/${encodeURIComponent(actorId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('Failed to remove')
      setFavoriteActors(prev => prev.filter(a => (a.actorId || a.id) !== actorId))
      setSuccessMessage('Actor removed from favorites!')
    } catch (e) {
      setErrorMessage(e.message || 'Failed to remove favorite actor.')
    }
  }

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
        setErrorMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage])

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

        <button 
          className="btn-back"
          onClick={() => navigate('/')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Movies
        </button>

        <div className="watchlist-header">
          <h1 className="watchlist-title">
            <i className="bi bi-bookmark-fill me-2"></i>
            My Watchlists
          </h1>
          <div className="watchlist-tabs">
            <button
              className={`tab-button ${activeTab === 'watchlists' ? 'active' : ''}`}
              onClick={() => setActiveTab('watchlists')}
            >
              <i className="bi bi-list-ul me-2"></i>
              Watchlists
            </button>
            <button
              className={`tab-button ${activeTab === 'actors' ? 'active' : ''}`}
              onClick={() => setActiveTab('actors')}
            >
              <i className="bi bi-people-fill me-2"></i>
              Favorite Actors
            </button>
          </div>
        </div>

        {activeTab === 'watchlists' && (
          <div className="watchlist-content">
            <div className="watchlist-actions">
              <button
                className="btn btn-film"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle-fill me-2"> </i><span> </span>
                <span>    </span><span> </span>
                 <span> </span>Create New Watchlist
              </button>
            </div>

            {loading ? (
              <div className="empty-state">
                <i className="bi bi-hourglass-split"></i>
                <h3>Loading watchlists...</h3>
              </div>
            ) : watchlists.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-bookmark"></i>
                <h3>No watchlists yet</h3>
                <p>Create your first watchlist to organize your favorite movies!</p>
              </div>
            ) : (
              <div className="watchlists-grid">
                {watchlists.map(list => (
                  <div key={list.id} className="watchlist-card">
                    <div className="watchlist-card-header">
                      <h3 className="watchlist-card-title">{list.name}</h3>
                      <div className="watchlist-card-actions">
                        <button
                          className="btn-icon"
                          onClick={() => {
                            setEditingList(list)
                            setNewListName(list.name)
                            setShowCreateModal(true)
                          }}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => {
                            setSelectedListForMovie(list)
                            setShowAddMovieModal(true)
                          }}
                          title="Add Movie"
                        >
                          <i className="bi bi-plus-circle"></i>
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDeleteList(list.id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
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
                                  <div className="rank-controls">
                                    <button
                                      className="btn-rank"
                                      onClick={() => handleMoveRank(list.id, movieId, 'up')}
                                      disabled={idx === 0}
                                    >
                                      <i className="bi bi-arrow-up"></i>
                                    </button>
                                    <button
                                      className="btn-rank"
                                      onClick={() => handleMoveRank(list.id, movieId, 'down')}
                                      disabled={idx === list.movies.length - 1}
                                    >
                                      <i className="bi bi-arrow-down"></i>
                                    </button>
                                  </div>
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
                                <button
                                  className="btn-icon"
                                  onClick={() => handleRemoveMovie(list.id, movieId)}
                                  title="Remove"
                                >
                                  <i className="bi bi-x-circle"></i>
                                </button>
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
        )}

        {activeTab === 'actors' && (
          <div className="watchlist-content">
            <div className="favorite-actors-section">
              {favoriteActors.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-people"></i>
                  <h3>No favorite actors yet</h3>
                  <p>Add actors to your favorites from movie details pages!</p>
                </div>
              ) : (
                <div className="actors-grid">
                  {favoriteActors.map(actor => {
                    const id = actor.actorId || actor.id
                    const name = actor.actorName || actor.nom
                    const profileImage = actor.profile_image
                    return (
                    <div key={id} className="actor-favorite-card">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt={name}
                          className="actor-favorite-image"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className="actor-icon-large" style={{ display: profileImage ? 'none' : 'flex' }}>
                        <i className="bi bi-person-circle"></i>
                      </div>
                      <h4>{name}</h4>
                      <button
                        className="btn"
                        onClick={() => handleRemoveFavoriteActor(id)}
                      >
                        <i className="bi bi-heart-fill"></i>
                        Remove
                      </button>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false)
          setEditingList(null)
          setNewListName('')
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                {editingList ? 'Edit Watchlist' : 'Create New Watchlist'}
              </h5>
              <button className="modal-close" onClick={() => {
                setShowCreateModal(false)
                setEditingList(null)
                setNewListName('')
              }}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Watchlist Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter watchlist name..."
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingList(null)
                  setNewListName('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-film"
                onClick={async () => {
                  if (editingList) {
                    await handleUpdateList(editingList.id, newListName)
                  } else {
                    await handleCreateList()
                  }
                  setShowCreateModal(false)
                  setEditingList(null)
                  setNewListName('')
                }}
              >
                {editingList ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMovieModal && selectedListForMovie && (
        <div className="modal-overlay" onClick={() => {
          setShowAddMovieModal(false)
          setSelectedListForMovie(null)
        }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                Add Movie to "{selectedListForMovie.name}"
              </h5>
              <button className="modal-close" onClick={() => {
                setShowAddMovieModal(false)
                setSelectedListForMovie(null)
              }}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="movie-search-container">
                <div className="search-input-wrapper">
                  <i className="bi bi-search search-icon"></i>
                  <input
                    type="text"
                    className="movie-search-input"
                    placeholder="Search for a movie..."
                    value={movieSearchQuery}
                    onChange={(e) => setMovieSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {movieSearchQuery && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setMovieSearchQuery('')}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="movie-list-container">
                {searchingMovies ? (
                  <div className="movie-list-loading">
                    <i className="bi bi-hourglass-split"></i>
                    <span>Searching...</span>
                  </div>
                ) : movieSearchQuery.trim().length >= 2 ? (
                  movieSearchResults.length > 0 ? (
                    <div className="movie-list">
                      {movieSearchResults
                        .filter(movie => !selectedListForMovie.movies.find(m => (m.filmId || m.id) == movie.id))
                        .map(movie => (
                          <div
                            key={movie.id}
                            className="movie-list-item"
                            onClick={() => handleAddMovie(selectedListForMovie.id, movie)}
                          >
                            <div className="movie-list-item-content">
                              <div className="movie-list-item-info">
                                <h4 className="movie-list-item-title">{movie.title}</h4>
                                {movie.releaseDate && (
                                  <span className="movie-list-item-year">
                                    {new Date(movie.releaseDate).getFullYear()}
                                  </span>
                                )}
                              </div>
                              <div className="movie-list-item-rating">
                                <i className="bi bi-star-fill"></i>
                                <span>{movie.rating}</span>
                              </div>
                            </div>
                            <i className="bi bi-plus-circle add-movie-icon"></i>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="movie-list-empty">
                      <i className="bi bi-search"></i>
                      <p>No movies found</p>
                    </div>
                  )
                ) : (
                  suggestedMovies.length > 0 ? (
                    <div className="movie-list">
                      <div className="movie-list-header">
                        <i className="bi bi-fire"></i>
                        <span>Trending Movies</span>
                      </div>
                      {suggestedMovies
                        .filter(movie => !selectedListForMovie.movies.find(m => (m.filmId || m.id) == movie.id))
                        .map(movie => (
                          <div
                            key={movie.id}
                            className="movie-list-item"
                            onClick={() => handleAddMovie(selectedListForMovie.id, movie)}
                          >
                            <div className="movie-list-item-content">
                              <div className="movie-list-item-info">
                                <h4 className="movie-list-item-title">{movie.title}</h4>
                                {movie.releaseDate && (
                                  <span className="movie-list-item-year">
                                    {new Date(movie.releaseDate).getFullYear()}
                                  </span>
                                )}
                              </div>
                              <div className="movie-list-item-rating">
                                <i className="bi bi-star-fill"></i>
                                <span>{movie.rating}</span>
                              </div>
                            </div>
                            <i className="bi bi-plus-circle add-movie-icon"></i>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="movie-list-loading">
                      <i className="bi bi-hourglass-split"></i>
                      <span>Loading suggestions...</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <FriendButton />
    </div>
  )
}

export default Watchlist





