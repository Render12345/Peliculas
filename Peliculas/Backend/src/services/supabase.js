const { createClient } = require('@supabase/supabase-js')

// Cliente admin — para escrituras
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// --- Películas ---

async function saveMovies(movies) {
  const { error } = await supabaseAdmin
    .from('movies')
    .upsert(movies, { onConflict: 'id' })

  if (error) throw error
}

async function getMoviesFromDB({ search = null, page = 1, limit = 10 } = {}) {
  // Cálculo de rango para la paginación
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabaseAdmin
    .from('movies')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  // Primero obtenemos el count sin range para verificar
  const { count, error: countError } = await query.select('*', { count: 'exact', head: true })
  if (countError) throw countError

  // Si el offset excede el número de filas, devolvemos vacío
  if (from >= count) {
    return {
      results: [],
      total_results: count,
      total_pages: Math.ceil(count / limit),
      current_page: page,
    }
  }

  // Ordenamos por ID para que al paginar no se repitan resultados
  const { data, error } = await query
    .order('id', { ascending: true })
    .range(from, to)

  if (error) throw error

  return {
    results: data,
    total_results: count,
    total_pages: Math.ceil(count / limit),
    current_page: page,
  }
}

async function getMovieByIdFromDB(movieId) {
  const { data, error } = await supabaseAdmin
    .from('movies')
    .select('*')
    .eq('id', movieId)
    .single()

  if (error) throw error
  return data
}

// --- Favoritos (Se mantiene igual) ---

async function getFavorites(userId) {
  const { data, error } = await supabaseAdmin
    .from('favorites')
    .select('id, created_at, movies(id, title, poster_url, year, vote_average)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function addFavorite(userId, movieId) {
  const { data, error } = await supabaseAdmin
    .from('favorites')
    .insert({ user_id: userId, movie_id: movieId })
    .select().single()

  if (error) throw error
  return data
}

async function removeFavorite(userId, movieId) {
  const { error } = await supabaseAdmin
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('movie_id', movieId)

  if (error) throw error
}

module.exports = {
  supabase,
  saveMovies,
  getMoviesFromDB,
  getMovieByIdFromDB,
  getFavorites,
  addFavorite,
  removeFavorite,
}