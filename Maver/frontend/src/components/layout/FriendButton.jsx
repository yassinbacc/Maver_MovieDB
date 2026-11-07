import { useState, useEffect } from 'react'
import FriendSidebar from './FriendSidebar'
import { friendService, userService } from '../../services/api'
import '../../pages/FanDashboard.css'

function FriendButton() {
  const [isFriendSidebarOpen, setIsFriendSidebarOpen] = useState(false)
  const [hasNotifications, setHasNotifications] = useState(false)
  const [user, setUser] = useState(null)
  const [isActor, setIsActor] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await userService.getCurrentUser().catch(() => null)
        setUser(userData)
        setIsActor(userData?.role === 'acteur')
      } catch (error) {
        console.error('Error checking user:', error)
      }
    }
    checkUser()
  }, [])

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const incoming = await friendService.getIncomingRequests().catch(() => [])
        const hasPendingRequests = incoming && incoming.length > 0
        setHasNotifications(hasPendingRequests)
      } catch (error) {
        console.error('Error checking notifications:', error)
      }
    }

    checkNotifications()

    const interval = setInterval(checkNotifications, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isFriendSidebarOpen) {
      const checkNotifications = async () => {
        try {
          const incoming = await friendService.getIncomingRequests().catch(() => [])
          const hasPendingRequests = incoming && incoming.length > 0
          setHasNotifications(hasPendingRequests)
        } catch (error) {
          console.error('Error checking notifications:', error)
        }
      }
      checkNotifications()
    }
  }, [isFriendSidebarOpen])

  if (isActor) {
    return null
  }

  return (
    <>
      <button
        className={`floating-friend-btn ${hasNotifications ? 'has-notification' : ''}`}
        onClick={() => setIsFriendSidebarOpen(true)}
        aria-label="Open Friends"
        title="Friends"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        {hasNotifications && (
          <span className="friend-notification-badge"></span>
        )}
      </button>

      <FriendSidebar
        isOpen={isFriendSidebarOpen}
        onClose={() => setIsFriendSidebarOpen(false)}
      />
    </>
  )
}

export default FriendButton









