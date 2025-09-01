import React, {useEffect, useState} from 'react'
import Search from "./components/Search.jsx";
import heroo from "./assets/hero.png"
import Spinner from "./components/Spinner.jsx";
import Moviecard from "./components/Moviecard.jsx";
import {useDebounce} from "react-use";

const API_BASE_URL = "https://api.themoviedb.org/3"

const API_KEY= import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: "GET",
    headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_KEY}`
    }
}

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [errormessage, setErrormessage] = useState('');
    const [movielist, setMovielist] = useState([]);
    const [isloading, setIsloading] = useState(false);
    const [debounceSearchterm, setDebounceSearchterm] = useState('')

    useDebounce(() => setDebounceSearchterm(searchTerm), 1000,[searchTerm]);

    const fetchMovies = async(query='') => {
        setIsloading(true);
        setErrormessage('');
        try{
            const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURI(query)}`:`${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint,API_OPTIONS);

            if(!response.ok) {
                throw new Error('Error fetching movies');
            }
            const data = await response.json();
            if(data.Response =='False'){
                setErrormessage(data.Error||'failed to fetch movies');
                setMovielist([]);
                return;
            }
            setMovielist(data.results || []);
            console.log(data);
        }catch(e){
            console.error(`Error in fetchMovies:${e}`);
            setErrormessage('Error in fetchMovies');
        }finally {
            setIsloading(false);
        }
    }

    useEffect(() => {
                fetchMovies(debounceSearchterm);
    }, [debounceSearchterm])
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
                    <h2 className="mt-[40px]">All Movies</h2>
                    {isloading ? (
                        <Spinner/>
                    ):errormessage ? (
                        <p className="text-red-500">{errormessage}</p>
                    ):(
                        <ul>
                            {movielist.map((movie) => (
                                <Moviecard key={movie.id} movie={movie}/>
                            ))}
                        </ul>
                    )

                    }
                    {errormessage && <p className="text-red-500">{errormessage}</p>}
                </section>


            </div>

        </main>
    )
}
export default App
