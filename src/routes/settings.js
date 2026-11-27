const router = require('express').Router();
const prisma = require('../lib/prisma');
const requireAuth = require('../middleware/requireAuth');
const { settingsSchema, firstError } = require('../schemas');

router.get('/settings', requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.session.userId } });
  res.render('settings', { title: 'Configurações', values: me });
});

router.post('/settings', requireAuth, async (req, res) => {
  const values = req.body || {};
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    return res.status(400).render('settings', { title: 'Configurações', values, flash: { type: 'error', message: firstError(parsed) } });
  }
  try {
    await prisma.user.update({ where: { id: req.session.userId }, data: parsed.data });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).render('settings', { title: 'Configurações', values, flash: { type: 'error', message: 'Este e-mail já está em uso.' } });
    }
    throw err;
  }
  req.session.flash = { type: 'success', message: 'Perfil atualizado.' };
  res.redirect('/settings');
});

module.exports = router;
