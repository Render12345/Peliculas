const express = require('express')
const router = express.Router()
const { getMoviesFromDB, getMovieByIdFromDB } = require('../services/supabase')

// GET /api/movies?search=batman&page=1&limit=10
router.get('/', async (req, res) => {
  // Ajustamos el limit a 10 para que sea más fácil notar la paginación en tu práctica
  const { search, page = 1, limit = 10 } = req.query

  try {
    const results = await getMoviesFromDB({
      search: search || null,
      page:   Number(page),
      limit:  Number(limit),
    })

    // Enviamos la respuesta. 
    // Si results ya trae el objeto con { results, total_pages, etc }, se envía directo.
    res.json(results)
  } catch (err) {
    console.error("Error en router movies:", err)
    res.status(500).json({ error: 'Error al obtener películas', code: 'DB_ERROR' })
  }
})

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  const movieId = Number(req.params.id)

  if (isNaN(movieId)) {
    return res.status(400).json({ error: 'ID de película inválido', code: 'INVALID_ID' })
  }

  try {
    const movie = await getMovieByIdFromDB(movieId)
    res.json(movie)
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ error: 'Película no encontrada', code: 'NOT_FOUND' })
    }
    console.error(err)
    res.status(500).json({ error: 'Error al obtener película', code: 'DB_ERROR' })
  }
})

module.exports = router