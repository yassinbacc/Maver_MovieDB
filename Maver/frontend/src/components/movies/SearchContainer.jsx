import CustomSelect from '../common/CustomSelect'

function SearchContainer({ searchFilters, onSearchChange, onSearchSubmit, genres, onClear }) {
  const hasActiveFilters = searchFilters.title || searchFilters.genre || searchFilters.actor

  const genreOptions = [
    { value: '', label: 'All Genres' },
    ...genres.map(genre => ({ value: genre, label: genre }))
  ]

  return (
    <div className="search-container glass-effect" id='spp'>
      <h4>
        <i className="bi bi-search me-2"></i>
        Search for a Movie
      </h4>
      <form className="search-form" onSubmit={onSearchSubmit}>
        <div className="search-row">
          <div className="input-group-wrapper">
            <span className="input-group-text">
              <i className="bi bi-film"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Movie Title"
              value={searchFilters.title}
              onChange={(e) => onSearchChange({ ...searchFilters, title: e.target.value })}
            />
          </div>

          <div className="input-group-wrapper">
            <span className="input-group-text">
              <i className="bi bi-tags-fill"></i>
            </span>
            <CustomSelect
              value={searchFilters.genre}
              onChange={(e) => onSearchChange({ ...searchFilters, genre: e.target.value })}
              options={genreOptions}
              placeholder="All Genres"
            />
          </div>

          <div className="input-group-wrapper">
            <span className="input-group-text">
              <i className="bi bi-person-fill"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Actor Name"
              value={searchFilters.actor}
              onChange={(e) => onSearchChange({ ...searchFilters, actor: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-film search-btn">
            <i className="bi bi-search me-1"></i>
            <span className="filter-text">Search</span>
          </button>

          {hasActiveFilters && (
            <button 
              type="button" 
              className="btn btn-secondary search-btn"
              onClick={onClear}
              title="Clear all filters"
            >
              <i className="bi bi-x-circle me-1"></i>
              <span className="filter-text">Clear</span>
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default SearchContainer

