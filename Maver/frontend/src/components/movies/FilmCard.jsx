function FilmCard({ film, index, onFilmDetails, onOpenCommentModal, onActorDetails, selectedActorId, onActorSelectionChange }) {
  return (
    <div 
      className="film-card fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="card-body">
        <div className="film-image-wrapper">
          <div className="film-poster-overlay"></div>
          <img
            src={film.url}
            alt={`Affiche de ${film.titre}`}
            className="film-img"
            loading="lazy"
            onError={(e) => {
              e.target.src = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=400&fit=crop&crop=faces`
            }}
          />
          <div className="card-overlay">
            <div className="overlay-content">
              <button
                className="btn btn-film btn-overlay"
                onClick={() => onFilmDetails(film.id)}
              >
                <i className="bi bi-info-circle-fill me-1"></i>
                Details
              </button>

              {onOpenCommentModal && (
                <button
                  className="btn btn-comment btn-overlay"
                  onClick={() => onOpenCommentModal(film)}
                >
                  <i className="bi bi-chat-left-text-fill me-1"></i>
                  Comment
                </button>
              )}

              <div className="actors-section">
                <p className="actors-label">
                  <strong><i className="bi bi-people-fill me-1"></i>Actors:</strong>
                </p>
                {film.acteurs && film.acteurs.length > 0 ? (
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const selectedValue = e.target.querySelector('select').value
                    if (selectedValue) {
                      onActorDetails(e, film.id)
                    }
                  }}>
                    <select
                      className="form-select actor-select"
                      value={selectedActorId || ''}
                      onChange={(e) => {
                        const actorId = e.target.value
                        onActorSelectionChange(film.id, actorId)
                      }}
                      required
                    >
                      <option value="" disabled>Select an actor</option>
                      {film.acteurs.map((acteur, idx) => {
                        // Construct actor ID using tmdb_id for proper lookup
                        // Format: filmId_actor_tmdbId (preferred) or filmId_actor_index (fallback)
                        const actorId = acteur.id || (acteur.tmdb_id 
                          ? `${film.id}_actor_${acteur.tmdb_id}` 
                          : `${film.id}_actor_${idx}`)
                        return (
                          <option key={acteur.id ?? `acteur-${idx}`} value={actorId}>
                            {acteur.nom || `Actor ${idx + 1}`}
                          </option>
                        )
                      })}
                    </select>
                    <button 
                      type="submit" 
                      className="btn btn-film w-100 mt-2"
                      disabled={!selectedActorId}
                    >
                      <i className="bi bi-info-circle-fill me-1"></i>
                      Actor Details
                    </button>
                  </form>
                ) : (
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', margin: 0 }}>
                    No actors available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="film-header">
          <h5>{film.titre}</h5>
          <div className="film-meta">
            <small>
              <i className="bi bi-calendar3 me-1"></i>
              {film.annee_sortie} • <span className="badge">{film.genre}</span>
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilmCard

