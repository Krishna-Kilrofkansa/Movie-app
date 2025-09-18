import React, { useRef, useEffect, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import starr from "../assets/star.svg"

const TopMovieCard = ({ movie, rank, isExpanded, onExpand, onClose }) => {
    const { id, title, vote_average, poster_path, release_date, original_language, overview } = movie
    const cardRef = useRef(null)
    const detailsRef = useRef(null)
    const [trailers, setTrailers] = useState([])
    const [trailersLoaded, setTrailersLoaded] = useState(false)
    const [playingTrailer, setPlayingTrailer] = useState(null)
    const scrollTimeoutRef = useRef(null)
    const bodyOverflowTimeoutRef = useRef(null)
    
    useEffect(() => {
        if (isExpanded) {
            scrollTimeoutRef.current = setTimeout(() => {
                cardRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                })
            }, 100)
            
            bodyOverflowTimeoutRef.current = setTimeout(() => {
                document.body.style.overflow = 'hidden'
            }, 400)
            
            if (cardRef.current) {
                gsap.to(cardRef.current, {
                    zIndex: 10,
                    duration: 0.4,
                    ease: "power2.out"
                })
            }
            if (detailsRef.current) {
                gsap.to(detailsRef.current, {
                    width: "auto",
                    opacity: 1,
                    duration: 0.4,
                    ease: "power2.out"
                })
            }
            fetchTrailers()
        } else {
            document.body.style.overflow = 'auto'
            
            if (cardRef.current) {
                gsap.to(cardRef.current, {
                    zIndex: 1,
                    duration: 0.4,
                    ease: "power2.out"
                })
            }
            if (detailsRef.current) {
                gsap.to(detailsRef.current, {
                    width: 0,
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.out"
                })
            }
        }
        
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
            if (bodyOverflowTimeoutRef.current) {
                clearTimeout(bodyOverflowTimeoutRef.current)
            }
            if (isExpanded) {
                document.body.style.overflow = 'auto'
            }
        }
    }, [isExpanded])
    
    const fetchTrailers = useCallback(async () => {
        if (trailersLoaded) return
        
        try {
            const V4_TOKEN = import.meta.env.VITE_TMDB_V4_TOKEN || import.meta.env.VITE_TMDB_API_KEY
            const V3_API_KEY = import.meta.env.VITE_TMDB_API_KEY_V3
            
            if (!V4_TOKEN && !V3_API_KEY) {
                console.warn('No API key found for trailer fetching')
                return
            }
            
            const url = `https://api.themoviedb.org/3/movie/${id}/videos${!V4_TOKEN && V3_API_KEY ? `?api_key=${V3_API_KEY}` : ''}`
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    ...(V4_TOKEN && { Authorization: `Bearer ${V4_TOKEN}` })
                }
            }
            
            const response = await fetch(url, options)
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            const youtubeTrailers = data.results?.filter(video => 
                video.type === 'Trailer' && video.site === 'YouTube'
            ).slice(0, 2) || []
            
            setTrailers(youtubeTrailers)
            setTrailersLoaded(true)
        } catch (error) {
            console.error('Error fetching trailers:', error)
            setTrailers([])
            setTrailersLoaded(true)
        }
    }, [id, trailersLoaded])
    
    return (
        <div 
            ref={cardRef}
            className={`top-movie-card ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
                e.stopPropagation()
                if (!isExpanded) onExpand(id)
            }}
            data-movie-id={id}
        >
            <div className="rank-number">{rank}</div>
            <div className="card-main-content">
                <img src={poster_path ? `https://image.tmdb.org/t/p/w500/${poster_path}` : '/no-movie.png'} alt={title}/>
                
                <div className="movie-info">
                    <h3>{title}</h3>
                    <div className="content">
                        <div className="rating">
                            <img src={starr} alt="star-icon"/>
                            <p>{vote_average ? vote_average.toFixed(1) : 'N/A'}</p>
                        </div>
                        <span>•</span>
                        <p className="lang">{original_language}</p>
                        <span>•</span>
                        <p className="year">{release_date ? release_date.split('-')[0] : 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            {isExpanded && (
                <div ref={detailsRef} className="movie-details-horizontal">
                    <div className="details-content">
                        <div className="movie-header">
                            <h3>{title}</h3>
                            <div className="movie-meta">
                                <div className="rating">
                                    <img src={starr} alt="star-icon"/>
                                    <p>{vote_average ? vote_average.toFixed(1) : 'N/A'}</p>
                                </div>
                                <span>•</span>
                                <p className="lang">{original_language}</p>
                                <span>•</span>
                                <p className="year">{release_date ? release_date.split('-')[0] : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="overview">
                            <h4>Overview</h4>
                            <p>{overview || 'No overview available.'}</p>
                        </div>
                        
                        <div className="trailers">
                            <h4>Trailers</h4>
                            {trailers.length > 0 ? (
                                <div className="trailer-section">
                                    <div className="trailer-buttons">
                                        {trailers.map((trailer, index) => (
                                            <button
                                                key={trailer.id}
                                                className={`trailer-btn ${playingTrailer === trailer.id ? 'active' : ''}`}
                                                onClick={() => setPlayingTrailer(playingTrailer === trailer.id ? null : trailer.id)}
                                            >
                                                {trailer.name || `Trailer ${index + 1}`}
                                            </button>
                                        ))}
                                    </div>
                                    {playingTrailer && (
                                        <div className="trailer-player">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${trailers.find(t => t.id === playingTrailer)?.key}?rel=0&modestbranding=1&autoplay=1`}
                                                title={trailers.find(t => t.id === playingTrailer)?.name}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No trailers available</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const TopMovies = ({ topMovies, expandedMovie, onExpand, onClose }) => {
    if (!topMovies || topMovies.length === 0) return null

    return (
        <section className="top-movies">
            <div className="top-movies-header">
                <h2>Top Movies This Week</h2>
                <p className="update-info">Updated weekly</p>
            </div>
            <div className="top-movies-grid">
                {topMovies.slice(0, 4).map((movie, index) => (
                    <TopMovieCard
                        key={movie.id}
                        movie={movie}
                        rank={index + 1}
                        isExpanded={expandedMovie === movie.id}
                        onExpand={onExpand}
                        onClose={onClose}
                    />
                ))}
            </div>
        </section>
    )
}

export default TopMovies