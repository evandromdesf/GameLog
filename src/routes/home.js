const router = require('express').Router();
const prisma = require('../lib/prisma');
const rawg = require('../services/rawg');

router.get('/', async (req, res) => {
  let popular = [];
  try {
    popular = await rawg.getPopular();
  } catch (err) {
    console.error(err.message); // nao critico, apenas loga o erro
  }
  const latest = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { user: true, game: true },
  });
  res.render('home', { popular, latest });
});

module.exports = router;
