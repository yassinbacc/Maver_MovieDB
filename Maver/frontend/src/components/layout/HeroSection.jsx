import { useRef } from 'react'
import { Link } from 'react-router-dom'
import bgimg from '../../assets/bgimg.jpg'

function HeroSection({ user }) {
  const heroRef = useRef(null)
  const isActor = user?.role === 'acteur'

  return (
    <section className="hero" ref={heroRef} style={{ '--bg-image': `url(${bgimg})` }}>
      <div className="hero-gradient-overlay"></div>
      <div className="hero-content">
        <div className="hero-text-wrapper">
          <h1 className="hero-title">
            {isActor ? (
              <>
                <span className="title-line">Browse</span>
                <span className="title-line highlight">Movies</span>
              </>
            ) : (
              <>
                <span className="title-line">Your Cinema</span>
                <span className="title-line highlight">Experience</span>
              </>
            )}
          </h1>
          <p className="hero-description">
            {isActor 
              ? "Browse and explore movies in the MAVER collection."
              : "Discover, comment, and share your favorite films with the MAVER community."
            }
          </p>
          <div className="hero-buttons">
            {!isActor && (
              <Link 
                className="btn btn-film btn-lg btn-hero" 
                to="/watchlist"
              >
                <i className="bi bi-bookmark-fill me-2"></i>
                Watchlist
              </Link>
            )}
            <Link 
              className="btn btn-outline-hero btn-lg" 
              to="/about"
            >
              <i className="bi bi-info-circle me-2"></i>
              <span> </span>
              More Info
            </Link>
            {isActor && (
              <Link 
                className="btn btn-film btn-lg btn-hero" 
                to="/actor-dashboard"
              >
                <i className="bi bi-speedometer2 me-2"></i>
                <span>  </span>
                My Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="hero-scroll-indicator">
        <div className="scroll-mouse">
          <div className="scroll-wheel"></div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection

