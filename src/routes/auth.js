const router = require('express').Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { registerSchema, loginSchema, firstError } = require('../schemas');

// 10 tentativas a cada 15 minutos por ip
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
});

// inicia a sessao do usuario e retorna a url de destino
function startSession(req, user) {
  const returnTo = req.session.returnTo;
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.username = user.username;
      resolve(returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/');
    });
  });
}

router.get('/register', (req, res) => res.render('register', { title: 'Criar conta', values: {} }));

router.post('/register', limiter, async (req, res) => {
  const values = req.body || {};
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return res.status(400).render('register', {
      title: 'Criar conta', values, flash: { type: 'error', message: firstError(parsed) },
    });
  }
  const { username, email, password } = parsed.data;
  try {
    const user = await prisma.user.create({
      data: { username, email, passwordHash: await bcrypt.hash(password, 12) },
    });
    const destino = await startSession(req, user);
    req.session.flash = { type: 'success', message: `Bem-vindo(a), ${user.username}!` };
    res.redirect(destino);
  } catch (err) {
    if (err.code === 'P2002') { // violaCao de unicidade
      return res.status(400).render('register', {
        title: 'Criar conta', values, flash: { type: 'error', message: 'Usuário ou e-mail já cadastrado.' },
      });
    }
    throw err;
  }
});

router.get('/login', (req, res) => res.render('login', { title: 'Entrar', values: {} }));

router.post('/login', limiter, async (req, res) => {
  const values = req.body || {};
  const parsed = loginSchema.safeParse(values);
  const user = parsed.success
    ? await prisma.user.findUnique({ where: { email: parsed.data.email } })
    : null;
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!ok) {
    // mensagem generica
    return res.status(400).render('login', {
      title: 'Entrar', values, flash: { type: 'error', message: 'E-mail ou senha incorretos.' },
    });
  }
  const destino = await startSession(req, user);
  req.session.flash = { type: 'success', message: 'Login feito com sucesso.' };
  res.redirect(destino);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
