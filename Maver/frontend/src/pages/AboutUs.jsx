import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedBackground from '../components/layout/AnimatedBackground'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import FriendButton from '../components/layout/FriendButton'
import { userService } from '../services/api'
import './AboutUs.css'

function AboutUs() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ nom: 'Fan' })

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await userService.getCurrentUser().catch(() => ({ nom: 'Fan' }))
        setUser(userData)
      } catch (error) {
        console.error('Error loading user:', error)
      }
    }
    loadUser()
  }, [])

  return (
    <div className="fan-dashboard">
      <AnimatedBackground />
      <Navbar user={user} />
      
      <div className="container main-content">
        {/* Back Button */}
        <button 
          className="btn-back"
          onClick={() => navigate('/')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Home
        </button>

        {/* Hero Section */}
        <div className="about-hero">
          <div className="about-hero-content">
            <h1 className="about-main-title">
              <span className="emoji">🎬</span> About MAVER
            </h1>
            <p className="about-hero-subtitle">
              Your all-in-one destination for discovering, reviewing, and discussing the world's most captivating stories on screen.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="about-content">
          <section className="about-section">
            <div className="about-intro">
              <p className="about-text-large">
                At <strong>MAVER</strong>, we believe great cinema and storytelling deserve more than ratings — 
                they deserve connection, conversation, and discovery. Whether it's a blockbuster film, a hidden-gem series, 
                or a thought-provoking documentary, MAVER helps you find what to watch next and share what you love with 
                a passionate community of viewers.
              </p>
            </div>
          </section>

          {/* What We Do Section */}
          <section className="about-section">
            <div className="section-icon">
              <i className="bi bi-film"></i>
            </div>
            <h2 className="section-title">🎥 What We Do</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-star-fill"></i>
                </div>
                <h3>In-Depth Reviews</h3>
                <p>Honest and insightful opinions from fans and critics alike. Get real perspectives from people who love cinema.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-lightbulb-fill"></i>
                </div>
                <h3>Smart Recommendations</h3>
                <p>Personalized suggestions powered by what you watch and love. Discover your next favorite film or series.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-database"></i>
                </div>
                <h3>Comprehensive Database</h3>
                <p>Explore thousands of movies, shows, and documentaries with cast info, summaries, trailers, and ratings.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-people-fill"></i>
                </div>
                <h3>Community Interaction</h3>
                <p>Rate, review, and discuss your favorite titles — or discover what's trending now in our vibrant community.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-bookmark-fill"></i>
                </div>
                <h3>Watchlists & Collections</h3>
                <p>Keep track of what you've seen, what's next, and what's worth your time with personalized watchlists.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-heart-fill"></i>
                </div>
                <h3>Favorite Actors</h3>
                <p>Build your collection of favorite actors and follow their careers across different films and series.</p>
              </div>
            </div>
          </section>

          {/* Why MAVER Section */}
          <section className="about-section highlight-section">
            <div className="section-icon">
              <i className="bi bi-globe"></i>
            </div>
            <h2 className="section-title">🌍 Why MAVER?</h2>
            <div className="why-content">
              <p className="why-text">
                Because we're more than just a database — <strong>we're a movement for media lovers.</strong>
              </p>
              <p className="why-text">
                MAVER celebrates creativity, diversity, and the power of storytelling across every screen and genre. 
                Our mission is simple: <strong>help you watch smarter, share better, and experience more.</strong>
              </p>
            </div>
          </section>

          {/* Join Community Section */}
          <section className="about-section cta-section">
            <div className="section-icon">
              <i className="bi bi-lightning-charge-fill"></i>
            </div>
            <h2 className="section-title">💡 Join the MAVER Community</h2>
            <div className="cta-content">
              <p className="cta-text">
                Dive into the stories that shape culture. Discover. Review. Recommend.
              </p>
              <p className="cta-slogan">
                <strong>Be a MAVER — not just a viewer, but a voice.</strong>
              </p>
              <div className="cta-buttons">
                <button 
                  className="btn btn-film"
                  onClick={() => navigate('/watchlist')}
                >
                  <i className="bi bi-bookmark-fill me-2"></i>
                  Start Your Watchlist
                </button>
                <button 
                  className="btn btn-outline-hero"
                  onClick={() => navigate('/')}
                >
                  <i className="bi bi-film me-2"></i>
                  Explore Movies
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
      <FriendButton />
    </div>
  )
}

export default AboutUs


