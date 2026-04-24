const express = require('express')
const cors = require('cors')
const rateLimit = require('./middleware/rateLimit')
const authMiddleware = require('./middleware/auth')

const moviesRouter    = require('./routes/movies')
const favoritesRouter = require('./routes/favorites')
const loadRouter      = require('./routes/load')

const app = express()

app.use(cors({ origin: '*' }))   // en producción pon la URL del frontend
app.use(express.json())
app.use(rateLimit)

// Ruta de salud — sirve para saber si el server está vivo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Rutas públicas — cualquiera puede buscar y ver películas
app.use('/api/movies', moviesRouter)

// Rutas protegidas — necesitan token JWT de Supabase
app.use('/api/favorites', authMiddleware, favoritesRouter)
app.use('/api/load',      authMiddleware, loadRouter)

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor', code: 'INTERNAL_ERROR' })
})

module.exports = app