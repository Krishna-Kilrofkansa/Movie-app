import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react'
import { gsap } from 'gsap'
import { CpuChipIcon } from '@heroicons/react/24/outline'
import Search from "./components/Search.jsx";
import heroo from "./assets/hero.png"
import Spinner from "./components/Spinner.jsx";
import Moviecard from "./components/Moviecard.jsx";
import TopMovies from "./components/TopMovies.jsx";
import Pagination from "./components/Pagination.jsx";
import SortControls from "./components/SortControls.jsx";
import GenreFilter from "./components/GenreFilter.jsx";
import PersonalityRecommender from "./components/PersonalityRecommender.jsx";
import {useDebounce} from "react-use";

const API_BASE_URL = "https://api.themoviedb.org/3"
const ALLOWED_ENDPOINTS = ['/search/movie', '/discover/movie', '/genre/movie/list', '/trending/movie/week'];

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
    const [expandedMovie, setExpandedMovie] = useState(null);
    const [topMovies, setTopMovies] = useState([]);
    const [showAIRecommender, setShowAIRecommender] = useState(false);
    const movieListRef = useRef(null);



    // Memoized URL builder to prevent object creation on every call
    const buildSafeUrl = useMemo(() => (endpoint, params = {}) => {
        if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
            throw new Error('Unauthorized API endpoint');
        }
        
        try {
            const url = new URL(`${API_BASE_URL}${endpoint}`);
            
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) url.searchParams.set(key, value);
            });
            
            return url.toString();
        } catch (error) {
            throw new Error(`Invalid URL construction: ${error.message}`);
        }
    }, []);

    useDebounce(() => setDebounceSearchterm(searchTerm), 1000,[searchTerm]);

    const fetchGenres = async() => {
        try {
            const genreEndpoint = buildSafeUrl('/genre/movie/list');
            const response = await fetch(genreEndpoint, API_OPTIONS);
            if (response.ok) {
                const data = await response.json();
                setGenres(data.genres || []);
            }
        } catch (error) {
            console.error('Error fetching genres:', error);
        }
    };

    const fetchTopMovies = async() => {
        try {
            const topMoviesEndpoint = buildSafeUrl('/trending/movie/week');
            const response = await fetch(topMoviesEndpoint, API_OPTIONS);
            if (response.ok) {
                const data = await response.json();
                setTopMovies(data.results?.slice(0, 4) || []);
            }
        } catch (error) {
            console.error('Error fetching top movies:', error);
        }
    };

    const fetchMovies = async(query='', page=1) => {
        setIsloading(true);
        setErrormessage('');
        try{
            // Authentication parameters
            const params = { page };
            if (!V4_TOKEN && V3_API_KEY) params.api_key = V3_API_KEY;
            
            // Query parameters
            if (query) {
                params.query = query;
            } else {
                // Filtering parameters
                if (sortBy) params.sort_by = sortBy;
                if (selectedGenres.length > 0) params.with_genres = selectedGenres.join(',');
            }
            
            const endpoint = buildSafeUrl(query ? '/search/movie' : '/discover/movie', params);
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
        fetchTopMovies(); // Fetch top movies on component mount
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
    
    const handleMovieExpand = useCallback((movieId) => {
        setExpandedMovie(movieId)
        
        // Animate other cards to move aside
        const listItems = movieListRef.current?.querySelectorAll('li')
        listItems?.forEach((item) => {
            const itemMovieId = parseInt(item.dataset.movieId, 10)
            if (itemMovieId !== movieId) {
                gsap.to(item, {
                    scale: 0.9,
                    opacity: 0.6,
                    duration: 0.3,
                    ease: "power2.out"
                })
            }
        })
    }, [])
    
    const handleMovieClose = useCallback(() => {
        setExpandedMovie(null)
        
        // Animate cards back to normal
        const listItems = movieListRef.current?.querySelectorAll('li')
        listItems?.forEach((item) => {
            gsap.to(item, {
                scale: 1,
                opacity: 1,
                duration: 0.3,
                ease: "power2.out"
            })
        })
    }, [])
    
    // Handle outside click to close expanded movie
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (expandedMovie && !e.target.closest('.movie-card.expanded')) {
                handleMovieClose()
            }
        }
        
        if (expandedMovie) {
            document.addEventListener('click', handleOutsideClick)
        }
        
        return () => {
            document.removeEventListener('click', handleOutsideClick)
        }
    }, [expandedMovie, handleMovieClose])
    return (
        <main>
            <div className="pattern"></div>
            
            {/* Top Navigation Bar */}
            <nav className="top-nav">
                <div className="nav-container">
                    <div className="nav-logo">
                        <span className="text-gradient">MovieFinder</span>
                    </div>
                    <button 
                        className="ai-nav-btn"
                        onClick={() => setShowAIRecommender(!showAIRecommender)}
                    >
                        <CpuChipIcon className="w-5 h-5" />
                        AI Recommender
                    </button>
                </div>
            </nav>
            
            <div className="wrapper">
                {showAIRecommender ? (
                    <PersonalityRecommender />
                ) : (
                    <>
                        <header>
                            <h1>
                                Find The <span className="text-gradient">Movies</span> that you'll enjoy without hassle!!
                            </h1>
                            
                            {!debounceSearchterm && (
                                <TopMovies 
                                    topMovies={topMovies}
                                    expandedMovie={expandedMovie}
                                    onExpand={handleMovieExpand}
                                    onClose={handleMovieClose}
                                />
                            )}
                            
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
                                    <ul ref={movieListRef} className="movie-grid" role="grid" aria-label="Movie collection">
                                        {movielist.map((movie) => (
                                            <li key={movie.id} data-movie-id={movie.id}>
                                                <Moviecard 
                                                    movie={movie}
                                                    isExpanded={expandedMovie === movie.id}
                                                    onExpand={handleMovieExpand}
                                                    onClose={handleMovieClose}
                                                />
                                            </li>
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
                    </>
                )}
            </div>
        </main>
    )
}
export default App
