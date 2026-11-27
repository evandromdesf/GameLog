const router = require('express').Router();
const prisma = require('../lib/prisma');
const rawg = require('../services/rawg');
const requireAuth = require('../middleware/requireAuth');
const { reviewSchema, firstError } = require('../schemas');

// responder com JSON ou redirecionar com flash
function responder(req, res, { ok, message, status = 200, redirect }) {
  if (req.get('Accept')?.includes('application/json')) {
    return res.status(status).json({ ok, message });
  }
  req.session.flash = { type: ok ? 'success' : 'error', message };
  res.redirect(redirect);
}

// avaliar um jogo
router.post('/games/:id/review', requireAuth, async (req, res) => {
  const gameId = parseInt(req.params.id, 10);
  const back = `/games/${gameId}`;
  const parsed = reviewSchema.safeParse(req.body || {});
  if (!gameId || !parsed.success) {
    return responder(req, res, { ok: false, status: 400, redirect: back,
      message: parsed.success ? 'Jogo inválido.' : firstError(parsed) });
  }

  let game;
  try {
    game = await rawg.getGame(gameId);
  } catch {
    return responder(req, res, { ok: false, status: 502, redirect: back, message: 'Não foi possível buscar o jogo na RAWG.' });
  }

  const { rating, text } = parsed.data;
  const userId = req.session.userId;
  const gameData = { name: game.name, slug: game.slug, imageUrl: game.background_image, released: game.released };

  // salvar a avaliacao e o jogo
  await prisma.$transaction([
    prisma.game.upsert({ where: { rawgId: game.id }, update: gameData, create: { rawgId: game.id, ...gameData } }),
    prisma.review.upsert({
      where: { userId_rawgGameId: { userId, rawgGameId: game.id } },
      update: { rating, text },
      create: { userId, rawgGameId: game.id, rating, text },
    }),
  ]);
  responder(req, res, { ok: true, message: 'Avaliação salva!', redirect: back });
});

// apagar uma avaliacao
router.post('/reviews/:id/delete', requireAuth, async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: parseInt(req.params.id, 10) || 0 } });
  // autorizacao
  if (!review || review.userId !== req.session.userId) {
    return res.status(404).render('error', { title: 'Não encontrado', status: 404, message: 'Avaliação não encontrada.' });
  }
  await prisma.review.delete({ where: { id: review.id } });
  responder(req, res, { ok: true, message: 'Avaliação apagada.', redirect: `/games/${review.rawgGameId}` });
});

module.exports = router;
