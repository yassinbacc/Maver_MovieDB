import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedBackground from '../components/layout/AnimatedBackground'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import FriendButton from '../components/layout/FriendButton'
import { userService, contactService } from '../services/api'
import './Contact.css'

function Contact() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ nom: 'Fan' })
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: ''
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await userService.getCurrentUser().catch(() => ({ nom: 'Fan' }))
        setUser(userData)
        setFormData(prev => ({ ...prev, name: userData.nom || '' }))
      } catch (error) {
        console.error('Error loading user:', error)
      }
    }
    loadUser()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.subject || !formData.message) {
      setErrorMessage('Please fill in all fields.')
      return
    }

    if (isSubmitting) {
      return // Prevent double submission
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')
      setSuccessMessage('')
      
      await contactService.submitMessage(formData)
      
      // Success!
      setSuccessMessage('✓ Message sent successfully!')
      setFormData({ name: user.nom || '', subject: '', message: '' })
      
      // Auto-hide after 2 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 2000)
    } catch (error) {
      console.error('Error submitting message:', error)
      setErrorMessage(error.message || 'Failed to send message. Please try again.')
      setTimeout(() => {
        setErrorMessage('')
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
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
        
        {/* Back Button */}
        <button 
          className="btn-back"
          onClick={() => navigate('/')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Home
        </button>

        {/* Header */}
        <div className="contact-header">
          <h1 className="contact-title">
            <i className="bi bi-envelope-fill me-2"></i>
            <span> </span>
            Contact Us
          </h1>
          <p className="contact-subtitle">
            Have a question, suggestion, or feedback? We'd love to hear from you!
          </p>
        </div>

        {/* Contact Content */}
        <div className="contact-content">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-section">
              <h2 className="section-title">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    <i className="bi bi-person me-2"></i>
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    <i className="bi bi-tag me-2"></i>
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="form-control"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    <i className="bi bi-chat-left-text me-2"></i>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className="form-control"
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                <div className="submit-button-container">
                  <button type="submit" className="btn btn-film" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <i className="bi bi-hourglass-split me-2"></i>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-2"></i>
                        Send Message
                      </>
                    )}
                  </button>
                  
                  {/* Floating Success Toast - positioned next to button */}
                  {successMessage && (
                    <div className="floating-toast floating-toast-success">
                      <i className="bi bi-check-circle-fill"></i>
                      <span>{successMessage}</span>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Contact Info */}
            <div className="contact-info-section">
              <h2 className="section-title">Get in Touch</h2>
              <div className="contact-info-cards">
                <div className="info-card">
                  <div className="info-icon">
                    <i className="bi bi-envelope-fill"></i>
                  </div>
                  <h3>Email</h3>
                  <p>contact@maver.com</p>
                  <p>support@maver.com</p>
                </div>
                <div className="info-card">
                  <div className="info-icon">
                    <i className="bi bi-telephone-fill"></i>
                  </div>
                  <h3>Phone</h3>
                  <p>+216 99 123 456</p>
                  <p>Mon-Fri, 9am-6pm</p>
                </div>
                <div className="info-card">
                  <div className="info-icon">
                    <i className="bi bi-geo-alt-fill"></i>
                  </div>
                  <h3>Address</h3>
                  <p>123 Cinema Street</p>
                  <p>Entertainment City, EC 12345</p>
                </div>
              </div>
              <div className="social-links">
                <h3>Follow Us</h3>
                <div className="social-icons">
                  <a href="#" className="social-icon" title="Facebook">
                    <i className="bi bi-facebook"></i>
                  </a>
                  <a href="#" className="social-icon" title="Twitter">
                    <i className="bi bi-twitter"></i>
                  </a>
                  <a href="#" className="social-icon" title="Instagram">
                    <i className="bi bi-instagram"></i>
                  </a>
                  <a href="#" className="social-icon" title="LinkedIn">
                    <i className="bi bi-linkedin"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <FriendButton />
    </div>
  )
}

export default Contact





