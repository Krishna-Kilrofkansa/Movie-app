import React, {useEffect, useState} from 'react'
import Search from "./components/Search.jsx";
import heroo from "./assets/hero.png"
import Spinner from "./components/Spinner.jsx";
import Moviecard from "./components/Moviecard.jsx";
import Pagination from "./components/Pagination.jsx";
import SortControls from "./components/SortControls.jsx";
import GenreFilter from "./components/GenreFilter.jsx";
import {useDebounce} from "react-use";

const API_BASE_URL = "https://api.themoviedb.org/3"

// Support both TMDB v4 Bearer token and v3 API key via env
const V4_TOKEN = import.meta.env.VITE_TMDB_V4_TOKEN || import.meta.env.VITE_TMDB_API_KEY;
const V3_API_KEY = import.meta.env.VITE_TMDB_API_KEY_V3;

const API_OPTIONS = V4_TOKEN ? {
    method: "GET",
    headers: {
        accept: "application/json",
        Authorization: `Bearer ${V4_TOKEN}`
    }
} : {
    method: "GET",
    headers: {
        accept: "application/json"
    }
}

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [errormessage, setErrormessage] = useState('');
    const [movielist, setMovielist] = useState([]);
    const [isloading, setIsloading] = useState(false);
    const [debounceSearchterm, setDebounceSearchterm] = useState('')
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('popularity.desc');
    const [sortOrder, setSortOrder] = useState('desc');
    const [genres, setGenres] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);

    useDebounce(() => setDebounceSearchterm(searchTerm), 1000,[searchTerm]);

    const fetchGenres = async() => {
        try {
            const response = await fetch(`${API_BASE_URL}/genre/movie/list`, API_OPTIONS);
            if (response.ok) {
                const data = await response.json();
                setGenres(data.genres || []);
            }
        } catch (error) {
            console.error('Error fetching genres:', error);
        }
    };

    const fetchMovies = async(query='', page=1) => {
        setIsloading(true);
        setErrormessage('');
        try{
            let searchOrDiscover;
            if (query) {
                searchOrDiscover = `/search/movie?query=${encodeURIComponent(query)}&page=${page}`;
            } else {
                // Add genre filter if genres are selected
                const genreFilter = selectedGenres.length > 0 ? `&with_genres=${selectedGenres.join(',')}` : '';
                searchOrDiscover = `/discover/movie?sort_by=${sortBy}&page=${page}${genreFilter}`;
            }
            const authQuery = !V4_TOKEN && V3_API_KEY ? `&api_key=${V3_API_KEY}` : '';
            const endpoint = `${API_BASE_URL}${searchOrDiscover}${authQuery}`;
            const response = await fetch(endpoint, API_OPTIONS);

            if(!response.ok) {
                let errorMessage = 'Error fetching movies';
                try {
                    const errData = await response.json();
                    if (errData && errData.status_message) errorMessage = errData.status_message;
                } catch {}
                throw new Error(errorMessage);
            }
            const data = await response.json();
            const results = Array.isArray(data.results) ? data.results : [];
            // Limit to maximum 100 pages to prevent excessive API calls
            setTotalPages(Math.min(data.total_pages || 1, 100));
            if(results.length === 0) {
                setErrormessage(query ? 'No movies found for your search.' : 'No movies to display.');
                setMovielist([]);
            } else {
                setMovielist(results);
            }
            console.log(data);
        }catch(e){
            console.error(`Error in fetchMovies:${e}`);
            setErrormessage(e?.message || 'Error in fetchMovies');
        }finally {
            setIsloading(false);
        }
    }

    useEffect(() => {
        fetchGenres(); // Fetch genres on component mount
    }, []);

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when search, sort, or genre changes
        fetchMovies(debounceSearchterm, 1);
    }, [debounceSearchterm, sortBy, selectedGenres])

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchMovies(debounceSearchterm, newPage);
    }

    const handleSortChange = (newSortBy) => {
        setSortBy(newSortBy);
        setCurrentPage(1); // Reset to page 1 when sorting changes
    }

    const handleGenreChange = (genreId) => {
        if (genreId === 'clear') {
            setSelectedGenres([]);
        } else {
            setSelectedGenres(prev => 
                prev.includes(genreId) 
                    ? prev.filter(id => id !== genreId)
                    : [...prev, genreId]
            );
        }
        setCurrentPage(1); // Reset to page 1 when genre changes
    }
    return (
        <main>
            <div className="pattern"></div>
            <div className="wrapper">
                <header>
                    <img src={heroo} alt="Hero Banner"/>
                    <h1>
                        Find The <span className="text-gradient">Movies</span> that you'll enjoy without hassle!!
                    </h1>
                <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>
                <section className="all-movies">
                    <div className="movies-header">
                        <h2 className="mt-[40px]">All Movies</h2>
                        <SortControls 
                            sortBy={sortBy}
                            onSortChange={handleSortChange}
                        />
                    </div>
                    <GenreFilter 
                        genres={genres}
                        selectedGenres={selectedGenres}
                        onGenreChange={handleGenreChange}
                    />
                    {isloading ? (
                        <Spinner/>
                    ):errormessage ? (
                        <p className="text-red-500">{errormessage}</p>
                    ):(
                        <>
                            <ul>
                                {movielist.map((movie) => (
                                    <Moviecard key={movie.id} movie={movie}/>
                                ))}
                            </ul>
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </section>


            </div>

        </main>
    )
}
export default App
