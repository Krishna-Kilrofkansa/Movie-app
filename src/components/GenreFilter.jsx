import React from 'react'

const GenreFilter = ({ genres, selectedGenres, onGenreChange }) => {
    if (genres.length === 0) return null;

    return (
        <div className="genre-filter">
            <h3 className="genre-title">Filter by Genre</h3>
            <div className="genre-grid">
                {genres.map((genre) => (
                    <label key={genre.id} className="genre-item">
                        <input
                            type="checkbox"
                            checked={selectedGenres.includes(genre.id)}
                            onChange={() => onGenreChange(genre.id)}
                            className="genre-checkbox"
                        />
                        <span className="genre-label">{genre.name}</span>
                    </label>
                ))}
            </div>
            {selectedGenres.length > 0 && (
                <button 
                    onClick={() => onGenreChange('clear')}
                    className="clear-genres-btn"
                >
                    Clear All
                </button>
            )}
        </div>
    )
}

export default GenreFilter
