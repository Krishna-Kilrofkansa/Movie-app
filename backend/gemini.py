from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@app.route('/personality-recommend', methods=['POST'])
def personality_recommend():
    data = request.json
    mood = data.get('mood')
    hobby = data.get('hobby')
    genre = data.get('genre')
    vibe = data.get('vibe')
    
    if not all([mood, hobby, genre, vibe]):
        return jsonify({"error": "All fields required"}), 400
    
    prompt = f"""Based on this personality profile, recommend 5 movies with detailed explanations:
    Mood: {mood}
    Hobby: {hobby}
    Genre: {genre}
    Vibe: {vibe}
    
    Return a JSON array with objects containing: title, reason, year, director, plot. Focus on why each movie matches their personality."""
    
    try:
        response = requests.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}',
            headers={'Content-Type': 'application/json'},
            json={'contents': [{'parts': [{'text': prompt}]}]}
        )
        
        if response.ok:
            data = response.json()
            if data.get('candidates') and data['candidates'][0].get('content'):
                return jsonify({'response': data['candidates'][0]['content']['parts'][0]['text']})
        
        return jsonify({'error': 'Failed to get recommendations'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/random-personality-recommend', methods=['POST'])
def random_personality_recommend():
    data = request.json
    personality = data.get('personality', {})
    
    prompt = f"""Based on this random personality profile, recommend 5 movies with detailed explanations:
    Mood: {personality.get('mood')}
    Hobby: {personality.get('hobby')}
    Genre: {personality.get('genre')}
    Vibe: {personality.get('vibe')}
    
    Return a JSON array with objects containing: title, reason, year, director, plot. Focus on why each movie matches this personality."""
    
    try:
        response = requests.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}',
            headers={'Content-Type': 'application/json'},
            json={'contents': [{'parts': [{'text': prompt}]}]}
        )
        
        if response.ok:
            data = response.json()
            if data.get('candidates') and data['candidates'][0].get('content'):
                return jsonify({'response': data['candidates'][0]['content']['parts'][0]['text']})
        
        return jsonify({'error': 'Failed to get recommendations'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)