const express = require('express')
const router = express.Router()
const tmdb = require('../services/tmdb')
const { saveMovies, getMovieByIdFromDB } = require('../services/supabase')

// POST /api/load/bulk?paginas=20
router.post('/bulk', async (req, res) => {
    const totalPaginas = Number(req.query.paginas) || 20;
    let totalCargadas = 0;

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        const data = await tmdb.getPopularMovies(pagina);
        await saveMovies(data.results);
        totalCargadas += data.results.length;
        console.log(`Página ${pagina}/${totalPaginas} cargada`);
    }

    res.json({
        message: `${totalCargadas} películas cargadas correctamente`,
        total: totalCargadas,
    });
});

// POST /api/load/popular?page=1
// Descarga películas populares de TMDb y las guarda en Supabase
router.post('/popular', async (req, res) => {
  const { page = 1 } = req.query

  try {
    const data = await tmdb.getPopularMovies(Number(page))
    await saveMovies(data.results)

    res.json({
      message:      `${data.results.length} películas cargadas correctamente`,
      total_pages:  data.total_pages,
      current_page: data.current_page,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cargar películas populares', code: 'LOAD_ERROR' })
  }
})

// POST /api/load/search?query=batman&page=1
// Descarga resultados de búsqueda de TMDb y los guarda en Supabase
router.post('/search', async (req, res) => {
  const { query, page = 1 } = req.query

  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'El parámetro query es requerido', code: 'MISSING_QUERY' })
  }

  try {
    const data = await tmdb.searchMovies(query, Number(page))
    await saveMovies(data.results)

    res.json({
      message:      `${data.results.length} películas cargadas correctamente`,
      total_pages:  data.total_pages,
      current_page: data.current_page,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al cargar búsqueda', code: 'LOAD_ERROR' })
  }
})

// POST /api/load/movie/:id
// Descarga el detalle completo de una película específica (con géneros, runtime, etc.)
router.post('/movie/:id', async (req, res) => {
  const movieId = Number(req.params.id)

  if (isNaN(movieId)) {
    return res.status(400).json({ error: 'ID inválido', code: 'INVALID_ID' })
  }

  try {
    const movie = await tmdb.getMovieDetail(movieId)
    await saveMovies([movie])

    res.json({ message: 'Película cargada correctamente', movie })
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Película no encontrada en TMDb', code: 'NOT_FOUND' })
    }
    console.error(err)
    res.status(500).json({ error: 'Error al cargar película', code: 'LOAD_ERROR' })
  }
})

module.exports = router
