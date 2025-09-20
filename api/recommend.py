from flask import Flask, request, jsonify
import requests
import json
import re
import os

app = Flask(__name__)

def query_gemini_model(prompt):
    api_key = os.environ.get('GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY')
    print(f"Gemini API Key present: {bool(api_key)}, Length: {len(api_key) if api_key else 0}")
    
    if not api_key or len(api_key) < 20:
        print("Gemini API key not found or invalid")
        return ""
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        
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
            "contents": [{"parts": [{"text": optimized_prompt}]}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 500}
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            result = response.json()
            if "candidates" in result and len(result["candidates"]) > 0:
                return result["candidates"][0]["content"]["parts"][0]["text"]
    except:
        pass
    return ""

def query_huggingface_model(prompt):
    api_key = os.environ.get('HUGGINGFACE_API_KEY') or os.getenv('HUGGINGFACE_API_KEY')
    print(f"HF API Key present: {bool(api_key)}, Length: {len(api_key) if api_key else 0}")
    
    if not api_key or len(api_key) < 20:
        print("HuggingFace API key not found or invalid")
        return ""
    
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "inputs": f"Based on mood: {prompt.split('Mood: ')[1].split(',')[0] if 'Mood: ' in prompt else 'happy'}, recommend 3 movies in JSON format: [{{\"title\": \"Movie Name\", \"reason\": \"Brief reason\"}}]",
        "parameters": {"max_new_tokens": 200, "temperature": 0.7, "return_full_text": False}
    }
    
    try:
        response = requests.post(
            "https://api-inference.huggingface.co/models/gpt2",
            headers=headers, json=payload, timeout=10
        )
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                return result[0].get("generated_text", "")
    except:
        pass
    return ""

def query_ai_model(prompt):
    # Try Gemini first, fallback to Hugging Face
    result = query_gemini_model(prompt)
    return result if result else query_huggingface_model(prompt)

def fetch_tmdb_info(title):
    api_key = os.environ.get('TMDB_API_KEY') or os.getenv('TMDB_API_KEY')
    print(f"TMDB API Key present: {bool(api_key)}, Length: {len(api_key) if api_key else 0}")
    
    if not api_key:
        print("TMDB API key not found")
        return None
    
    try:
        # Search for movie
        search_url = "https://api.themoviedb.org/3/search/movie"
        headers = {"Authorization": f"Bearer {api_key}"}
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
                "director": director
            }
    except:
        pass
    return None

def handler(request):
    print(f"Environment variables: GEMINI={bool(os.environ.get('GEMINI_API_KEY'))}, HF={bool(os.environ.get('HUGGINGFACE_API_KEY'))}, TMDB={bool(os.environ.get('TMDB_API_KEY'))}")
    
    if request.method != 'POST':
        return jsonify({"error": "Method not allowed"}), 405
        
    data = request.get_json()
    mood, hobby, genre, vibe = data.get('mood'), data.get('hobby'), data.get('genre'), data.get('vibe')
    
    if not all([mood, hobby, genre, vibe]):
        return jsonify({"error": "All fields required"}), 400
    
    prompt = f"""Given the following personality traits:
- Mood: {mood}
- Hobby: {hobby}
- Preferred Genre: {genre}
- Vibe: {vibe}

Suggest 3 matching movies."""
    
    ai_text = query_ai_model(prompt)
    suggestions = []
    
    if ai_text:
        # Try different JSON extraction patterns
        patterns = [r"\[.*?\]", r"\[.*\]", r"\{.*?\}"]
        
        for pattern in patterns:
            json_match = re.search(pattern, ai_text, re.DOTALL)
            if json_match:
                try:
                    matched_text = json_match.group(0)
                    # If single object, wrap in array
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
        title, reason = movie.get("title", "").strip(), movie.get("reason", "").strip()
        if title and reason:
            recommendations.append({"title": title, "reason": reason, "details": fetch_tmdb_info(title)})
    
    return jsonify({"recommendations": recommendations})