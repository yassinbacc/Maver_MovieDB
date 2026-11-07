function CommentModal({ 
  show, 
  selectedFilm, 
  commentForm, 
  hoveredRating,
  onClose, 
  onSubmit, 
  onRatingClick,
  onRatingHover,
  onCommentChange 
}) {
  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content slide-in-top" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="bi bi-chat-left-dots-fill me-2"></i>
            Add a Comment
          </h5>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="comment-film-card">
              <h6 className="comment-film-title">
                {selectedFilm?.titre}
              </h6>
              {selectedFilm?.annee_sortie && (
                <span className="comment-film-year">{selectedFilm.annee_sortie}</span>
              )}
            </div>

            <div className="rating-section">
              <label className="rating-label">Your Rating</label>
              <div 
                className="rating-stars"
                onMouseLeave={() => onRatingHover(0)}
              >
                {[1, 2, 3, 4, 5].map(rating => (
                  <span
                    key={rating}
                    className={`rating-star ${
                      (hoveredRating >= rating || commentForm.rating >= rating) ? 'active' : ''
                    } ${commentForm.rating >= rating ? 'selected' : ''}`}
                    onClick={() => onRatingClick(rating)}
                    onMouseEnter={() => onRatingHover(rating)}
                  >
                    ★
                  </span>
                ))}
              </div>
              {commentForm.rating > 0 && (
                <p className="rating-text">{commentForm.rating} / 5 stars</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="commentText" className="form-label">
                <i className="bi bi-pencil-fill me-2"></i>
                Your Comment
              </label>
              <textarea
                className="form-control comment-textarea"
                id="commentText"
                rows="4"
                value={commentForm.comment}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder="Share your thoughts, feedback, or critique..."
                required
              />
              <small className="form-hint">
                {commentForm.comment.length} characters
              </small>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-film">
              <i className="bi bi-send-fill me-1"></i>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CommentModal

