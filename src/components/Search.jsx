import React from 'react'
import searchicon from "../assets/search.svg";
const Search = ({searchTerm,setSearchTerm}) => {
    return (
        <div className="search">
            <div>
                <img src={searchicon} alt="search" />
                <input
                    type="text"
                    className="search-input"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    value={searchTerm}
                    placeholder="Search..."
                    />
            </div>
        </div>
    )
}
export default Search
