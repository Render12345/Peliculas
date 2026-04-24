const { supabase } = require('../services/supabase')  // ← importa el cliente normal

module.exports = async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token de autorización requerido',
      code: 'UNAUTHORIZED',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return res.status(401).json({
        error: 'Token inválido o expirado',
        code: 'INVALID_TOKEN',
      })
    }

    req.user = data.user
    next()
  } catch (err) {
    return res.status(401).json({
      error: 'Error al verificar token',
      code: 'AUTH_ERROR',
    })
  }
}
