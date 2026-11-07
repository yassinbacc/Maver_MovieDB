import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import loginImg from '../assets/LOGINIMG.png'
import bgimg from '../assets/bgimg.jpg'
import '../components/auth/AuthForm.css'

function ForgotPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [form, setForm] = useState({ email: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(true)
  const [showConfirmPassword, setShowConfirmPassword] = useState(true)
  const [emailSent, setEmailSent] = useState(false)

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8080'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim() })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to send reset email')
      }
      const data = await res.json()
      setEmailSent(true)
      
      // In production, token would be sent via email
      // For now, if token is returned, redirect to reset page
      if (data.token) {
        setSuccessMessage('Redirecting to password reset page...')
        setTimeout(() => {
          navigate(`/forgot-password?token=${data.token}`)
        }, 1500)
      } else {
        setSuccessMessage('If an account exists with this email, you will receive password reset instructions.')
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('fetch')) {
        setErrorMessage('Unable to reach server. Please try again later.')
      } else {
        setErrorMessage(err.message || 'Failed to send reset email')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    
    if (!form.newPassword || form.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }
    
    if (form.newPassword !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8080'}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token,
          newPassword: form.newPassword 
        })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to reset password')
      }
      setSuccessMessage('Password reset successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('fetch')) {
        setErrorMessage('Unable to reach server. Please try again later.')
      } else {
        setErrorMessage(err.message || 'Failed to reset password')
      }
    } finally {
      setLoading(false)
    }
  }

  // If token is present, show reset password form
  if (token) {
    return (
      <div className="auth-page" style={{ backgroundImage: `url(${bgimg})` }}>
        <div className="auth-header">
          <div className="auth-header-content">
            <img src={loginImg} alt="MAVER" className="auth-logo-img" />
          </div>
        </div>
        <div className="container auth-content">
          <AlertMessage type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
          <AlertMessage type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
          <div className="auth-wrapper">
            <h1 className="auth-title"><i className="bi bi-key-fill"></i> Reset Password</h1>
            <p className="auth-subtitle">Enter your new password below.</p>
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="form-group password-input-group">
                <input className="auth-input" type={showPassword ? 'text' : 'password'} placeholder="New Password (min 6 chars)"
                  value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required minLength={6} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                </button>
              </div>
              <div className="form-group password-input-group">
                <input className="auth-input" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm New Password"
                  value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required minLength={6} />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <i className={showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                </button>
              </div>
              <div className="auth-actions">
                <button className="btn btn-film" type="submit" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <span className="auth-switch">Remember your password? <Link to="/login">Log in</Link></span>
              </div>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Otherwise, show forgot password form
  return (
    <div className="auth-page" style={{ backgroundImage: `url(${bgimg})` }}>
      <div className="auth-header">
        <div className="auth-header-content">
          <img src={loginImg} alt="MAVER" className="auth-logo-img" />
        </div>
      </div>
      <div className="container auth-content">
        <AlertMessage type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
        <AlertMessage type="success" message={successMessage} onClose={() => setSuccessMessage('')} />
        <div className="auth-wrapper">
          <h1 className="auth-title"><i className="bi bi-key-fill"></i> Forgot Password</h1>
          <p className="auth-subtitle">Enter your email address and we'll send you a link to reset your password.</p>
          {!emailSent ? (
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <div className="form-group">
                <input className="auth-input" type="email" placeholder="Email address"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="auth-actions">
                <button className="btn btn-film" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <span className="auth-switch">Remember your password? <Link to="/login">Log in</Link></span>
              </div>
            </form>
          ) : (
            <div className="email-sent-message">
              <p>Check your email for password reset instructions.</p>
              <p className="email-sent-subtext">Didn't receive the email? Check your spam folder or try again.</p>
              <button className="btn btn-film" onClick={() => {
                setEmailSent(false)
                setForm({ ...form, email: '' })
                setSuccessMessage('')
              }} style={{ marginTop: '1rem' }}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default ForgotPassword

