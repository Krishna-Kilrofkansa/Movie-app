import React, { useRef, useEffect, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import starr from "../assets/star.svg"

const Moviecard = ({ movie, isExpanded, onExpand, onClose }) => {
    const { id, title, vote_average, poster_path, release_date, original_language, overview } = movie
    const cardRef = useRef(null)
    const detailsRef = useRef(null)
    const [trailers, setTrailers] = useState([])
    const [trailersLoaded, setTrailersLoaded] = useState(false)
    const [playingTrailer, setPlayingTrailer] = useState(null)
    const [cast, setCast] = useState([])
    const [watchProviders, setWatchProviders] = useState(null)
    const [dataLoaded, setDataLoaded] = useState(false)
    
    useEffect(() => {
        if (isExpanded) {
            // Scroll to show the expanded card
            setTimeout(() => {
                cardRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                })
            }, 100)
            
            // Lock scroll after scrolling to position
            setTimeout(() => {
                document.body.style.overflow = 'hidden'
            }, 600)
            
            gsap.to(cardRef.current, {
                zIndex: 10,
                duration: 0.4,
                ease: "power2.out"
            })
            if (detailsRef.current) {
                gsap.to(detailsRef.current, {
                    width: "auto",
                    opacity: 1,
                    duration: 0.4,
                    ease: "power2.out"
                })
            }
            fetchMovieData()
        } else {
            // Unlock scroll
            document.body.style.overflow = 'auto'
            
            gsap.to(cardRef.current, {
                zIndex: 1,
                duration: 0.3,
                ease: "power2.out"
            })
            if (detailsRef.current) {
                gsap.to(detailsRef.current, {
                    width: 0,
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.out"
                })
            }
        }
        
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [isExpanded])
    
    const fetchMovieData = useCallback(async () => {
        if (dataLoaded) return
        
        try {
            const V4_TOKEN = import.meta.env.VITE_TMDB_V4_TOKEN || import.meta.env.VITE_TMDB_API_KEY
            const V3_API_KEY = import.meta.env.VITE_TMDB_API_KEY_V3
            
            if (!V4_TOKEN && !V3_API_KEY) {
                console.warn('No API key found')
                return
            }
            
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    ...(V4_TOKEN && { Authorization: `Bearer ${V4_TOKEN}` })
                }
            }
            
            // Fetch trailers, cast, and watch providers
            const [videosRes, creditsRes, watchRes] = await Promise.all([
                fetch(`https://api.themoviedb.org/3/movie/${id}/videos${!V4_TOKEN && V3_API_KEY ? `?api_key=${V3_API_KEY}` : ''}`, options),
                fetch(`https://api.themoviedb.org/3/movie/${id}/credits${!V4_TOKEN && V3_API_KEY ? `?api_key=${V3_API_KEY}` : ''}`, options),
                fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers${!V4_TOKEN && V3_API_KEY ? `?api_key=${V3_API_KEY}` : ''}`, options)
            ])
            
            if (videosRes.ok) {
                const videosData = await videosRes.json()
                const youtubeTrailers = videosData.results?.filter(video => 
                    video.type === 'Trailer' && video.site === 'YouTube'
                ).slice(0, 2) || []
                setTrailers(youtubeTrailers)
            }
            
            if (creditsRes.ok) {
                const creditsData = await creditsRes.json()
                setCast(creditsData.cast?.slice(0, 6) || [])
            }
            
            if (watchRes.ok) {
                const watchData = await watchRes.json()
                setWatchProviders(watchData.results?.US || null)
            }
            
            setDataLoaded(true)
        } catch (error) {
            console.error('Error fetching movie data:', error)
            setDataLoaded(true)
        }
    }, [id, dataLoaded])
    
    return (
        <div 
            ref={cardRef}
            className={`movie-card ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
                e.stopPropagation()
                if (!isExpanded) onExpand(id)
            }}
            data-movie-id={id}
        >
            <div className="card-main-content">
                <img src={poster_path ? `https://image.tmdb.org/t/p/w500/${poster_path}` : '/no-movie.png'} alt={title}/>
                
                <div className="mt-4">
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
                        
                        {cast.length > 0 && (
                            <div className="cast">
                                <h4>Cast</h4>
                                <div className="cast-grid">
                                    {cast.map((actor) => (
                                        <div key={actor.id} className="cast-member">
                                            <img 
                                                src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : '/no-movie.png'} 
                                                alt={actor.name}
                                            />
                                            <div className="cast-info">
                                                <p className="actor-name">{actor.name}</p>
                                                <p className="character">{actor.character}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) && (
                            <div className="watch-providers">
                                <h4>Where to Watch</h4>
                                {watchProviders.flatrate && (
                                    <div className="provider-section">
                                        <h5>Stream</h5>
                                        <div className="providers">
                                            {watchProviders.flatrate.slice(0, 4).map((provider) => (
                                                <div key={provider.provider_id} className="provider">
                                                    <img 
                                                        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} 
                                                        alt={provider.provider_name}
                                                        title={provider.provider_name}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {watchProviders.rent && (
                                    <div className="provider-section">
                                        <h5>Rent</h5>
                                        <div className="providers">
                                            {watchProviders.rent.slice(0, 4).map((provider) => (
                                                <div key={provider.provider_id} className="provider">
                                                    <img 
                                                        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} 
                                                        alt={provider.provider_name}
                                                        title={provider.provider_name}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
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

export default Moviecard
