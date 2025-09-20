from flask import Flask, jsonify
import os

app = Flask(__name__)

def handler(request):
    return jsonify({
        "gemini_key_present": bool(os.environ.get('GEMINI_API_KEY')),
        "gemini_key_length": len(os.environ.get('GEMINI_API_KEY', '')),
        "hf_key_present": bool(os.environ.get('HUGGINGFACE_API_KEY')),
        "tmdb_key_present": bool(os.environ.get('TMDB_API_KEY')),
        "all_env_vars": list(os.environ.keys())
    })