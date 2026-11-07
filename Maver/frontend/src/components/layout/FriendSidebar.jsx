import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { friendService } from '../../services/api'
import './FriendSidebar.css'

function FriendSidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [friends, setFriends] = useState([])
  const [activeTab, setActiveTab] = useState('search')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const sidebarRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      loadRequests()
      loadFriends()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const loadRequests = async () => {
    try {
      const [incoming, outgoing] = await Promise.all([
        friendService.getIncomingRequests(),
        friendService.getOutgoingRequests()
      ])
      setIncomingRequests(incoming || [])
      setOutgoingRequests(outgoing || [])
    } catch (err) {
      console.error('Error loading requests:', err)
    }
  }

  const loadFriends = async () => {
    try {
      const friendsList = await friendService.getFriends()
      setFriends(friendsList || [])
    } catch (err) {
      console.error('Error loading friends:', err)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    try {
      const results = await friendService.searchUsers(searchQuery)
      setSearchResults(results || [])
    } catch (err) {
      setError(err.message || 'Failed to search users')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async (userId) => {
    try {
      await friendService.sendFriendRequest(userId)
      setSuccess('Friend request sent!')
      setTimeout(() => setSuccess(''), 3000)
      loadRequests()
    } catch (err) {
      setError(err.message || 'Failed to send request')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleAcceptRequest = async (requestId) => {
    try {
      await friendService.acceptFriendRequest(requestId)
      setSuccess('Friend request accepted!')
      setTimeout(() => setSuccess(''), 3000)
      loadRequests()
      loadFriends()
    } catch (err) {
      setError(err.message || 'Failed to accept request')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      await friendService.rejectFriendRequest(requestId)
      setSuccess('Friend request rejected')
      setTimeout(() => setSuccess(''), 3000)
      loadRequests()
    } catch (err) {
      setError(err.message || 'Failed to reject request')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleCancelRequest = async (requestId) => {
    try {
      await friendService.cancelFriendRequest(requestId)
      setSuccess('Friend request cancelled')
      setTimeout(() => setSuccess(''), 3000)
      loadRequests()
    } catch (err) {
      setError(err.message || 'Failed to cancel request')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleRemoveFriend = async (friendId) => {
    try {
      await friendService.removeFriend(friendId)
      setSuccess('Friend removed')
      setTimeout(() => setSuccess(''), 3000)
      loadFriends()
    } catch (err) {
      setError(err.message || 'Failed to remove friend')
      setTimeout(() => setError(''), 5000)
    }
  }

  return (
    <>
      {isOpen && <div className="friend-sidebar-backdrop" onClick={onClose} />}
      
      <div ref={sidebarRef} className={`friend-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="particles-container">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
        
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        
        <div className="friend-sidebar-header">
          <h2>Friends</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="friend-sidebar-tabs">
          <button
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
          <button
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => setActiveTab('requests')}
          >
            Requests
            {incomingRequests.length > 0 && (
              <span className="badge">{incomingRequests.length}</span>
            )}
          </button>
          <button
            className={activeTab === 'friends' ? 'active' : ''}
            onClick={() => setActiveTab('friends')}
          >
            Friends
          </button>
        </div>

        {error && (
          <div className="friend-sidebar-message error">
            {error}
          </div>
        )}
        {success && (
          <div className="friend-sidebar-message success">
            {success}
          </div>
        )}

        <div className="friend-sidebar-content">
          {activeTab === 'search' && (
            <div className="friend-sidebar-section">
              <form onSubmit={handleSearch} className="friend-search-form">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="friend-search-input"
                />
                <button type="submit" className="friend-search-btn" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="friend-search-results">
                  <h3>Search Results</h3>
                  {searchResults
                    .filter(user => user.role !== 'acteur')
                    .map((user) => (
                      <div key={user.id} className="friend-user-item">
                        <div className="friend-user-info">
                          <div className="friend-user-name">{user.nom}</div>
                          <div className="friend-user-email">{user.email}</div>
                          <div className="friend-user-role">{user.role}</div>
                        </div>
                        <button
                          className="friend-action-btn send"
                          onClick={() => handleSendRequest(user.id)}
                        >
                          Send Request
                        </button>
                      </div>
                    ))}
                  {searchResults.filter(user => user.role === 'acteur').length > 0 && (
                    <div className="friend-info-message" style={{ 
                      marginTop: '10px', 
                      padding: '10px', 
                      background: 'rgba(255, 152, 0, 0.1)', 
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '13px'
                    }}>
                      <i className="bi bi-info-circle me-2"></i>
                      Actors cannot be added as friends
                    </div>
                  )}
                </div>
              )}

              {searchQuery && !loading && searchResults.length === 0 && (
                <div className="friend-empty-state">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="friend-sidebar-section">
              <div className="friend-requests-section">
                <h3>Incoming Requests ({incomingRequests.length})</h3>
                {incomingRequests.length > 0 ? (
                  <div className="friend-requests-list">
                    {incomingRequests.map((request) => (
                      <div key={request.id} className="friend-request-item">
                        <div className="friend-user-info">
                          <div className="friend-user-name">{request.sender.nom}</div>
                          <div className="friend-user-email">{request.sender.email}</div>
                        </div>
                        <div className="friend-request-actions">
                          <button
                            className="friend-action-btn accept"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            Accept
                          </button>
                          <button
                            className="friend-action-btn reject"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="friend-empty-state">No incoming requests</div>
                )}
              </div>

              <div className="friend-requests-section">
                <h3>Outgoing Requests ({outgoingRequests.length})</h3>
                {outgoingRequests.length > 0 ? (
                  <div className="friend-requests-list">
                    {outgoingRequests.map((request) => (
                      <div key={request.id} className="friend-request-item">
                        <div className="friend-user-info">
                          <div className="friend-user-name">{request.receiver.nom}</div>
                          <div className="friend-user-email">{request.receiver.email}</div>
                        </div>
                        <button
                          className="friend-action-btn cancel"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="friend-empty-state">No outgoing requests</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="friend-sidebar-section">
              <h3>My Friends ({friends.length})</h3>
              {friends.length > 0 ? (
                <div className="friend-friends-list">
                  {friends.map((friend) => (
                    <div key={friend.id} className="friend-friend-item">
                      <div 
                        className="friend-user-info friend-user-clickable"
                        onClick={() => {
                          navigate(`/friend-watchlists/${friend.id}`)
                          onClose()
                        }}
                        style={{ cursor: 'pointer', flex: 1 }}
                        title="Click to view watchlists"
                      >
                        <div className="friend-user-name">
                          {friend.nom}
                          <i className="bi bi-arrow-right friend-watchlist-icon"></i>
                        </div>
                        <div className="friend-user-email">{friend.email}</div>
                        <div className="friend-user-role">{friend.role}</div>
                        <div className="friend-watchlist-hint">View Watchlists</div>
                      </div>
                      <button
                        className="friend-action-btn remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFriend(friend.id)
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="friend-empty-state">No friends yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default FriendSidebar









