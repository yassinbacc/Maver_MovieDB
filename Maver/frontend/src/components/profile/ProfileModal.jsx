import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { profileService } from '../../services/api'
import './ProfileModal.css'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

function ProfileModal({ isOpen, onClose, user, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    profilePicture: '',
  })
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profilePictureFile, setProfilePictureFile] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const modalRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        nom: user.nom || '',
        email: user.email || '',
        profilePicture: user.profilePicture || '',
      })
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setProfilePictureFile(null)
      setProfilePicturePreview(null)
      setErrors({})
      setSuccessMessage('')
    }
  }, [isOpen, user])
  
  // Create preview when file is selected
  useEffect(() => {
    if (profilePictureFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result)
      }
      reader.readAsDataURL(profilePictureFile)
    } else {
      setProfilePicturePreview(null)
    }
  }, [profilePictureFile])

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden'
      
      // Handle Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      
      // Handle click outside
      const handleClickOutside = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          onClose()
        }
      }
      
      window.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleEscape)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen, onClose])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setProfilePictureFile(null)
      return
    }
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        profilePicture: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
      }))
      setProfilePictureFile(null)
      return
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({
        ...prev,
        profilePicture: 'File size must be less than 5MB'
      }))
      setProfilePictureFile(null)
      return
    }
    
    // Clear errors
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.profilePicture
      return newErrors
    })
    
    setProfilePictureFile(file)
  }
  
  const handleRemovePicture = () => {
    setProfilePictureFile(null)
    setProfilePicturePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setFormData(prev => ({
      ...prev,
      profilePicture: ''
    }))
  }

  const validateProfile = () => {
    const newErrors = {}
    
    if (!formData.nom || !formData.nom.trim()) {
      newErrors.nom = 'Name is required'
    }
    
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePassword = () => {
    const newErrors = {}
    
    if (!passwordData.oldPassword) {
      newErrors.oldPassword = 'Current password is required'
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateProfile()) {
      return
    }
    
    setLoading(true)
    setUploadingImage(false)
    setSuccessMessage('')
    
    try {
      let profilePictureUrl = formData.profilePicture
      
      // Upload new profile picture if file is selected
      if (profilePictureFile) {
        setUploadingImage(true)
        try {
          profilePictureUrl = await profileService.uploadProfilePicture(profilePictureFile)
        } catch (uploadError) {
          setErrors({ submit: uploadError.message || 'Failed to upload profile picture' })
          setLoading(false)
          setUploadingImage(false)
          return
        }
        setUploadingImage(false)
      }
      
      const updateData = {
        nom: formData.nom.trim(),
        email: formData.email.trim(),
      }
      
      if (profilePictureUrl) {
        updateData.profilePicture = profilePictureUrl
      }
      
      const updatedUser = await profileService.updateProfile(updateData)
      
      setSuccessMessage('Profile updated successfully!')
      
      if (onProfileUpdate) {
        onProfileUpdate(updatedUser)
      }
      
      // Auto-close after 1.5 seconds
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
      setUploadingImage(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (!validatePassword()) {
      return
    }
    
    setLoading(true)
    setSuccessMessage('')
    
    try {
      await profileService.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword
      )
      
      setSuccessMessage('Password changed successfully!')
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      
      // Auto-close after 1.5 seconds
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const profilePictureUrl = profilePicturePreview || formData.profilePicture || user?.profilePicture

  return createPortal(
    <div className="profile-modal-overlay">
      <div className="profile-modal-container" ref={modalRef}>
        <button className="profile-modal-close" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>
        
        <div className="profile-modal-header">
          <h2>Account Settings</h2>
          <div className="profile-modal-tabs">
            <button
              className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('profile')
                setErrors({})
                setSuccessMessage('')
              }}
            >
              <i className="bi bi-person-circle"></i>
              <span>Profile</span>
            </button>
            <button
              className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('password')
                setErrors({})
                setSuccessMessage('')
              }}
            >
              <i className="bi bi-lock-fill"></i>
              <span>Password</span>
            </button>
          </div>
        </div>

        <div className="profile-modal-content">
          {successMessage && (
            <div className="profile-success-message">
              <i className="bi bi-check-circle-fill"></i>
              {successMessage}
            </div>
          )}
          
          {errors.submit && (
            <div className="profile-error-message">
              <i className="bi bi-exclamation-circle-fill"></i>
              {errors.submit}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="profile-picture-section">
                <div className="profile-picture-preview">
                  {profilePictureUrl ? (
                    <>
                      <img src={profilePictureUrl} alt="Profile" onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }} />
                      <div className="profile-picture-placeholder" style={{ display: 'none' }}>
                        <i className="bi bi-person-circle"></i>
                      </div>
                      {profilePictureFile && (
                        <button
                          type="button"
                          className="remove-picture-btn"
                          onClick={handleRemovePicture}
                          title="Remove picture"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="profile-picture-placeholder">
                      <i className="bi bi-person-circle"></i>
                    </div>
                  )}
                </div>
                <div className="profile-picture-input-group">
                  <label htmlFor="profilePicture">Profile Picture</label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      id="profilePicture"
                      name="profilePicture"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className={errors.profilePicture ? 'error' : ''}
                      ref={fileInputRef}
                    />
                    <label htmlFor="profilePicture" className="file-input-label">
                      <i className="bi bi-cloud-upload"></i>
                      <span>{profilePictureFile ? 'Change Picture' : 'Choose Picture'}</span>
                    </label>
                  </div>
                  {profilePictureFile && (
                    <div className="file-info">
                      <i className="bi bi-file-image"></i>
                      <span>{profilePictureFile.name}</span>
                      <span className="file-size">
                        ({(profilePictureFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                  {errors.profilePicture && (
                    <span className="field-error">{errors.profilePicture}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="nom">Name</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleProfileChange}
                  placeholder="Your name"
                  className={errors.nom ? 'error' : ''}
                />
                {errors.nom && (
                  <span className="field-error">{errors.nom}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleProfileChange}
                  placeholder="your.email@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <span className="field-error">{errors.email}</span>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={onClose} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={loading || uploadingImage}>
                  {uploadingImage ? 'Uploading Image...' : loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="oldPassword">Current Password</label>
                <input
                  type="password"
                  id="oldPassword"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                  className={errors.oldPassword ? 'error' : ''}
                />
                {errors.oldPassword && (
                  <span className="field-error">{errors.oldPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your new password (min. 6 characters)"
                  className={errors.newPassword ? 'error' : ''}
                />
                {errors.newPassword && (
                  <span className="field-error">{errors.newPassword}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm your new password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={onClose} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ProfileModal

