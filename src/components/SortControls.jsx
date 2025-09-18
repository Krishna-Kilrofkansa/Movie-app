import React from 'react'

const sortOptions = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'popularity.asc', label: 'Least Popular' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'vote_average.asc', label: 'Lowest Rated' }
];

const SortControls = ({ sortBy, onSortChange }) => {

    return (
        <div className="sort-controls">
            <label htmlFor="sort-select" className="sort-label">
                Sort by:
            </label>
            <select 
                id="sort-select"
                value={sortBy} 
                onChange={(e) => onSortChange(e.target.value)}
                className="sort-select"
            >
                {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

export default SortControls
