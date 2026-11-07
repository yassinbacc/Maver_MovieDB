import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AlertMessage from '../components/common/AlertMessage'
import { adminService } from '../services/api'
import { getCurrentUser } from '../utils/auth'
import './AdminDashboard.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('users') // 'users', 'posts', or 'messages'
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [editForm, setEditForm] = useState({ nom: '', email: '', role: '', password: '' })

  useEffect(() => {
    const currentUser = getCurrentUser()
    console.log('AdminDashboard - Current user:', currentUser) // Debug log
    console.log('AdminDashboard - User role:', currentUser?.role) // Debug log
    const userRole = (currentUser?.role || '').toLowerCase()
    if (!currentUser || userRole !== 'admin') {
      console.log('AdminDashboard - Redirecting to login, role is:', userRole) // Debug log
      navigate('/login')
      return
    }
    setUser(currentUser)
    // Update page title based on role
    document.title = 'MAVER | Admin Space'
    loadCounts() // Load all counts on mount
    loadData() // Load initial tab data
  }, [navigate])

  const loadData = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      if (activeTab === 'users') {
        const usersData = await adminService.getAllUsers()
        setUsers(usersData)
      } else if (activeTab === 'posts') {
        const postsData = await adminService.getAllPosts()
        setPosts(postsData)
      } else if (activeTab === 'messages') {
        const messagesData = await adminService.getAllMessages()
        setMessages(messagesData)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Load counts for all tabs on mount and when data changes
  const loadCounts = async () => {
    try {
      // Load all data in parallel to get accurate counts
      const [usersData, postsData, messagesData] = await Promise.all([
        adminService.getAllUsers().catch(() => []),
        adminService.getAllPosts().catch(() => []),
        adminService.getAllMessages().catch(() => [])
      ])
      setUsers(usersData)
      setPosts(postsData)
      setMessages(messagesData)
    } catch (err) {
      console.error('Error loading counts:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  // Lock body scroll when modal is open and handle Escape key
  useEffect(() => {
    if (editingUser) {
      // Save current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      // Handle Escape key to close modal
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setEditingUser(null)
          setEditForm({ nom: '', email: '', role: '', password: '' })
        }
      }
      
      window.addEventListener('keydown', handleEscape)
      
      return () => {
        // Restore scroll position
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
        window.removeEventListener('keydown', handleEscape)
      }
    }
  }, [editingUser])

  const handleEditUser = (user) => {
    setEditingUser(user)
    // Convert role to lowercase for the form (backend expects uppercase but we store lowercase in form)
    const roleValue = user.role ? user.role.toLowerCase() : 'fan'
    setEditForm({
      nom: user.nom || '',
      email: user.email || '',
      role: roleValue,
      password: ''
    })
  }

  const handleSaveUser = async (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    try {
      setErrorMessage('')
      setSuccessMessage('')
      
      // Validate required fields
      if (!editForm.nom || !editForm.nom.trim()) {
        setErrorMessage('Name is required')
        return
      }
      if (!editForm.email || !editForm.email.trim()) {
        setErrorMessage('Email is required')
        return
      }
      
      const updateData = {
        nom: editForm.nom.trim(),
        email: editForm.email.trim(),
        role: editForm.role // Backend will convert to uppercase
      }
      
      // Only include password if it's not empty
      if (editForm.password && editForm.password.trim() !== '') {
        if (editForm.password.trim().length < 6) {
          setErrorMessage('Password must be at least 6 characters')
          return
        }
        updateData.password = editForm.password.trim()
      }
      
      console.log('Updating user:', editingUser.id, updateData)
      const result = await adminService.updateUser(editingUser.id, updateData)
      console.log('Update result:', result)
      
      setSuccessMessage('User updated successfully')
      setEditingUser(null)
      setEditForm({ nom: '', email: '', role: '', password: '' })
      await loadCounts()
      loadData()
    } catch (err) {
      console.error('Error updating user:', err)
      setErrorMessage(err.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }
    try {
      setErrorMessage('')
      await adminService.deleteUser(userId)
      setSuccessMessage('User deleted successfully')
      await loadCounts()
      loadData()
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete user')
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post)
    setEditForm({ content: post.content })
  }

  const handleSavePost = async () => {
    try {
      setErrorMessage('')
      await adminService.updatePost(editingPost.id, editForm.content)
      setSuccessMessage('Post updated successfully')
      setEditingPost(null)
      setEditForm({ content: '' })
      await loadCounts()
      loadData()
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update post')
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }
    try {
      setErrorMessage('')
      await adminService.deletePost(postId)
      setSuccessMessage('Post deleted successfully')
      await loadCounts()
      loadData()
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete post')
    }
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="admin-dashboard">
      <Navbar user={user} />
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">
            <span className="admin-title-icon">
              <i className="bi bi-shield-check"></i>
            </span>
            <span className="admin-title-text">
              <span className="admin-title-main">Admin Dashboard</span>
              <span className="admin-title-subtitle">Manage users and community posts</span>
            </span>
          </h1>
        </div>

        <AlertMessage type="danger" message={errorMessage} onClose={() => setErrorMessage('')} />
        <AlertMessage type="success" message={successMessage} onClose={() => setSuccessMessage('')} />

        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people"></i> Users ({users.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <i className="bi bi-chat-dots"></i> Posts ({posts.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <i className="bi bi-envelope"></i> Messages ({messages.length})
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : activeTab === 'users' ? (
          <div className="admin-content">
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.nom}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      </td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditUser(u)}
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.id === user.id}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'posts' ? (
          <div className="admin-content">
            <div className="posts-list">
              {posts.map((post) => (
                <div key={post.id} className="post-item">
                  <div className="post-header">
                    <div>
                      <strong>{post.user.nom}</strong> ({post.user.email})
                    </div>
                    <div className="post-date">
                      {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="post-content">
                    {editingPost?.id === post.id ? (
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        rows="4"
                      />
                    ) : (
                      <p>{post.content}</p>
                    )}
                  </div>
                  <div className="post-actions">
                    {editingPost?.id === post.id ? (
                      <>
                        <button className="btn-save" onClick={handleSavePost}>
                          <i className="bi bi-check"></i> Save
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => {
                            setEditingPost(null)
                            setEditForm({ content: '' })
                          }}
                        >
                          <i className="bi bi-x"></i> Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditPost(post)}
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-content">
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.id} className={msg.read ? '' : 'unread-message'}>
                      <td>{msg.id}</td>
                      <td>{msg.name}</td>
                      <td>{msg.subject}</td>
                      <td className="message-preview">{msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message}</td>
                      <td>{new Date(msg.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${msg.read ? 'read' : 'unread'}`}>
                          {msg.read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td>
                        {!msg.read && (
                          <button
                            className="btn-mark-read"
                            onClick={async () => {
                              try {
                                await adminService.markMessageAsRead(msg.id)
                                setMessages(messages.map(m => m.id === msg.id ? { ...m, read: true } : m))
                                setSuccessMessage('Message marked as read')
                              } catch (err) {
                                setErrorMessage(err.message || 'Failed to mark message as read')
                              }
                            }}
                          >
                            <i className="bi bi-check"></i> Mark Read
                          </button>
                        )}
                        <button
                          className="btn-delete"
                          onClick={async () => {
                            if (!window.confirm('Are you sure you want to delete this message?')) {
                              return
                            }
                            try {
                              await adminService.deleteMessage(msg.id)
                              setMessages(messages.filter(m => m.id !== msg.id))
                              await loadCounts()
                              setSuccessMessage('Message deleted successfully')
                            } catch (err) {
                              setErrorMessage(err.message || 'Failed to delete message')
                            }
                          }}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {messages.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                        No messages found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
      
      {/* Edit User Modal - Rendered at root level to cover entire page */}
      {editingUser && (
        <div 
          className="edit-modal"
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              setEditingUser(null)
              setEditForm({ nom: '', email: '', role: '', password: '' })
            }
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit User</h3>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editForm.nom}
                onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                <option value="fan">Fan</option>
                <option value="acteur">Actor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>New Password (leave empty to keep current)</label>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-save" onClick={handleSaveUser}>
                Save
              </button>
              <button type="button" className="btn-cancel" onClick={() => {
                setEditingUser(null)
                setEditForm({ nom: '', email: '', role: '', password: '' })
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

