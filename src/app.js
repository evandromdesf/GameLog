require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { csrfSync } = require('csrf-sync');
const rawg = require('./services/rawg');

// variaveis de ambiente
for (const nome of ['RAWG_KEY', 'SESSION_SECRET', 'DATABASE_URL']) {
  if (!process.env[nome]) {
    console.error(`Falta a variável ${nome} no arquivo .env (veja o .env.example).`);
    process.exit(1);
  }
}

const isProd = process.env.NODE_ENV === 'production';
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
if (isProd) app.set('trust proxy', 1); // primeiro proxy

// seguranca helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'data:', 'media.rawg.io'],
        'upgrade-insecure-requests': isProd ? [] : null,
      },
    },
  })
);

// arquivos estaticos - pico e public
app.use('/pico', express.static(path.join(__dirname, '../node_modules/@picocss/pico/css')));
app.use(express.static(path.join(__dirname, '../public')));

// limitar o tamanho do corpo da requisicao 
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

// CSRF - sincronizado com o token no formulario e no cabecalho X-CSRF-Token
const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => req.body?._csrf || req.headers['x-csrf-token'],
});
app.use(csrfSynchronisedProtection);

// variaveis para todas as views
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req);
  res.locals.user = req.session.userId
    ? { id: req.session.userId, username: req.session.username }
    : null;
  res.locals.flash = req.session.flash || null; // apenas uma vez
  delete req.session.flash;
  res.locals.thumb = rawg.thumb;
  // gera as estrelas para a nota (1 a 10) - usado em reviews.ejs
  res.locals.stars = (r) =>
    Array.from({ length: 5 }, (_, i) => `<span class="star ${r >= i * 2 + 2 ? 'full' : r === i * 2 + 1 ? 'half' : ''}">★</span>`).join('');
  res.locals.title = null;
  next();
});

app.use(require('./routes/home'));
app.use(require('./routes/auth'));
app.use(require('./routes/games'));
app.use(require('./routes/reviews'));
app.use(require('./routes/users'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { title: 'Não encontrado', status: 404, message: 'Página não encontrada.' });
});

// erro inesperado
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message =
    status === 403
      ? 'Formulário inválido ou sessão expirada. Volte, recarregue a página e tente de novo.'
      : 'Algo deu errado do nosso lado.';
  res.status(status).render('error', { title: 'Erro', status, message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`GameLog rodando em http://localhost:${port}`));
