const axios = require('axios')

const tmdb = axios.create({
  baseURL: process.env.TMDB_BASE_URL,
  params: {
    api_key: process.env.TMDB_API_KEY,
    language: 'es-MX',
  },
})

function buildPosterUrl(path) {
  if (!path) return null
  return `${process.env.TMDB_IMAGE_BASE}${path}`
}

function buildBackdropUrl(path) {
  if (!path) return null
  return `${process.env.TMDB_BACKDROP_BASE}${path}`
}

// Formato resumido para listas
function formatMovie(movie) {
  return {
    id:           movie.id,
    title:        movie.title,
    overview:     movie.overview,
    poster_url:   buildPosterUrl(movie.poster_path),
    backdrop_url: buildBackdropUrl(movie.backdrop_path),
    year:         movie.release_date ? movie.release_date.slice(0, 4) : null,
    vote_average: movie.vote_average,
    genres:       [],       // la lista de /popular no trae géneros, solo IDs
    runtime:      null,
    tagline:      null,
  }
}

// Formato completo para detalle
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

async function getMovieDetail(movieId) {
  const { data } = await tmdb.get(`/movie/${movieId}`)
  return formatMovieDetail(data)
}

module.exports = { searchMovies, getPopularMovies, getMovieDetail }