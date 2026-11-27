# 🎮 GameLog

Mini Letterboxd para jogos: busque jogos (API da [RAWG](https://rawg.io)), dê notas em estrelas e escreva avaliações.

**Tecnologias:** Node + Express, EJS, Pico.css, SQLite + Prisma, express-session, bcryptjs, zod, helmet, csrf-sync, express-rate-limit

## Como rodar

1. Requer [Node.js] 20 ou mais novo.
2. `npm install`
3. Copie `.env.example` para `.env` e preencha `RAWG_KEY` (chave grátios disponível em https://rawg.io/apidocs) e `SESSION_SECRET`.
4. `npx prisma db push` (cria o banco)
5. `npm run dev` e abra http://localhost:3000

Dados de jogos e imagens: [RAWG](https://rawg.io).
