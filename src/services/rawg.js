// chamadas a RAWG ficam aqui, com cache em memoria (Map com validade)
const BASE = 'https://api.rawg.io/api';
const cache = new Map();

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

async function rawgGet(path, params, ttl) {
  // filtra os parametros e ordena para gerar a chave do cache
  const clean = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  const cacheKey = (path + '?' + new URLSearchParams(clean)).toLowerCase();

  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.data;

  const url = `${BASE}${path}?${new URLSearchParams([...clean, ['key', process.env.RAWG_KEY]])}`;
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw new Error('A RAWG não respondeu. Tente novamente em instantes.');
  }
  if (!res.ok) throw new Error(`Erro ao consultar a RAWG (código ${res.status}).`);

  const data = await res.json();
  if (cache.size > 500) cache.clear(); // evita o cache crescer sem limite
  cache.set(cacheKey, { data, expires: Date.now() + ttl });
  return data;
}

const PAGE_SIZE = 12;

exports.searchGames = ({ search, genres, year, page }) =>
  rawgGet(
    '/games',
    {
      search,
      genres,
      dates: year ? `${year}-01-01,${year}-12-31` : '',
      ordering: search ? '' : '-added',
      page,
      page_size: PAGE_SIZE,
    },
    10 * MINUTE
  );

exports.getPopular = () => {
  const y = new Date().getFullYear();
  return rawgGet(
    '/games',
    { dates: `${y - 1}-01-01,${y}-12-31`, ordering: '-added', page_size: 8 },
    HOUR
  ).then((d) => d.results);
};

exports.getGame = (id) => rawgGet(`/games/${id}`, {}, 24 * HOUR);

exports.getGenres = () => rawgGet('/genres', {}, 24 * HOUR).then((d) => d.results);

exports.PAGE_SIZE = PAGE_SIZE;

// gera a url da imagem em tamanho reduzido
exports.thumb = (url, width = 420) => (url ? url.replace('/media/', `/media/resize/${width}/-/`) : '');
