import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import loginImg from '../assets/LOGINIMG.png'
import bgimg from '../assets/bgimg.jpg'
import '../components/auth/AuthForm.css'

function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nom: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    if (!form.password || form.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8080'}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: form.nom.trim(), email: form.email.trim(), password: form.password })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Signup failed')
      }
      const data = await res.json()
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('currentUser', JSON.stringify(data.user))
      setSuccessMessage('Account created! Redirecting...')
      setTimeout(() => navigate('/'), 800)
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('fetch')) {
        setErrorMessage('Unable to reach server. Please try again later.')
      } else {
        setErrorMessage(err.message || 'Signup failed')
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
          <h1 className="auth-title"><i className="bi bi-person-plus-fill"></i> Sign up</h1>
          <p className="auth-subtitle">Create your account to join MAVER.</p>
          <form className="auth-form" onSubmit={submit}>
            <div className="form-group">
              <input className="auth-input" type="text" name="name" id="name" placeholder="Full name"
                value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} 
                autoComplete="name" required />
            </div>
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
                placeholder="Password (min 6 chars)"
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                autoComplete="new-password"
                required 
                minLength={6} 
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
            <div className="auth-actions">
              <button className="btn btn-film" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create account'}
              </button>
              <span className="auth-switch">Have an account? <Link to="/login">Log in</Link></span>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Signup



