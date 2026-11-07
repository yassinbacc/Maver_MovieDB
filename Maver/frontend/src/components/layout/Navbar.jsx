import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ProfileModal from '../profile/ProfileModal'

function Navbar({ user }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')) || user } catch { return user }
  })
  const location = useLocation()
  const navigate = useNavigate()
  
  useEffect(() => {
    const storedUser = (() => {
      try { return JSON.parse(localStorage.getItem('currentUser')) || user } catch { return user }
    })()
    setCurrentUser(storedUser)
  }, [user])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to={currentUser?.role === 'admin' ? '/admin' : '/'} className="navbar-brand">
          <img src="/src/assets/logo.png" className="navbar-logo" />                   
          <span className="navbar-brand-aver">AVER</span>
          {(currentUser?.role || '').toLowerCase() === 'admin' && (
            <span className="admin-badge-nav">ADMIN</span>
          )}
        </Link>
        
        <button 
          className={`navbar-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {(currentUser?.role || '').toLowerCase() === 'admin' ? (
            <>
              {/* No navbar links for admin */}
            </>
          ) : currentUser?.role === 'acteur' ? (
            <>
              <Link to="/actor-dashboard" className={`navbar-link ${location.pathname === '/actor-dashboard' ? 'active' : ''}`}>
                <i className="bi bi-speedometer2"></i>
                <span>Dashboard</span>
              </Link>
              <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
                <i className="bi bi-house-fill"></i>
                <span>Browse Movies</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
                <i className="bi bi-house-fill"></i>
                <span>Home</span>
              </Link>
              <Link to="/watchlist" className={`navbar-link ${location.pathname === '/watchlist' ? 'active' : ''}`}>
                <i className="bi bi-bookmark-fill"></i>
                <span>Watchlist</span>
              </Link>
              <Link to="/community" className={`navbar-link ${location.pathname === '/community' ? 'active' : ''}`}>
                <i className="bi bi-people-fill"></i>
                <span>Community</span>
              </Link>
            </>
          )}
          {currentUser?.role !== 'admin' && (
            <>
              <Link to="/about" className={`navbar-link ${location.pathname === '/about' ? 'active' : ''}`}>
                <i className="bi bi-info-circle-fill"></i>
                <span>About Us</span>
              </Link>
              <Link to="/contact" className={`navbar-link ${location.pathname === '/contact' ? 'active' : ''}`}>
                <i className="bi bi-envelope-fill"></i>
                <span>Contact</span>
              </Link>
            </>
          )}
        </div>
        
        <div className={`navbar-actions ${mobileMenuOpen ? 'active' : ''}`}>
          {currentUser?.email ? (
            <>
              {currentUser?.role !== 'admin' && (
                <div className="user-greeting">
                  <span>Hello, <span className="user-name">{currentUser.nom || currentUser.name || 'User'}</span></span>
                </div>
              )}
              <button
                className="profile-icon-button"
                onClick={() => setProfileModalOpen(true)}
                title="Account Settings"
              >
                {currentUser.profilePicture ? (
                  <img 
                    src={currentUser.profilePicture} 
                    alt="Profile" 
                    className="profile-icon-img"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className="profile-icon-placeholder" style={{ display: currentUser.profilePicture ? 'none' : 'flex' }}>
                  <i className="bi bi-person-circle"></i>
                </div>
              </button>
              <button
                className="logout-icon-button"
                onClick={() => {
                  localStorage.removeItem('authToken')
                  localStorage.removeItem('currentUser')
                  navigate('/login', { replace: true })
                }}
                title="Logout"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-light btn-sm">
                <i className="bi bi-box-arrow-in-right"></i>
                <span className="logout-text">Login</span>
              </Link>
            </>
          )}
        </div>
      </div>
      
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={currentUser}
        onProfileUpdate={(updatedUser) => {
          setCurrentUser(updatedUser)
          // Update localStorage
          localStorage.setItem('currentUser', JSON.stringify(updatedUser))
        }}
      />
    </nav>
  )
}

export default Navbar

