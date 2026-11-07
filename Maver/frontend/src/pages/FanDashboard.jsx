import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './FanDashboard.css'
import AnimatedBackground from '../components/layout/AnimatedBackground'
import HeroSection from '../components/layout/HeroSection'
import Navbar from '../components/layout/Navbar'
import AlertMessage from '../components/common/AlertMessage'
import SearchContainer from '../components/movies/SearchContainer'
import FilmsGrid from '../components/movies/FilmsGrid'
import CommentModal from '../components/movies/CommentModal'
import Footer from '../components/layout/Footer'
import FriendButton from '../components/layout/FriendButton'
import { filmService, commentService, userService } from '../services/api'
import { getCurrentUser } from '../utils/auth'

function FanDashboard() {
  const navigate = useNavigate()
  const [searchFilters, setSearchFilters] = useState({
    title: '',
    genre: '',
    actor: ''
  })
  const [selectedFilm, setSelectedFilm] = useState(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [commentForm, setCommentForm] = useState({
    rating: 0,
    comment: ''
  })
  const [selectedActors, setSelectedActors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [hoveredRating, setHoveredRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [films, setFilms] = useState([])
  const [genres, setGenres] = useState([])
  const [user, setUser] = useState(getCurrentUser() || { nom: 'Fan' })
  const isActor = user?.role === 'acteur'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [filmsData, genresData, userData] = await Promise.all([
          filmService.getFilms(),
          filmService.getGenres().catch(() => []),
          userService.getCurrentUser()
        ])
        
        setFilms(Array.isArray(filmsData) ? filmsData : filmsData.data || [])
        setGenres(Array.isArray(genresData) ? genresData : genresData.data || [])
        if (!userData || !userData.email) {
          navigate('/login', { replace: true })
          return
        }
        setUser(userData)
        document.title = 'MAVER | Fan Space'
      } catch (error) {
        console.error('Error fetching data:', error)
        setErrorMessage('Failed to load films. Please try again later.')
        setFilms([])
        setGenres([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const filteredFilms = films.filter(film => {
    const matchesTitle = !searchFilters.title || 
      film.titre?.toLowerCase().includes(searchFilters.title.toLowerCase())
    const matchesGenre = !searchFilters.genre || 
      film.genre?.toLowerCase() === searchFilters.genre.toLowerCase()
    return matchesTitle && matchesGenre
  })

  const categorizeFilms = () => {
    if (searchFilters.title || searchFilters.genre || searchFilters.actor) {
      return {
        trending: [],
        popular: [],
        recommended: []
      }
    }

    const totalFilms = filteredFilms.length
    if (totalFilms === 0) return { trending: [], popular: [], recommended: [] }

    const trendingCount = Math.ceil(totalFilms / 3)
    const trending = filteredFilms.slice(0, trendingCount)

    const popularCount = Math.ceil(totalFilms / 3)
    const popular = filteredFilms.slice(trendingCount, trendingCount + popularCount)

    const recommended = filteredFilms.slice(trendingCount + popularCount)

    return { trending, popular, recommended }
  }

  const { trending, popular, recommended } = categorizeFilms()

  const handleSearch = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const filmsData = await filmService.getFilms(searchFilters)
      setFilms(Array.isArray(filmsData) ? filmsData : filmsData.data || [])
      if (filmsData.length === 0 && (searchFilters.title || searchFilters.genre || searchFilters.actor)) {
        setErrorMessage('No movies found matching your search criteria.')
      }
    } catch (error) {
      console.error('Error searching films:', error)
      setErrorMessage('Failed to search films. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setSearchFilters({ title: '', genre: '', actor: '' })
    const fetchDefaultMovies = async () => {
      try {
        setLoading(true)
        const filmsData = await filmService.getFilms()
        setFilms(Array.isArray(filmsData) ? filmsData : filmsData.data || [])
      } catch (error) {
        console.error('Error fetching default films:', error)
        setErrorMessage('Failed to load films. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchDefaultMovies()
  }

  const handleOpenCommentModal = (film) => {
    setSelectedFilm(film)
    setShowCommentModal(true)
    setCommentForm({ rating: 0, comment: '' })
    document.body.style.overflow = 'hidden'
  }

  const handleCloseModal = () => {
    setShowCommentModal(false)
    setSelectedFilm(null)
    setCommentForm({ rating: 0, comment: '' })
    document.body.style.overflow = 'unset'
  }

  const handleRatingClick = (rating) => {
    setCommentForm({ ...commentForm, rating })
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentForm.rating || !commentForm.comment) {
      setErrorMessage('Please fill in all required fields.')
      return
    }
    
    try {
      await commentService.submitComment(selectedFilm.id, {
        rating: commentForm.rating,
        comment: commentForm.comment
      })
      setSuccessMessage('Comment added successfully!')
      handleCloseModal()
    } catch (error) {
      console.error('Error submitting comment:', error)
      setErrorMessage(error.response?.data?.message || 'Failed to submit comment. Please try again.')
    }
  }

  const handleActorDetails = (e, filmId) => {
    e.preventDefault()
    const actorId = selectedActors[filmId]
    if (!actorId) {
      setErrorMessage('Please select an actor.')
      return
    }
    navigate(`/acteur-details?id=${actorId}`)
  }

  const handleActorSelectionChange = (filmId, actorId) => {
    setSelectedActors({ ...selectedActors, [filmId]: actorId })
  }

  const handleFilmDetails = (filmId) => {
    navigate(`/film-details?id=${filmId}`)
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

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fan-dashboard">
      <AnimatedBackground />
      <HeroSection user={user} />
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

        <SearchContainer 
          searchFilters={searchFilters}
          onSearchChange={setSearchFilters}
          onSearchSubmit={handleSearch}
          onClear={handleClearFilters}
          genres={genres}
        />

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading films...</p>
          </div>
        ) : (searchFilters.title || searchFilters.genre || searchFilters.actor) ? (
          <FilmsGrid 
            title="Search Results"
            films={filteredFilms}
            onFilmDetails={handleFilmDetails}
            onOpenCommentModal={isActor ? null : handleOpenCommentModal}
            onActorDetails={handleActorDetails}
            selectedActors={selectedActors}
            onActorSelectionChange={handleActorSelectionChange}
          />
        ) : (
          <>
            {trending.length > 0 && (
              <FilmsGrid 
                title="Trending Now"
                films={trending}
                onFilmDetails={handleFilmDetails}
                onOpenCommentModal={isActor ? null : handleOpenCommentModal}
                onActorDetails={handleActorDetails}
                selectedActors={selectedActors}
                onActorSelectionChange={handleActorSelectionChange}
              />
            )}
            {popular.length > 0 && (
              <FilmsGrid 
                title="Popular This Week"
                films={popular}
                onFilmDetails={handleFilmDetails}
                onOpenCommentModal={isActor ? null : handleOpenCommentModal}
                onActorDetails={handleActorDetails}
                selectedActors={selectedActors}
                onActorSelectionChange={handleActorSelectionChange}
              />
            )}
            {recommended.length > 0 && (
              <FilmsGrid 
                title="Recommended for You"
                films={recommended}
                onFilmDetails={handleFilmDetails}
                onOpenCommentModal={isActor ? null : handleOpenCommentModal}
                onActorDetails={handleActorDetails}
                selectedActors={selectedActors}
                onActorSelectionChange={handleActorSelectionChange}
              />
            )}
          </>
        )}
      </div>

      <CommentModal 
        show={showCommentModal}
        selectedFilm={selectedFilm}
        commentForm={commentForm}
        hoveredRating={hoveredRating}
        onClose={handleCloseModal}
        onSubmit={handleCommentSubmit}
        onRatingClick={handleRatingClick}
        onRatingHover={setHoveredRating}
        onCommentChange={(value) => setCommentForm({ ...commentForm, comment: value })}
      />

      <FriendButton />

      <Footer />
    </div>
  )
}

export default FanDashboard
