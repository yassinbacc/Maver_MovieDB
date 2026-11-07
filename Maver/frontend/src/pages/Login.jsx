import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import loginImg from '../assets/LOGINIMG.png'
import bgimg from '../assets/bgimg.jpg'
import '../components/auth/AuthForm.css'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8080'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Login failed')
      }
      const data = await res.json()
      console.log('Login response:', data) // Debug log
      console.log('User role:', data.user.role) // Debug log
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('currentUser', JSON.stringify(data.user))
      setSuccessMessage('Welcome back!')
      // Redirect based on role (case-insensitive check)
      const userRole = (data.user.role || '').toLowerCase()
      console.log('Normalized role:', userRole) // Debug log
      if (userRole === 'admin') {
        setTimeout(() => navigate('/admin'), 800)
      } else if (userRole === 'acteur') {
        setTimeout(() => navigate('/actor-dashboard'), 800)
      } else {
        setTimeout(() => navigate('/'), 800)
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('fetch')) {
        setErrorMessage('Unable to reach server. Please try again later.')
      } else {
        setErrorMessage(err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="auth-title"><i className="bi bi-box-arrow-in-right"></i> Login</h1>
          <p className="auth-subtitle">Sign in to continue to MAVER.</p>
          <form className="auth-form" onSubmit={submit}>
            <div className="form-group">
              <input className="auth-input" type="email" name="email" id="email" placeholder="Email address"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} 
                autoComplete="email" required />
            </div>
            <div className="form-group password-input-group">
              <input 
                className="auth-input" 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                id="password" 
                placeholder="Password"
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                autoComplete="current-password"
                required 
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
              </button>
            </div>
            <div className="forgot-password-link">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <div className="auth-actions">
              <button className="btn btn-film" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
              <span className="auth-switch">No account? <Link to="/signup">Create one</Link></span>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Login



