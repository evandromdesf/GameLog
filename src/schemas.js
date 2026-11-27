// validacao dos formularios (zod)
const { z } = require('zod');

const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, 'Usuário: 3 a 20 caracteres (letras, números e _).');
const email = z.string().trim().toLowerCase().email('E-mail inválido.').max(100);
const password = z
  .string()
  .min(8, 'A senha precisa ter ao menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.');

exports.registerSchema = z.object({ username, email, password });
exports.loginSchema = z.object({ email, password: z.string().min(1).max(72) });
exports.reviewSchema = z.object({
  rating: z.coerce
    .number({ invalid_type_error: 'Escolha uma nota.' })
    .int('Nota inválida.')
    .min(1, 'Escolha uma nota.')
    .max(10, 'Nota inválida.'),
  text: z.string().trim().max(2000, 'O texto pode ter no máximo 2000 caracteres.').default(''),
});
exports.settingsSchema = z.object({
  email,
  bio: z.string().trim().max(300, 'A bio pode ter no máximo 300 caracteres.').default(''),
});

// retorna a primeira mensagem de erro do resultado da validacao
exports.firstError = (result) => result.error.issues[0].message;
