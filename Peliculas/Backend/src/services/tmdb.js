const axios = require('axios')

// Configuración de Axios para TMDB
const tmdb = axios.create({
  baseURL: process.env.TMDB_BASE_URL,
  params: {
    api_key: process.env.TMDB_API_KEY,
    language: 'es-MX',
  },
})

// --- Funciones de Utilidad para URLs e Imágenes ---

function buildPosterUrl(path) {
  if (!path) return null
  return `${process.env.TMDB_IMAGE_BASE}${path}`
}

function buildBackdropUrl(path) {
  if (!path) return null
  return `${process.env.TMDB_BACKDROP_BASE}${path}`
}

// --- Formateadores de Datos ---

function formatMovie(movie) {
  return {
    id:           movie.id,
    title:        movie.title,
    overview:     movie.overview,
    poster_url:   buildPosterUrl(movie.poster_path),
    backdrop_url: buildBackdropUrl(movie.backdrop_path),
    year:         movie.release_date ? movie.release_date.slice(0, 4) : null,
    vote_average: movie.vote_average,
    genres:       [], 
    runtime:      null,
    tagline:      null,
  }
}

function formatMovieDetail(movie) {
  return {
    id:           movie.id,
    title:        movie.title,
    overview:     movie.overview,
    poster_url:   buildPosterUrl(movie.poster_path),
    backdrop_url: buildBackdropUrl(movie.backdrop_path),
    year:         movie.release_date ? movie.release_date.slice(0, 4) : null,
    vote_average: movie.vote_average,
    genres:       movie.genres ? movie.genres.map((g) => g.name) : [],
    runtime:      movie.runtime,
    tagline:      movie.tagline,
  }
}

// --- Funciones de API ---

/**
 * NUEVA FUNCIÓN: Recorre múltiples páginas de TMDB 
 * Sirve para llenar tu base de datos con volumen (ej: 100 películas)
 */
async function getManyPopularMovies(pagesToFetch = 5) {
  let allMovies = [];
  
  for (let i = 1; i <= pagesToFetch; i++) {
    console.log(`📡 TMDB: Solicitando página ${i}...`);
    try {
      const { data } = await tmdb.get('/movie/popular', {
        params: { page: i },
      });
      const formatted = data.results.map(formatMovie);
      allMovies = [...allMovies, ...formatted];
    } catch (error) {
      console.error(`❌ Error cargando página ${i}:`, error.message);
      break; // Si falla una página, devolvemos lo que tengamos hasta ahora
    }
  }
  
  return allMovies; 
}

/**
 * Busca películas por texto
 */
async function searchMovies(query, page = 1) {
  const { data } = await tmdb.get('/search/movie', {
    params: { query, page },
  })
  return {
    results:      data.results.map(formatMovie),
    total_pages:  data.total_pages,
    current_page: data.page,
  }
}

/**
 * Obtiene una sola página de películas populares
 */
async function getPopularMovies(page = 1) {
  const { data } = await tmdb.get('/movie/popular', {
    params: { page },
  })
  return {
    results:      data.results.map(formatMovie),
    total_pages:  data.total_pages,
    current_page: data.page,
  }
}

/**
 * Obtiene el detalle extendido de una película por ID
 */
async function getMovieDetail(movieId) {
  const { data } = await tmdb.get(`/movie/${movieId}`)
  return formatMovieDetail(data)
}

// --- Exportaciones ---

module.exports = { 
  searchMovies, 
  getPopularMovies, 
  getMovieDetail,
  getManyPopularMovies // Exportamos la nueva función para usarla en load.js
}