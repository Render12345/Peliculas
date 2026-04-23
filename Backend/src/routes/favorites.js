const express = require('express')
const router = express.Router()
const { getFavorites, addFavorite, removeFavorite } = require('../services/supabase')

// GET /api/favorites
router.get('/', async (req, res) => {
  try {
    const favorites = await getFavorites(req.user.id)
    res.json({ results: favorites })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener favoritos', code: 'DB_ERROR' })
  }
})

// POST /api/favorites
// Body: { movie_id: 123 }
router.post('/', async (req, res) => {
  const { movie_id } = req.body

  if (!movie_id) {
    return res.status(400).json({ error: 'movie_id es requerido', code: 'INVALID_BODY' })
  }

  try {
    const favorite = await addFavorite(req.user.id, movie_id)
    res.status(201).json(favorite)
  } catch (err) {
    // 23505 = unique constraint, ya es favorito
    if (err.code === '23505') {
      return res.status(409).json({ error: 'La película ya está en favoritos', code: 'ALREADY_EXISTS' })
    }
    // 23503 = foreign key, la película no existe en la tabla movies
    if (err.code === '23503') {
      return res.status(404).json({ error: 'La película no existe, cárgala primero con /api/load/movie/:id', code: 'MOVIE_NOT_LOADED' })
    }
    console.error(err)
    res.status(500).json({ error: 'Error al guardar favorito', code: 'DB_ERROR' })
  }
})

// DELETE /api/favorites/:movie_id
router.delete('/:movie_id', async (req, res) => {
  const movieId = Number(req.params.movie_id)

  if (isNaN(movieId)) {
    return res.status(400).json({ error: 'ID inválido', code: 'INVALID_ID' })
  }

  try {
    await removeFavorite(req.user.id, movieId)
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al eliminar favorito', code: 'DB_ERROR' })
  }
})

module.exports = router