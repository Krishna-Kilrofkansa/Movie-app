from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import re
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HF_MODEL = "microsoft/DialoGPT-medium"

def fetch_tmdb_info(title):
    try:
        # Search for movie
        search_url = f"https://api.themoviedb.org/3/search/movie"
        headers = {"Authorization": f"Bearer {TMDB_API_KEY}"}
        search_params = {"query": title}
        
        search_res = requests.get(search_url, headers=headers, params=search_params)
        search_data = search_res.json()
        
        if search_data.get("results"):
            movie = search_data["results"][0]
            movie_id = movie["id"]
            
            # Get detailed movie info
            detail_url = f"https://api.themoviedb.org/3/movie/{movie_id}"
            detail_params = {"append_to_response": "credits"}
            
            detail_res = requests.get(detail_url, headers=headers, params=detail_params)
            detail_data = detail_res.json()
            
            # Get director from credits
            director = ""
            if detail_data.get("credits", {}).get("crew"):
                for person in detail_data["credits"]["crew"]:
                    if person.get("job") == "Director":
                        director = person.get("name", "")
                        break
            
            return {
                "title": detail_data.get("title"),
                "year": detail_data.get("release_date", "")[:4] if detail_data.get("release_date") else "",
                "plot": detail_data.get("overview"),
                "poster": f"https://image.tmdb.org/t/p/w500{detail_data.get('poster_path')}" if detail_data.get("poster_path") else None,
                "director": director,
            }
    except Exception:
        pass
    return None

def query_gemini_model(prompt):
    if not GEMINI_API_KEY or len(GEMINI_API_KEY) < 20:
        print("Invalid Gemini API key")
        return ""
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # Optimized prompt for better JSON responses
        optimized_prompt = f"""
Based on these personality traits, recommend exactly 3 movies in valid JSON format:
{prompt}

Respond with ONLY this JSON structure (no other text):
[
  {{"title": "Movie Name", "reason": "Brief reason why it fits"}},
  {{"title": "Movie Name", "reason": "Brief reason why it fits"}},
  {{"title": "Movie Name", "reason": "Brief reason why it fits"}}
]"""
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": optimized_prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 500
            }
        }
        
        print("Trying Gemini API...")
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if "candidates" in result and len(result["candidates"]) > 0:
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                print(f"Gemini response: {text}")
                return text
        else:
            print(f"Gemini API error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Gemini API exception: {str(e)}")
    
    return ""

def query_ai_model(prompt):
    # Try Gemini first (better and more reliable)
    result = query_gemini_model(prompt)
    if result:
        return result
    
    # Fallback to Hugging Face if Gemini fails
    return query_huggingface_model(prompt)

def query_huggingface_model(prompt):
    if not HUGGINGFACE_API_KEY or len(HUGGINGFACE_API_KEY) < 20:
        print("Invalid Hugging Face API key")
        return ""
    
    headers = {
        "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
        "Content-Type": "application/json",
    }
    
    simple_prompt = f"Based on mood: {prompt.split('Mood: ')[1].split('\n')[0] if 'Mood: ' in prompt else 'happy'}, recommend 3 movies in JSON format: [{{\"title\": \"Movie Name\", \"reason\": \"Brief reason\"}}]"
    
    models = ["gpt2", "microsoft/DialoGPT-medium"]
    
    for model in models:
        payload = {
            "inputs": simple_prompt,
            "parameters": {
                "max_new_tokens": 200,
                "temperature": 0.7,
                "return_full_text": False
            },
        }
        
        try:
            response = requests.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers=headers,
                json=payload,
                timeout=10,
            )
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    text = result[0].get("generated_text", "")
                    if text:
                        return text
                        
        except Exception as e:
            continue
    
    return ""

# def get_personality_recommendations(mood, hobby, genre, vibe):
#     import random
#     
#     # Comprehensive movie database with multiple recommendations per combination
#     movie_database = {
#         "comedy": {
#             "happy": {
#                 "chill": [
#                     {"title": "Paddington", "reason": "Heartwarming family comedy perfect for a relaxed happy mood"},
#                     {"title": "The Grand Budapest Hotel", "reason": "Whimsical and visually delightful comedy"},
#                     {"title": "Brooklyn Nine-Nine", "reason": "Light-hearted workplace comedy for good vibes"}
#                 ],
#                 "uplifting": [
#                     {"title": "The Pursuit of Happyness", "reason": "Inspiring story that lifts your spirits"},
#                     {"title": "Chef", "reason": "Feel-good comedy about following your passion"},
#                     {"title": "Julie & Julia", "reason": "Uplifting story about cooking and dreams"}
#                 ],
#                 "funny": [
#                     {"title": "Superbad", "reason": "Hilarious buddy comedy for pure laughs"},
#                     {"title": "Anchorman", "reason": "Absurd comedy perfect for happy moods"},
#                     {"title": "The Hangover", "reason": "Wild comedy adventure"}
#                 ]
#             },
#             "excited": {
#                 "wild": [
#                     {"title": "Step Brothers", "reason": "Wild and crazy comedy matching your excitement"},
#                     {"title": "Tropic Thunder", "reason": "Over-the-top action comedy"},
#                     {"title": "Pineapple Express", "reason": "Wild adventure comedy"}
#                 ],
#                 "funny": [
#                     {"title": "Zoolander", "reason": "Ridiculous comedy for excited energy"},
#                     {"title": "Dodgeball", "reason": "High-energy sports comedy"},
#                     {"title": "Wedding Crashers", "reason": "Fun romantic comedy"}
#                 ]
#             },
#             "relaxed": {
#                 "chill": [
#                     {"title": "The Big Lebowski", "reason": "Ultimate chill comedy for laid-back moods"},
#                     {"title": "Lost in Translation", "reason": "Quiet, contemplative comedy-drama"},
#                     {"title": "Her", "reason": "Gentle, thoughtful romantic comedy"}
#                 ]
#             }
#         },
#         "action": {
#             "excited": {
#                 "intense": [
#                     {"title": "Mad Max: Fury Road", "reason": "Intense, non-stop action matching your excitement"},
#                     {"title": "John Wick", "reason": "Stylish, high-octane action thriller"},
#                     {"title": "The Raid", "reason": "Brutal, intense martial arts action"}
#                 ],
#                 "wild": [
#                     {"title": "Fast & Furious", "reason": "Wild action adventure with crazy stunts"},
#                     {"title": "Baby Driver", "reason": "High-energy heist film with great music"},
#                     {"title": "Kingsman", "reason": "Stylish spy action with wild sequences"}
#                 ]
#             },
#             "adventurous": {
#                 "thrilling": [
#                     {"title": "Indiana Jones", "reason": "Classic adventure perfect for thrill-seekers"},
#                     {"title": "Mission: Impossible", "reason": "Spy thriller with amazing stunts"},
#                     {"title": "The Dark Knight", "reason": "Thrilling superhero action drama"}
#                 ]
#             }
#         },
#         "drama": {
#             "contemplative": {
#                 "inspiring": [
#                     {"title": "The Shawshank Redemption", "reason": "Inspiring story of hope and friendship"},
#                     {"title": "Good Will Hunting", "reason": "Thoughtful drama about potential and growth"},
#                     {"title": "Dead Poets Society", "reason": "Inspiring story about following your passion"}
#                 ],
#                 "peaceful": [
#                     {"title": "A River Runs Through It", "reason": "Peaceful, contemplative family drama"},
#                     {"title": "The Tree of Life", "reason": "Meditative, philosophical drama"},
#                     {"title": "Her", "reason": "Quiet, introspective love story"}
#                 ]
#             },
#             "sad": {
#                 "uplifting": [
#                     {"title": "The Pursuit of Happyness", "reason": "Uplifting story that turns struggle into triumph"},
#                     {"title": "Life is Beautiful", "reason": "Beautiful story finding joy in darkness"},
#                     {"title": "It's a Wonderful Life", "reason": "Classic uplifting drama about life's meaning"}
#                 ]
#             }
#         },
#         "sci-fi": {
#             "curious": {
#                 "mysterious": [
#                     {"title": "Blade Runner 2049", "reason": "Mind-bending sci-fi exploring identity"},
#                     {"title": "Arrival", "reason": "Thoughtful alien contact story"},
#                     {"title": "Ex Machina", "reason": "Mysterious AI thriller"}
#                 ],
#                 "inspiring": [
#                     {"title": "Interstellar", "reason": "Epic space drama about love and sacrifice"},
#                     {"title": "The Martian", "reason": "Inspiring survival story on Mars"},
#                     {"title": "Contact", "reason": "Thoughtful story about first contact"}
#                 ]
#             }
#         },
#         "romance": {
#             "romantic": {
#                 "uplifting": [
#                     {"title": "The Princess Bride", "reason": "Perfect fairy tale romance adventure"},
#                     {"title": "When Harry Met Sally", "reason": "Classic romantic comedy about friendship and love"},
#                     {"title": "Crazy, Stupid, Love", "reason": "Multi-layered romantic comedy"}
#                 ]
#             }
#         }
#     }
#     
#     # Add hobby-based bonus recommendations
#     hobby_bonus = {
#         "reading": [{"title": "The Book Thief", "reason": f"Perfect for book lovers with a {mood} mood"}],
#         "gaming": [{"title": "Ready Player One", "reason": f"Gaming-themed adventure matching your {vibe} vibe"}],
#         "cooking": [{"title": "Chef", "reason": f"Culinary adventure perfect for cooking enthusiasts"}],
#         "music": [{"title": "A Star is Born", "reason": f"Musical drama that resonates with music lovers"}],
#         "art": [{"title": "Loving Vincent", "reason": f"Artistic masterpiece for art enthusiasts"}],
#         "technology": [{"title": "The Social Network", "reason": f"Tech drama perfect for your interests"}]
#     }
#     
#     recommendations = []
#     
#     # Try exact match first
#     genre_movies = movie_database.get(genre.lower(), {})
#     mood_movies = genre_movies.get(mood.lower(), {})
#     vibe_movies = mood_movies.get(vibe.lower(), [])
#     
#     if vibe_movies:
#         recommendations.extend(random.sample(vibe_movies, min(2, len(vibe_movies))))
#     
#     # Add from mood category if we need more
#     if len(recommendations) < 3:
#         for v in mood_movies.values():
#             if v and len(recommendations) < 3:
#                 recommendations.extend(random.sample(v, min(1, len(v))))
#     
#     # Add hobby bonus
#     if hobby.lower() in hobby_bonus and len(recommendations) < 3:
#         recommendations.extend(hobby_bonus[hobby.lower()])
#     
#     # Fill remaining slots from genre
#     if len(recommendations) < 3:
#         for m in genre_movies.values():
#             for v in m.values():
#                 if v and len(recommendations) < 3:
#                     recommendations.extend(random.sample(v, min(1, len(v))))
#     
#     # Ultimate fallback with personalized reasons
#     if not recommendations:
#         recommendations = [
#             {"title": "The Shawshank Redemption", "reason": f"Timeless {genre} perfect for your {mood} {vibe} mood"},
#             {"title": "Forrest Gump", "reason": f"Heartwarming story matching your {hobby} interests"},
#             {"title": "The Dark Knight", "reason": f"Acclaimed film that works for any {mood} person"}
#         ]
#     
#     return recommendations[:3]  # Return max 3 recommendations

@app.route('/recommend', methods=['POST'])
def recommend_movies():
    data = request.json
    mood = data.get('mood')
    hobby = data.get('hobby')
    genre = data.get('genre')
    vibe = data.get('vibe')
    
    if not all([mood, hobby, genre, vibe]):
        return jsonify({"error": "All fields required"}), 400
    
    prompt = f"""
Given the following personality traits:
- Mood: {mood}
- Hobby: {hobby}
- Preferred Genre: {genre}
- Vibe: {vibe}

Suggest 3 to 5 matching movies.

Your response should be ONLY a valid JSON array with each item like:
{{"title": "Movie Title", "reason": "Why it fits"}}
"""
    
    ai_text = query_ai_model(prompt)
    suggestions = []
    
    # Try to parse AI response with multiple patterns
    if ai_text:
        print(f"Raw AI response: {ai_text}")
        
        # Try different JSON extraction patterns
        patterns = [
            r"\[.*?\]",  # Standard array
            r"\[.*\]",   # Multiline array
            r"\{.*?\}",  # Single object
        ]
        
        for pattern in patterns:
            json_match = re.search(pattern, ai_text, re.DOTALL)
            if json_match:
                try:
                    matched_text = json_match.group(0)
                    print(f"Trying to parse: {matched_text}")
                    
                    # If it's a single object, wrap it in an array
                    if matched_text.startswith('{'):
                        matched_text = f"[{matched_text}]"
                    
                    suggestions = json.loads(matched_text)
                    if suggestions:
                        print(f"Successfully parsed AI suggestions: {suggestions}")
                        break
                except json.JSONDecodeError as e:
                    print(f"JSON parse error: {e}")
                    continue
    
    # Use only AI recommendations for testing
    if not suggestions:
        print(f"AI failed to generate recommendations for: {mood}, {hobby}, {genre}, {vibe}")
        return jsonify({"error": "AI failed to generate recommendations"}), 500
    else:
        print(f"Using AI recommendations: {suggestions}")
    
    recommendations = []
    for movie in suggestions:
        title = movie.get("title", "").strip()
        reason = movie.get("reason", "").strip()
        if title and reason:
            details = fetch_tmdb_info(title)
            recommendations.append({
                "title": title,
                "reason": reason,
                "details": details
            })
    
    return jsonify({"recommendations": recommendations})

@app.route('/random-recommend', methods=['GET'])
def random_recommend():
    import random
    
    # Random personality traits
    moods = ['happy', 'excited', 'relaxed', 'adventurous', 'romantic', 'contemplative', 'curious', 'energetic']
    hobbies = ['reading', 'gaming', 'cooking', 'traveling', 'sports', 'music', 'art', 'photography', 'dancing', 'writing', 'gardening', 'technology']
    genres = ['Comedy', 'Action', 'Drama', 'Sci-Fi', 'Romance', 'Thriller', 'Mystery', 'Fantasy', 'Horror', 'Animation']
    vibes = ['chill', 'intense', 'uplifting', 'dark', 'funny', 'thrilling', 'peaceful', 'wild', 'mysterious', 'inspiring']
    
    mood = random.choice(moods)
    hobby = random.choice(hobbies)
    genre = random.choice(genres)
    vibe = random.choice(vibes)
    
    prompt = f"""
Given the following personality traits:
- Mood: {mood}
- Hobby: {hobby}
- Preferred Genre: {genre}
- Vibe: {vibe}

Suggest 3 to 5 matching movies.

Your response should be ONLY a valid JSON array with each item like:
{{"title": "Movie Title", "reason": "Why it fits"}}
"""
    
    ai_text = query_ai_model(prompt)
    suggestions = []
    
    # Try to parse AI response
    if ai_text:
        patterns = [r"\[.*?\]", r"\[.*\]", r"\{.*?\}"]
        
        for pattern in patterns:
            json_match = re.search(pattern, ai_text, re.DOTALL)
            if json_match:
                try:
                    matched_text = json_match.group(0)
                    if matched_text.startswith('{'):
                        matched_text = f"[{matched_text}]"
                    
                    suggestions = json.loads(matched_text)
                    if suggestions:
                        break
                except json.JSONDecodeError:
                    continue
    
    if not suggestions:
        return jsonify({"error": "AI failed to generate recommendations"}), 500
    
    recommendations = []
    for movie in suggestions:
        title = movie.get("title", "").strip()
        reason = movie.get("reason", "").strip()
        if title and reason:
            details = fetch_tmdb_info(title)
            recommendations.append({
                "title": title,
                "reason": reason,
                "details": details
            })
    
    return jsonify({
        "recommendations": recommendations,
        "personality": {"mood": mood, "hobby": hobby, "genre": genre, "vibe": vibe}
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running"})

@app.route('/test-gemini-direct', methods=['GET'])
def test_gemini_direct():
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        headers = {"Content-Type": "application/json"}
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": "Recommend 3 action movies in JSON format: [{\"title\": \"Movie\", \"reason\": \"Why\"}]"
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 300
            }
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        return jsonify({
            "status_code": response.status_code,
            "response_text": response.text[:500],
            "success": response.status_code == 200
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        })

@app.route('/debug-env', methods=['GET'])
def debug_env():
    return jsonify({
        "gemini_key": GEMINI_API_KEY[:10] + "..." if GEMINI_API_KEY else None,
        "gemini_key_length": len(GEMINI_API_KEY) if GEMINI_API_KEY else 0,
        "hf_key": HUGGINGFACE_API_KEY[:10] + "..." if HUGGINGFACE_API_KEY else None,
        "tmdb_key": TMDB_API_KEY[:10] + "..." if TMDB_API_KEY else None
    })

@app.route('/test-ai', methods=['GET'])
def test_ai():
    test_prompt = "Mood: happy\nHobby: reading\nGenre: comedy\nVibe: uplifting"
    result = query_ai_model(test_prompt)
    return jsonify({
        "ai_response": result, 
        "has_response": bool(result),
        "gemini_key_present": bool(GEMINI_API_KEY),
        "gemini_key_valid": len(GEMINI_API_KEY) > 20 if GEMINI_API_KEY else False,
        "hf_key_present": bool(HUGGINGFACE_API_KEY),
        "hf_key_valid": len(HUGGINGFACE_API_KEY) > 20 if HUGGINGFACE_API_KEY else False
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)