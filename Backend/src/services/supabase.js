const { createClient } = require('@supabase/supabase-js')

// Cliente admin — bypasea RLS, solo usar en backend para escrituras
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Cliente normal — para verificar tokens de usuarios
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// ── Películas ─────────────────────────────────────────────────

async function saveMovies(movies) {
  const { error } = await supabaseAdmin   // ← usa admin
    .from('movies')
    .upsert(movies, { onConflict: 'id' })

  if (error) throw error
}

async function getMoviesFromDB({ search = null, page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit

  let query = supabaseAdmin
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

async function getMovieByIdFromDB(movieId) {
  const { data, error } = await supabaseAdmin
    .from('movies')
    .select('*')
    .eq('id', movieId)
    .single()

  if (error) throw error
  return data
}

// ── Favoritos ─────────────────────────────────────────────────

async function getFavorites(userId) {
  const { data, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
    .from('favorites')
    .insert({ user_id: userId, movie_id: movieId })
    .select()
    .single()

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
  supabase,        // exporta el cliente normal para el middleware de auth
  saveMovies,
  getMoviesFromDB,
  getMovieByIdFromDB,
  getFavorites,
  addFavorite,
  removeFavorite,
}
