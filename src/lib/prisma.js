// conexao com o banco
const { PrismaClient } = require('@prisma/client');
module.exports = new PrismaClient();
