const router = require('express').Router();
const prisma = require('../lib/prisma');
const rawg = require('../services/rawg');

const ESRB = { everyone: 'Livre', 'everyone-10-plus': '10+', teen: '13+', mature: '17+', 'adults-only': '18+', 'rating-pending': 'Em análise' };

router.get('/games', async (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 100);
  const genres = String(req.query.genres || '').replace(/[^a-z0-9,-]/g, '');
  const yearNum = parseInt(req.query.year, 10);
  const year = yearNum >= 1970 && yearNum <= 2100 ? yearNum : '';
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 100);

  let games = [], genreList = [], total = 0, error = null;
  try {
    const [data, g] = await Promise.all([
      rawg.searchGames({ search, genres, year, page }),
      rawg.getGenres(),
    ]);
    games = data.results;
    total = data.count;
    genreList = g;
  } catch (err) {
    error = err.message;
  }

  // montar url de paginacao
  const link = (p) => {
    const q = new URLSearchParams({ search, genres, year, page: p });
    for (const [k, v] of [...q]) if (v === '') q.delete(k);
    return '/games?' + q;
  };
  const totalPages = Math.ceil(total / rawg.PAGE_SIZE);
  res.render('search', {
    title: 'Jogos', games, genreList, search, genres, year, page, error,
    prevUrl: page > 1 ? link(page - 1) : null,
    nextUrl: page < totalPages && page < 100 ? link(page + 1) : null,
  });
});

router.get('/games/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(404).render('error', { title: 'Não encontrado', status: 404, message: 'Jogo não encontrado.' });

  let game;
  try {
    game = await rawg.getGame(id);
  } catch (err) {
    return res.status(404).render('error', { title: 'Erro', status: 404, message: 'Não foi possível carregar este jogo agora.' });
  }

  const [reviews, stats, myReview] = await Promise.all([
    prisma.review.findMany({
      where: { rawgGameId: id, NOT: { userId: req.session.userId || 0 } }, // exclui a propria review do usuario logado
      orderBy: { createdAt: 'desc' }, take: 30,
      include: { user: true, game: true },
    }),
    prisma.review.aggregate({ where: { rawgGameId: id }, _avg: { rating: true }, _count: true }),
    req.session.userId
      ? prisma.review.findUnique({
          where: { userId_rawgGameId: { userId: req.session.userId, rawgGameId: id } },
          include: { user: true, game: true },
        })
      : null,
  ]);

  res.render('game', {
    title: game.name, game, reviews, myReview,
    editing: req.query.edit === '1',
    esrb: game.esrb_rating ? `${ESRB[game.esrb_rating.slug] || game.esrb_rating.name} (ESRB)` : 'Não classificado',
    tags: (game.tags || []).filter((t) => t.language === 'eng').slice(0, 15), // tags em ingles?
    avg: stats._avg.rating ? (stats._avg.rating / 2).toFixed(1) : null,
    count: stats._count,
  });
});

module.exports = router;
