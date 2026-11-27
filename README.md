# 🎮 GameLog

Mini Letterboxd para jogos: busque jogos (API da [RAWG](https://rawg.io)), dê notas em estrelas e escreva avaliações.

**Tecnologias:** Node + Express, EJS, Pico.css, SQLite + Prisma, express-session, bcryptjs, zod, helmet, csrf-sync, express-rate-limit

## Como rodar

1. Requer [Node.js] 20 ou mais novo.
2. `npm install`
3. Copie `.env.example` para `.env` e preencha `RAWG_KEY` (chave grátis disponível em https://rawg.io/apidocs) e `SESSION_SECRET`.
4. `npx prisma db push` (cria o banco)
5. `npm run dev` e abra http://localhost:3000

Dados de jogos e imagens: [RAWG](https://rawg.io).

## Demo online

O projeto foi publicado com o [Render](https://render.com) e pode ser acessado em:

**https://gamelog-lakd.onrender.com/**

> Está no plano gratuito: após alguns minutos sem acesso o serviço fica inativo, então a primeira visita pode levar cerca de 1 minuto para carregar. Além disso, os dados podem ser apagados se o serviço for reiniciado ou publicado de novo.