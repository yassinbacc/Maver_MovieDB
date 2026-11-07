/**
 * Authentication utility functions
 */

/**
 * Get current user from localStorage
 * @returns {Object|null} Current user object or null
 */
export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null')
  } catch {
    return null
  }
}

/**
 * Get auth token from localStorage
 * @returns {string|null} Auth token or null
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  const user = getCurrentUser()
  return user && user.email ? true : false
}

/**
 * Clear authentication data from localStorage
 */
export const clearAuth = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('currentUser')
}

