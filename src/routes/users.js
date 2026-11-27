const router = require('express').Router();
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');
const { settingsSchema, firstError } = require('../schemas');

// exibir perfil de usuario
router.get('/users/:username', async (req, res) => {
  const profile = await prisma.user.findUnique({
    where: { username: req.params.username.toLowerCase() },
    include: { reviews: { orderBy: { createdAt: 'desc' }, take: 50, include: { game: true, user: true } } },
  });
  if (!profile) {
    return res.status(404).render('error', { title: 'Não encontrado', status: 404, message: 'Usuário não encontrado.' });
  }
  const isOwner = req.session.userId === profile.id;
  res.render('profile', { title: `@${profile.username}`, profile, isOwner, editing: isOwner && req.query.edit === '1' });
});

// atualizar bio ou email
router.post('/profile', requireAuth, async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body || {});
  const back = `/users/${req.session.username}`;
  if (!parsed.success) {
    req.session.flash = { type: 'error', message: firstError(parsed) };
    return res.redirect(back + '?edit=1');
  }
  try {
    await prisma.user.update({ where: { id: req.session.userId }, data: parsed.data });
  } catch (err) {
    if (err.code !== 'P2002') throw err;
    req.session.flash = { type: 'error', message: 'Este e-mail já está em uso.' };
    return res.redirect(back + '?edit=1');
  }
  req.session.flash = { type: 'success', message: 'Perfil atualizado.' };
  res.redirect(back);
});

module.exports = router;
