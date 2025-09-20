# Movie Recommendation App

A React-based movie recommendation system with AI-powered suggestions.

## Features
- Personality-based movie recommendations
- TMDB integration for movie details
- AI-powered suggestions using Gemini/Hugging Face
- Responsive design with Tailwind CSS

## Deployment

### Vercel Deployment
1. Fork this repository
2. Connect to Vercel
3. Add environment variables:
   - `GEMINI_API_KEY`
   - `HUGGINGFACE_API_KEY` 
   - `TMDB_API_KEY`
4. Deploy automatically via GitHub integration

### Local Development
```bash
npm install
npm run dev
```

## Environment Variables
Copy `.env.example` to `.env` and add your API keys.

## Tech Stack
- React + Vite
- Tailwind CSS
- Flask (Serverless Functions)
- Gemini AI / Hugging Face
- TMDB API