const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// ── Películas ─────────────────────────────────────────────────

// Guarda o actualiza un array de películas en Supabase
async function saveMovies(movies) {
  const { error } = await supabase
    .from('movies')
    .upsert(movies, { onConflict: 'id' })  // si ya existe la actualiza

  if (error) throw error
}

// Lee películas desde Supabase con búsqueda y paginación
async function getMoviesFromDB({ search = null, page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit

  let query = supabase
    .from('movies')
    .select('*', { count: 'exact' })
    .order('vote_average', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    results:      data,
    total:        count,
    current_page: page,
    total_pages:  Math.ceil(count / limit),
  }
}

// Lee una película por ID desde Supabase
async function getMovieByIdFromDB(movieId) {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', movieId)
    .single()

  if (error) throw error
  return data
}

// ── Favoritos ─────────────────────────────────────────────────

async function getFavorites(userId) {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      id,
      created_at,
      movies (
        id, title, poster_url, year, vote_average
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function addFavorite(userId, movieId) {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, movie_id: movieId })
    .select()
    .single()

  if (error) throw error
  return data
}

async function removeFavorite(userId, movieId) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('movie_id', movieId)

  if (error) throw error
}

module.exports = {
  saveMovies,
  getMoviesFromDB,
  getMovieByIdFromDB,
  getFavorites,
  addFavorite,
  removeFavorite,
}