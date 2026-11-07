import FilmCard from './FilmCard'

function FilmsGrid({ title = "Our Selection", films, onFilmDetails, onOpenCommentModal, onActorDetails, selectedActors, onActorSelectionChange }) {
  // Get icon based on title
  const getIcon = () => {
    if (title.toLowerCase().includes('trending')) {
      return 'bi-fire'
    } else if (title.toLowerCase().includes('popular')) {
      return 'bi-star-fill'
    } else if (title.toLowerCase().includes('recommended')) {
      return 'bi-heart-fill'
    } else if (title.toLowerCase().includes('search')) {
      return 'bi-search'
    }
    return 'bi-collection-play-fill'
  }

  if (films.length === 0) {
    return null
  }

  return (
    <div className="films-section">
      <div className="section-header">
        <h4 className="section-title">
          <i className={`bi ${getIcon()} me-2`}></i>
          {title}
        </h4>
        <span className="film-count">{films.length} {films.length === 1 ? 'movie' : 'movies'}</span>
      </div>
      <div className="films-grid">
        {films.map((film, index) => (
          <FilmCard
            key={film.id}
            film={film}
            index={index}
            onFilmDetails={onFilmDetails}
            onOpenCommentModal={onOpenCommentModal}
            onActorDetails={onActorDetails}
            selectedActorId={selectedActors[film.id]}
            onActorSelectionChange={onActorSelectionChange}
          />
        ))}
      </div>
    </div>
  )
}

export default FilmsGrid

