import React, { useState } from 'react'
import { FilmIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const PersonalityRecommender = () => {
    const [formData, setFormData] = useState({
        mood: '',
        hobby: '',
        genre: 'Comedy',
        vibe: ''
    })

    const moodOptions = [
        'Happy', 'Sad', 'Excited', 'Relaxed', 'Adventurous', 'Romantic', 'Contemplative', 'Energetic', 'Nostalgic', 'Curious'
    ]

    const hobbyOptions = [
        'Reading', 'Gaming', 'Cooking', 'Traveling', 'Sports', 'Music', 'Art', 'Photography', 'Dancing', 'Writing', 'Gardening', 'Technology'
    ]

    const vibeOptions = [
        'Chill', 'Intense', 'Uplifting', 'Dark', 'Funny', 'Thrilling', 'Peaceful', 'Wild', 'Mysterious', 'Inspiring'
    ]
    const [recommendations, setRecommendations] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [randomPersonality, setRandomPersonality] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.mood || !formData.hobby || !formData.vibe) {
            setError('Please fill in all fields')
            return
        }

        setLoading(true)
        setError('')
        setRandomPersonality(null)
        
        try {
            const response = await fetch('http://localhost:5000/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            
            const data = await response.json()
            if (response.ok) {
                setRecommendations(data.recommendations)
            } else {
                setError(data.error || 'Failed to get recommendations')
            }
        } catch (err) {
            setError('Failed to connect to recommendation service')
        } finally {
            setLoading(false)
        }
    }

    const handleRandomRecommendation = async () => {
        setLoading(true)
        setError('')
        
        try {
            const response = await fetch('http://localhost:5000/random-recommend')
            const data = await response.json()
            
            if (response.ok) {
                setRecommendations(data.recommendations)
                setRandomPersonality(data.personality)
            } else {
                setError(data.error || 'Failed to get random recommendations')
            }
        } catch (err) {
            setError('Failed to connect to recommendation service')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="personality-recommender">
            <div className="personality-header">
                <h2 className="personality-title">🎭 AI Personality Matcher</h2>
                <p className="personality-subtitle">Tell us about yourself and get personalized movie recommendations</p>
            </div>
            
            <form onSubmit={handleSubmit} className="personality-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">💭 Current Mood</label>
                        <select
                            className="form-select"
                            value={formData.mood}
                            onChange={(e) => setFormData({...formData, mood: e.target.value})}
                        >
                            <option value="">Select your mood...</option>
                            {moodOptions.map(mood => (
                                <option key={mood} value={mood.toLowerCase()}>{mood}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">🎯 Favorite Hobby</label>
                        <select
                            className="form-select"
                            value={formData.hobby}
                            onChange={(e) => setFormData({...formData, hobby: e.target.value})}
                        >
                            <option value="">Select your hobby...</option>
                            {hobbyOptions.map(hobby => (
                                <option key={hobby} value={hobby.toLowerCase()}>{hobby}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">🎬 Preferred Genre</label>
                        <select
                            className="form-select"
                            value={formData.genre}
                            onChange={(e) => setFormData({...formData, genre: e.target.value})}
                        >
                            <option value="Comedy">Comedy</option>
                            <option value="Action">Action</option>
                            <option value="Drama">Drama</option>
                            <option value="Sci-Fi">Sci-Fi</option>
                            <option value="Romance">Romance</option>
                            <option value="Thriller">Thriller</option>
                            <option value="Mystery">Mystery</option>
                            <option value="Fantasy">Fantasy</option>
                            <option value="Horror">Horror</option>
                            <option value="Animation">Animation</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">✨ Your Vibe</label>
                        <select
                            className="form-select"
                            value={formData.vibe}
                            onChange={(e) => setFormData({...formData, vibe: e.target.value})}
                        >
                            <option value="">Select your vibe...</option>
                            {vibeOptions.map(vibe => (
                                <option key={vibe} value={vibe.toLowerCase()}>{vibe}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="button-group">
                    <button type="submit" className="recommend-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                Getting Your Perfect Matches...
                            </>
                        ) : (
                            <>
                                <FilmIcon className="w-5 h-5" />
                                Get My Recommendations
                            </>
                        )}
                    </button>
                    
                    <button 
                        type="button" 
                        className="random-btn" 
                        onClick={handleRandomRecommendation}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="spinner"></div>
                        ) : (
                            <>
                                <ArrowPathIcon className="w-5 h-5" />
                                Random Pick
                            </>
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}
            
            {recommendations.length > 0 && (
                <div className="recommendations-section">
                    {randomPersonality && (
                        <div className="random-personality">
                            <h4 className="random-personality-title">🎲 Random Personality Generated:</h4>
                            <div className="personality-tags">
                                <span className="personality-tag mood">{randomPersonality.mood}</span>
                                <span className="personality-tag hobby">{randomPersonality.hobby}</span>
                                <span className="personality-tag genre">{randomPersonality.genre}</span>
                                <span className="personality-tag vibe">{randomPersonality.vibe}</span>
                            </div>
                        </div>
                    )}
                    <h3 className="recommendations-title">🎯 Your Perfect Matches</h3>
                    <div className="recommendations-grid">
                        {recommendations.map((rec, index) => (
                            <div key={index} className="recommendation-card">
                                {rec.details?.poster && (
                                    <div className="card-poster">
                                        <img src={rec.details.poster} alt={rec.title} />
                                    </div>
                                )}
                                <div className="card-content">
                                    <h4 className="card-title">{rec.title}</h4>
                                    {rec.details && (
                                        <div className="card-meta">
                                            <span className="year">{rec.details.year}</span>
                                            {rec.details.director && (
                                                <span className="director">Dir: {rec.details.director}</span>
                                            )}
                                        </div>
                                    )}
                                    <p className="card-reason">
                                        <span className="reason-label">Why it's perfect for you:</span>
                                        {rec.reason}
                                    </p>
                                    {rec.details?.plot && (
                                        <p className="card-plot">{rec.details.plot}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default PersonalityRecommender