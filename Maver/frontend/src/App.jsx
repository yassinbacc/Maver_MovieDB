import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import FanDashboard from './pages/FanDashboard'
import MovieDetails from './pages/MovieDetails'
import ActorDetails from './pages/ActorDetails'
import ActorDashboard from './pages/ActorDashboard'
import Watchlist from './pages/Watchlist'
import FriendWatchlists from './pages/FriendWatchlists'
import Community from './pages/Community'
import AboutUs from './pages/AboutUs'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import AdminDashboard from './pages/AdminDashboard'
import ScrollToTop from './components/layout/ScrollToTop'
import { getCurrentUser } from './utils/auth'

const RequireAuth = ({ children }) => {
  const user = getCurrentUser()
  if (!user?.email) {
    return <Navigate to="/login" replace />
  }
  return children
}

const RequireAdmin = ({ children }) => {
  const user = getCurrentUser()
  if (!user?.email) {
    return <Navigate to="/login" replace />
  }
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return children
}

const AuthOnlyRoute = ({ children }) => {
  const user = getCurrentUser()
  if (user?.email) {
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  // Update page title based on user role
  useEffect(() => {
    const user = getCurrentUser()
    if (user?.role) {
      const role = user.role.toLowerCase()
      if (role === 'admin') {
        document.title = 'MAVER | Admin Space'
      } else if (role === 'acteur') {
        document.title = 'MAVER | Actor Space'
      } else {
        document.title = 'MAVER | Fan Space'
      }
    } else {
      document.title = 'MAVER | Fan Space'
    }
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <FanDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/film-details"
          element={
            <RequireAuth>
              <MovieDetails />
            </RequireAuth>
          }
        />
        <Route
          path="/acteur-details"
          element={
            <RequireAuth>
              <ActorDetails />
            </RequireAuth>
          }
        />
        <Route
          path="/actor-dashboard"
          element={
            <RequireAuth>
              <ActorDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/watchlist"
          element={
            <RequireAuth>
              <Watchlist />
            </RequireAuth>
          }
        />
        <Route
          path="/friend-watchlists/:friendId"
          element={
            <RequireAuth>
              <FriendWatchlists />
            </RequireAuth>
          }
        />
        <Route
          path="/community"
          element={
            <RequireAuth>
              <Community />
            </RequireAuth>
          }
        />
        <Route
          path="/about"
          element={
            <RequireAuth>
              <AboutUs />
            </RequireAuth>
          }
        />
        <Route
          path="/contact"
          element={
            <RequireAuth>
              <Contact />
            </RequireAuth>
          }
        />
        <Route
          path="/login"
          element={
            <AuthOnlyRoute>
              <Login />
            </AuthOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthOnlyRoute>
              <Signup />
            </AuthOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthOnlyRoute>
              <ForgotPassword />
            </AuthOnlyRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
