import React, { useCallback } from 'react'
import searchicon from "../assets/search.svg";
const Search = ({searchTerm,setSearchTerm}) => {
    const handleChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, [setSearchTerm]);

    return (
        <div className="search">
            <div>
                <img src={searchicon} alt="search" />
                <input
                    type="text"
                    className="search-input"
                    onChange={handleChange}
                    value={searchTerm}
                    placeholder="Search..."
                    />
            </div>
        </div>
    )
}
export default Search
