import axios from 'axios'

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'b2524dcdf8e11a2cb256f322b5cef254'
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185'
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'en-US',
  },
})

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const isValidMovie = (tmdbMovie) => {
  if (!tmdbMovie.poster_path) {
    return false
  }
  
  if (!tmdbMovie.overview || tmdbMovie.overview.trim().length < 20) {
    return false
  }
  
  const hasTrailer = tmdbMovie.videos?.results?.some(video => 
    video.type === 'Trailer' && video.site === 'YouTube'
  ) || false
  
  if (!hasTrailer) {
    return false
  }
  
  if (!tmdbMovie.title && !tmdbMovie.original_title) {
    return false
  }
  
  if (!tmdbMovie.release_date) {
    return false
  }
  
  return true
}

const transformMovie = (tmdbMovie) => {
  const primaryGenre = Array.isArray(tmdbMovie.genres) && tmdbMovie.genres.length > 0
    ? tmdbMovie.genres[0].name
    : (Array.isArray(tmdbMovie.genre_ids) && tmdbMovie.genre_ids.length > 0 ? 'Unknown' : 'Unknown')

  const posterUrl = tmdbMovie.poster_path
    ? `${TMDB_IMAGE_BASE}${tmdbMovie.poster_path}`
    : 'https://via.placeholder.com/300x400?text=No+Poster'

  const director = tmdbMovie.credits?.crew?.find(person => person.job === 'Director')?.name || null
  const writer = tmdbMovie.credits?.crew?.find(person => person.job === 'Writer' || person.job === 'Screenplay')?.name || null

  const trailer = tmdbMovie.videos?.results?.find(video => 
    video.type === 'Trailer' && video.site === 'YouTube'
  ) || tmdbMovie.videos?.results?.find(video => 
    video.site === 'YouTube'
  ) || null

  return {
    id: tmdbMovie.id?.toString(),
    titre: tmdbMovie.title || tmdbMovie.original_title || 'Unknown Title',
    annee_sortie: (tmdbMovie.release_date || '').slice(0, 4) || 'N/A',
    genre: primaryGenre,
    url: posterUrl,
    overview: tmdbMovie.overview || 'No description available.',
    director: director,
    writer: writer,
    runtime: tmdbMovie.runtime ? `${tmdbMovie.runtime} min` : 'N/A',
    release_date: tmdbMovie.release_date || null,
    vote_average: tmdbMovie.vote_average || null,
    trailer_key: trailer?.key || null,
    acteurs: Array.isArray(tmdbMovie.credits?.cast)
      ? tmdbMovie.credits.cast.slice(0, 10).map((person) => ({
          id: `${tmdbMovie.id}_actor_${person.id}`,
          nom: person.name,
          profile_path: person.profile_path,
          profile_image: person.profile_path 
            ? `${TMDB_PROFILE_BASE}${person.profile_path}` 
            : null,
          character: person.character || null,
          tmdb_id: person.id,
        }))
      : [],
    _tmdbData: tmdbMovie,
  }
}

const fetchMovieDetails = async (movieId) => {
  try {
    const { data } = await tmdbApi.get(`/movie/${movieId}`, {
      params: { append_to_response: 'credits,videos' },
    })
    return data
  } catch (error) {
    console.error(`Error fetching details for TMDB id ${movieId}:`, error)
    return null
  }
}

export const filmService = {
  getFilms: async (filters = {}) => {
    try {
      let movieIds = new Set()
      let searchResults = []

      if (filters.actor && filters.actor.trim()) {
        try {
          const personSearch = await tmdbApi.get('/search/person', {
            params: { query: filters.actor.trim(), include_adult: false, page: 1 },
          })
          
          const persons = personSearch.data?.results || []
          
          for (const person of persons.slice(0, 3)) {
            try {
              const personDetails = await tmdbApi.get(`/person/${person.id}/movie_credits`)
              const movies = personDetails.data?.cast || []
              movies.forEach(movie => {
                if (movie.id && movie.poster_path && movie.title && movie.release_date) {
                  movieIds.add(movie.id)
                }
              })
            } catch (error) {
              console.error(`Error fetching credits for person ${person.id}:`, error)
            }
          }
        } catch (error) {
          console.error('Error searching for actor:', error)
        }
      }

      if (filters.title && filters.title.trim()) {
        try {
          const searchResponse = await tmdbApi.get('/search/movie', {
            params: { query: filters.title.trim(), include_adult: false, page: 1 },
          })
          const results = searchResponse.data?.results || []
          results.forEach(movie => {
            if (movie.id && movie.poster_path && movie.title && movie.release_date) {
              movieIds.add(movie.id)
            }
          })
        } catch (error) {
          console.error('Error searching by title:', error)
        }
      }

      if (filters.genre && filters.genre.trim() && !filters.title && !filters.actor) {
        try {
          const genresResponse = await tmdbApi.get('/genre/movie/list')
          const genres = genresResponse.data?.genres || []
          const genreObj = genres.find(g => g.name.toLowerCase() === filters.genre.toLowerCase())
          
          if (genreObj) {
            const discoverResponse = await tmdbApi.get('/discover/movie', {
              params: { 
                with_genres: genreObj.id,
                include_adult: false,
                page: 1,
                sort_by: 'popularity.desc'
              },
            })
            const results = discoverResponse.data?.results || []
            results.forEach(movie => {
              if (movie.id && movie.poster_path && movie.title && movie.release_date) {
                movieIds.add(movie.id)
              }
            })
          }
        } catch (error) {
          console.error('Error searching by genre:', error)
        }
      }

      if (movieIds.size > 0) {
        const movieIdsArray = Array.from(movieIds).slice(0, 20)
        
        const detailedMovies = await Promise.all(
          movieIdsArray.map(movieId => fetchMovieDetails(movieId))
        )

        const validMovies = detailedMovies.filter(movie => movie && isValidMovie(movie))
        let transformed = validMovies.map(transformMovie)

        if (filters.genre && filters.genre.trim()) {
          transformed = transformed.filter((m) => {
            const movieGenre = (m.genre || '').toLowerCase()
            const filterGenre = filters.genre.toLowerCase()
            return movieGenre.includes(filterGenre) || movieGenre === filterGenre
          })
        }

        if (filters.actor && filters.actor.trim()) {
          const actorNameLower = filters.actor.toLowerCase()
          transformed = transformed.filter((m) => {
            return m.acteurs?.some(actor => 
              actor.nom?.toLowerCase().includes(actorNameLower)
            ) || false
          })
        }

        return transformed
      }

      if (filters.genre && filters.genre.trim() && !filters.title && !filters.actor) {
        try {
          const genresResponse = await tmdbApi.get('/genre/movie/list')
          const genres = genresResponse.data?.genres || []
          const genreObj = genres.find(g => g.name.toLowerCase() === filters.genre.toLowerCase())
          
          if (genreObj) {
            const discoverResponse = await tmdbApi.get('/discover/movie', {
              params: { 
                with_genres: genreObj.id,
                include_adult: false,
                page: 1,
                sort_by: 'popularity.desc'
              },
            })
            const results = discoverResponse.data?.results || []
            
            const moviesWithBasicInfo = results.filter(movie => 
              movie.id && movie.poster_path && movie.title && movie.release_date
            )
            
            const detailedMovies = await Promise.all(
              moviesWithBasicInfo.slice(0, 20).map(movie => fetchMovieDetails(movie.id))
            )
            
            const validMovies = detailedMovies.filter(movie => movie && isValidMovie(movie))
            return validMovies.map(transformMovie)
          }
        } catch (error) {
          console.error('Error fetching movies by genre:', error)
        }
      }

      const trending = await tmdbApi.get('/trending/movie/week', { params: { page: 1 } })
      const results = trending.data?.results || []
      
      const moviesWithBasicInfo = results.filter(movie => 
        movie.id && movie.poster_path && movie.title && movie.release_date
      )

      const detailedMovies = await Promise.all(
        moviesWithBasicInfo.slice(0, 20).map(movie => fetchMovieDetails(movie.id))
      )

      const validMovies = detailedMovies.filter(movie => movie && isValidMovie(movie))
      return validMovies.map(transformMovie)
    } catch (error) {
      console.error('Error fetching films from TMDB:', error)
      throw error
    }
  },

  getFilmById: async (id) => {
    try {
      const { data } = await tmdbApi.get(`/movie/${id}`, {
        params: { append_to_response: 'credits,videos' },
      })
      return transformMovie(data)
    } catch (error) {
      console.error('Error fetching film by ID from TMDB:', error)
      throw error
    }
  },

  searchMoviesLightweight: async (query) => {
    try {
      const searchResponse = await tmdbApi.get('/search/movie', {
        params: { query: query.trim(), include_adult: false, page: 1 },
      })
      const results = searchResponse.data?.results || []
      
      return results.slice(0, 10).map(movie => ({
        id: movie.id,
        tmdbId: movie.id,
        tmdb_id: movie.id,
        title: movie.title,
        titre: movie.title,
        posterPath: movie.poster_path,
        url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        release_date: movie.release_date,
        annee_sortie: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        vote_average: movie.vote_average
      }))
    } catch (error) {
      console.error('Error searching movies:', error)
      return []
    }
  },

  getGenres: async () => {
    try {
      const { data } = await tmdbApi.get('/genre/movie/list')
      const names = (data.genres || []).map((g) => g.name)
      return names.length > 0
        ? names
        : [
            'Action',
            'Adventure',
            'Animation',
            'Comedy',
            'Crime',
            'Drama',
            'Family',
            'Fantasy',
            'History',
            'Horror',
            'Music',
            'Mystery',
            'Romance',
            'Science Fiction',
            'TV Movie',
            'Thriller',
            'War',
            'Western',
          ]
    } catch {
      return [
        'Action',
        'Adventure',
        'Animation',
        'Comedy',
        'Crime',
        'Drama',
        'Family',
        'Fantasy',
        'History',
        'Horror',
        'Music',
        'Mystery',
        'Romance',
        'Science Fiction',
        'TV Movie',
        'Thriller',
        'War',
        'Western',
      ]
    }
  },
}

export const commentService = {
  submitComment: async (filmId, commentData) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('You must be logged in to post comments')
    }

    const response = await fetch(`${API_BASE}/api/commentaires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        film: { id: filmId },
        note: commentData.rating,
        commentaire: commentData.comment
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to submit comment')
    }

    return await response.json()
  },

  getFilmComments: async (filmId) => {
    try {
      const response = await fetch(`${API_BASE}/api/commentaires/film/${filmId}`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch comments')
      }
      
      const comments = await response.json()
      return Array.isArray(comments) ? comments : []
    } catch (error) {
      console.error('Error fetching film comments:', error)
      return []
    }
  },

  deleteComment: async (filmId, commentId) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('You must be logged in to delete comments')
    }

    const response = await fetch(`${API_BASE}/api/commentaires/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to delete comment')
    }

    return { success: true, message: 'Comment deleted successfully!' }
  },

  findActeurId: async (actorIdentifier) => {
    try {
      let tmdbId = null
      let actorName = null
      
      try {
        const actorData = await actorService.getActorById(actorIdentifier)
        if (actorData.tmdb_id) {
          tmdbId = actorData.tmdb_id
        }
        if (actorData.nom) {
          actorName = actorData.nom
        }
      } catch (e) {
        console.log('Could not fetch actor data, will try other methods')
      }
      
      if (tmdbId) {
        const response = await fetch(`${API_BASE}/api/acteurs/by-tmdb-id/${tmdbId}`, {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const acteur = await response.json()
          console.log('Found acteur by TMDB ID:', acteur.id)
          return acteur.id
        }
      }
      
      const parsedTmdbId = parseInt(actorIdentifier)
      if (!isNaN(parsedTmdbId) && parsedTmdbId > 10) {
        const response = await fetch(`${API_BASE}/api/acteurs/by-tmdb-id/${parsedTmdbId}`, {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const acteur = await response.json()
          console.log('Found acteur by parsed TMDB ID:', acteur.id)
          return acteur.id
        }
      }
      
      if (actorName) {
        const response = await fetch(`${API_BASE}/api/acteurs/by-user-name/${encodeURIComponent(actorName)}`, {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const acteur = await response.json()
          console.log('Found acteur by name:', acteur.id)
          return acteur.id
        }
      }
      
      const nameResponse = await fetch(`${API_BASE}/api/acteurs/by-user-name/${encodeURIComponent(actorIdentifier)}`, {
        headers: getAuthHeaders()
      })
      if (nameResponse.ok) {
        const acteur = await nameResponse.json()
        console.log('Found acteur by identifier as name:', acteur.id)
        return acteur.id
      }
      
      throw new Error('Could not find acteur ID for: ' + actorIdentifier + '. Make sure the actor has been set up in the system.')
    } catch (error) {
      console.error('Error finding acteur ID:', error)
      throw error
    }
  },

  submitActorComment: async (actorId, commentData) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('You must be logged in to post comments')
      }

      let tmdbActorId = null
      if (actorId && actorId.includes('_actor_')) {
        const parts = actorId.split('_actor_')
        tmdbActorId = parseInt(parts[1]) || parseInt(parts[0])
      } else {
        tmdbActorId = parseInt(actorId)
      }

      if (isNaN(tmdbActorId)) {
        throw new Error('Invalid actor ID format')
      }

      let acteurDbId = null
      try {
        acteurDbId = await commentService.findActeurId(actorId)
      } catch (error) {
        console.log('Actor not in database, will use TMDB ID:', tmdbActorId)
      }
      
      const requestBody = {
        note: commentData.rating,
        commentaire: commentData.comment
      }

      if (acteurDbId) {
        requestBody.acteur = { id: acteurDbId }
      } else {
        requestBody.tmdbActeurId = tmdbActorId
      }

      const response = await fetch(`${API_BASE}/api/commentaires`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to submit comment')
      }
      
      const result = await response.json()
      return { success: true, message: 'Comment added successfully!', data: result }
    } catch (error) {
      console.error('Error submitting actor comment:', error)
      throw error
    }
  },

  getActorComments: async (actorId) => {
    try {
      let tmdbActorId = null
      if (actorId && actorId.includes('_actor_')) {
        const parts = actorId.split('_actor_')
        tmdbActorId = parseInt(parts[1]) || parseInt(parts[0])
      } else {
        tmdbActorId = parseInt(actorId)
      }

      if (isNaN(tmdbActorId)) {
        return []
      }

      let acteurDbId = null
      try {
        acteurDbId = await commentService.findActeurId(actorId)
      } catch (error) {
        console.log('Actor not in database, using TMDB ID:', tmdbActorId)
      }
      
      const idToUse = acteurDbId || tmdbActorId
      const response = await fetch(`${API_BASE}/api/commentaires/acteur/${idToUse}`, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch comments')
      }
      
      const comments = await response.json()
      return Array.isArray(comments) ? comments : []
    } catch (error) {
      console.error('Error fetching actor comments:', error)
      return []
    }
  },

  deleteActorComment: async (actorId, commentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/commentaires/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete comment')
      }
      
      return { success: true, message: 'Comment deleted successfully!' }
    } catch (error) {
      console.error('Error deleting actor comment:', error)
      throw error
    }
  },
}

export const userService = {
  getCurrentUser: async () => {
    try {
      const stored = localStorage.getItem('currentUser')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },
}

export const friendService = {
  searchUsers: async (query) => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to search users')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
    }
  },
  
  sendFriendRequest: async (receiverId) => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ receiverId })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to send friend request')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error sending friend request:', error)
      throw error
    }
  },
  
  getIncomingRequests: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/requests/incoming`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch incoming requests')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching incoming requests:', error)
      throw error
    }
  },
  
  getOutgoingRequests: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/requests/outgoing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch outgoing requests')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching outgoing requests:', error)
      throw error
    }
  },
  
  acceptFriendRequest: async (requestId) => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to accept friend request')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error accepting friend request:', error)
      throw error
    }
  },
  
  rejectFriendRequest: async (requestId) => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to reject friend request')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      throw error
    }
  },
  
  cancelFriendRequest: async (requestId) => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to cancel friend request')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error cancelling friend request:', error)
      throw error
    }
  },
  
  getFriends: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/friends`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch friends')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching friends:', error)
      throw error
    }
  },
  
  removeFriend: async (friendId) => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to remove friend')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error removing friend:', error)
      throw error
    }
  },
}

export const actorService = {
  getActorById: async (id) => {
    try {
      let tmdbActorId = null
      
      if (id && id.includes('_actor_')) {
        const parts = id.split('_actor_')
        const filmId = parts[0]
        const actorIdentifier = parts[1]
        
        const parsedId = parseInt(actorIdentifier)
        
        if (!isNaN(parsedId) && parsedId > 10) {
          tmdbActorId = parsedId
          console.log(`Using TMDB ID directly: ${tmdbActorId} from identifier: ${actorIdentifier}`)
        } else {
          const actorIndex = parseInt(actorIdentifier) || 0
          try {
            const filmData = await filmService.getFilmById(filmId)
            if (filmData.acteurs && filmData.acteurs.length > 0) {
              if (filmData.acteurs[actorIndex] && filmData.acteurs[actorIndex].tmdb_id) {
                tmdbActorId = filmData.acteurs[actorIndex].tmdb_id
                console.log(`Found actor by index ${actorIndex}: TMDB ID ${tmdbActorId}`)
              } else {
                const foundActor = filmData.acteurs.find(actor => {
                  return actor.tmdb_id?.toString() === actorIdentifier
                })
                if (foundActor && foundActor.tmdb_id) {
                  tmdbActorId = foundActor.tmdb_id
                  console.log(`Found actor by tmdb_id match: TMDB ID ${tmdbActorId}`)
                } else {
                  throw new Error(`Could not find actor at index ${actorIndex} or with identifier ${actorIdentifier} in film ${filmId}`)
                }
              }
            } else {
              throw new Error(`Film ${filmId} has no actors`)
            }
          } catch (filmError) {
            console.error('Error fetching film for actor:', filmError)
            if (!isNaN(parsedId) && parsedId > 0) {
              console.warn(`Falling back to using identifier as TMDB ID: ${parsedId}`)
              tmdbActorId = parsedId
            } else {
              throw new Error(`Could not determine TMDB actor ID from identifier: ${actorIdentifier}`)
            }
          }
        }
      } else {
        tmdbActorId = parseInt(id)
        if (isNaN(tmdbActorId)) {
          throw new Error(`Invalid actor ID format: ${id}`)
        }
      }
      
      if (!tmdbActorId || isNaN(tmdbActorId)) {
        throw new Error('Could not determine TMDB actor ID from: ' + id)
      }
      
      const { data } = await tmdbApi.get(`/person/${tmdbActorId}`, {
        params: { append_to_response: 'movie_credits,combined_credits' },
      })
      
      const profileImage = data.profile_path
        ? `https://image.tmdb.org/t/p/w500${data.profile_path}`
        : null
      
      const knownFor = data.known_for_department || 'Acting'
      
      const birthday = data.birthday || null
      const placeOfBirth = data.place_of_birth || null
      
      let age = null
      if (birthday) {
        const birthDate = new Date(birthday)
        const today = new Date()
        age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
      }
      
      const filmography = []
      if (data.combined_credits?.cast) {
        filmography.push(...data.combined_credits.cast.map(movie => ({
          id: movie.id?.toString(),
          titre: movie.title || movie.name || 'Unknown',
          annee_sortie: movie.release_date ? movie.release_date.slice(0, 4) : (movie.first_air_date ? movie.first_air_date.slice(0, 4) : 'N/A'),
          url: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : 'https://via.placeholder.com/300x400?text=No+Poster',
          character: movie.character || null,
          media_type: movie.media_type || 'movie',
          release_date: movie.release_date || movie.first_air_date || null,
        })))
      }
      
      filmography.sort((a, b) => {
        const dateA = a.release_date || ''
        const dateB = b.release_date || ''
        return dateB.localeCompare(dateA)
      })
      
      return {
        id: id,
        tmdb_id: tmdbActorId,
        nom: data.name || 'Unknown Actor',
        biography: data.biography || 'No biography available.',
        profile_image: profileImage,
        known_for: knownFor,
        birthday: birthday,
        place_of_birth: placeOfBirth,
        age: age,
        popularity: data.popularity || 0,
        filmography: filmography,
        total_movies: filmography.length,
        _tmdbData: data,
      }
    } catch (error) {
      console.error('Error fetching actor from TMDB:', error)
      if (id && id.includes('_actor_')) {
        const parts = id.split('_actor_')
        const filmId = parts[0]
        const actorIndex = parseInt(parts[1]) || 0
        try {
          const filmData = await filmService.getFilmById(filmId)
          if (filmData.acteurs && filmData.acteurs[actorIndex]) {
            const actorData = filmData.acteurs[actorIndex]
            return {
              id: id,
              nom: actorData.nom || 'Unknown Actor',
              biography: 'No biography available.',
              profile_image: actorData.profile_image || null,
              known_for: 'Acting',
              filmography: [],
              total_movies: 0,
            }
          }
        } catch (filmError) {
          console.error('Error fetching fallback actor data:', filmError)
        }
      }
      throw error
    }
  },
}

export const communityService = {
  getAllPosts: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/community/posts`, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })
      
      const responseText = await response.text()
      
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(responseText || 'Failed to fetch posts')
        }
        throw new Error('Invalid response format from server')
      }
      
      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Failed to fetch posts'
        
        if (response.status === 401) {
          throw new Error('You must be logged in to view posts')
        } else if (response.status === 500) {
          throw new Error('Server error: ' + errorMessage)
        } else {
          throw new Error(errorMessage)
        }
      }
      
      if (!Array.isArray(responseData)) {
        console.warn('Expected array but got:', typeof responseData)
        return []
      }
      
      return responseData
    } catch (error) {
      console.error('Error in getAllPosts API call:', error)
      if (error.message) {
        throw error
      }
      throw new Error('Failed to fetch posts. Please try again.')
    }
  },

  createPost: async (content, movieTmdbIds = [], actorTmdbIds = [], movieData = [], actorData = []) => {
    try {
      if (!content || typeof content !== 'string' || !content.trim()) {
        throw new Error('Post content is required')
      }

      const movies = Array.isArray(movieTmdbIds) ? movieTmdbIds : []
      const actors = Array.isArray(actorTmdbIds) ? actorTmdbIds : []
      const moviesWithData = Array.isArray(movieData) ? movieData : []
      const actorsWithData = Array.isArray(actorData) ? actorData : []

      const response = await fetch(`${API_BASE}/api/community/posts`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          movieTmdbIds: movies,
          actorTmdbIds: actors,
          movieData: moviesWithData,
          actorData: actorsWithData,
        }),
      })
      
      const responseText = await response.text()
      
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(responseText || 'Failed to create post')
        }
        throw new Error('Invalid response format from server')
      }
      
      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Failed to create post'
        
        if (response.status === 401) {
          throw new Error('You must be logged in to create a post')
        } else if (response.status === 400) {
          throw new Error(errorMessage)
        } else if (response.status === 500) {
          throw new Error('Server error: ' + errorMessage)
        } else {
          throw new Error(errorMessage)
        }
      }
      
      return responseData
    } catch (error) {
      console.error('Error in createPost API call:', error)
      if (error.message) {
        throw error
      }
      throw new Error('Failed to create post. Please try again.')
    }
  },

  addOrUpdateReaction: async (postId, reactionType) => {
    const response = await fetch(`${API_BASE}/api/community/posts/${postId}/reactions`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reactionType }),
    })
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized')
      }
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to add reaction')
    }
    return response.json()
  },

  removeReaction: async (postId) => {
    const response = await fetch(`${API_BASE}/api/community/posts/${postId}/reactions`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized')
      }
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to remove reaction')
    }
    return response.json()
  },

  updatePost: async (postId, content, movieTmdbIds = [], actorTmdbIds = []) => {
    try {
      if (!postId || isNaN(postId)) {
        throw new Error('Invalid post ID')
      }
      if (!content || typeof content !== 'string' || !content.trim()) {
        throw new Error('Post content is required')
      }

      const movies = Array.isArray(movieTmdbIds) ? movieTmdbIds : []
      const actors = Array.isArray(actorTmdbIds) ? actorTmdbIds : []

      const response = await fetch(`${API_BASE}/api/community/posts/${postId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          movieTmdbIds: movies,
          actorTmdbIds: actors,
        }),
      })
      
      const responseText = await response.text()
      
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        if (!response.ok) {
          throw new Error(responseText || 'Failed to update post')
        }
        throw new Error('Invalid response format from server')
      }
      
      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Failed to update post'
        
        if (response.status === 401) {
          throw new Error('You must be logged in to update a post')
        } else if (response.status === 403) {
          throw new Error('You can only edit your own posts')
        } else if (response.status === 400) {
          throw new Error(errorMessage)
        } else if (response.status === 500) {
          throw new Error('Server error: ' + errorMessage)
        } else {
          throw new Error(errorMessage)
        }
      }
      
      return responseData
    } catch (error) {
      console.error('Error in updatePost API call:', error)
      if (error.message) {
        throw error
      }
      throw new Error('Failed to update post. Please try again.')
    }
  },

  deletePost: async (postId) => {
    const response = await fetch(`${API_BASE}/api/community/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized')
      }
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to delete post')
    }
    return response.json()
  },
}

export const contactService = {
  submitMessage: async (messageData) => {
    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to submit message')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error submitting message:', error)
      throw error
    }
  },
}

export const adminService = {
  getAllUsers: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Admin access required')
        }
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch users')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },
  
  getUserById: async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch user')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  },
  
  updateUser: async (userId, userData) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update user')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },
  
  deleteUser: async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete user')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  },
  
  getAllPosts: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/posts`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Admin access required')
        }
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch posts')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching posts:', error)
      throw error
    }
  },
  
  updatePost: async (postId, content) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update post')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating post:', error)
      throw error
    }
  },
  
  deletePost: async (postId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete post')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error deleting post:', error)
      throw error
    }
  },
  
  getAllMessages: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/messages`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Admin access required')
        }
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to fetch messages')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  },
  
  markMessageAsRead: async (messageId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to mark message as read')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error marking message as read:', error)
      throw error
    }
  },
  
  deleteMessage: async (messageId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete message')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  },
}

export const profileService = {
  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_BASE}/api/upload/profile-picture`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to upload profile picture')
      }
      
      const result = await response.json()
      return result.url
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      throw error
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(profileData),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update profile')
      }
      
      const updatedUser = await response.json()
      
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const updatedCurrentUser = {
        ...currentUser,
        ...updatedUser,
      }
      localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser))
      
      return updatedUser
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  },
  
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to change password')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error changing password:', error)
      throw error
    }
  },
}

export default tmdbApi

