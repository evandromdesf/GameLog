// middleware para exigir login
module.exports = function requireAuth(req, res, next) {
  if (req.session.userId) return next();

  if (req.get('Accept')?.includes('application/json')) {
    return res.status(401).json({ ok: false, message: 'Faça login para continuar.' });
  }
  if (req.method === 'GET') req.session.returnTo = req.originalUrl; // volta pra cá depois do login
  req.session.flash = { type: 'error', message: 'Faça login para continuar.' };
  res.redirect('/login');
};
