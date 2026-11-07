function AlertMessage({ type, message, onClose }) {
  if (!message) return null

  return (
    <div className={`alert alert-${type} slide-in-top`}>
      <div className="alert-content">
        <i className={`bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
        {message}
      </div>
      <button 
        type="button" 
        className="alert-close"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  )
}

export default AlertMessage

