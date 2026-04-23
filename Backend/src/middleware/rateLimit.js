const rateLimit = require('express-rate-limit')

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                   // máximo 100 requests por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas peticiones, intenta más tarde',
    code: 'RATE_LIMITED',
  },
})