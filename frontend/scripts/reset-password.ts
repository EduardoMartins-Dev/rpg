/**
 * Reseta a senha de um usuário existente. Não há tela nem endpoint para isso
 * (por design: sem "esqueci a senha"), então o reset é feito por aqui, contra o
 * mesmo banco apontado por DATABASE_URL. Espelha scripts/prod-bootstrap.ts e
 * grava um hash bcrypt compatível com o login (verifyPassword).
 *
 * Uso (dev, banco local):
 *   npm run db:reset-password -- <email> <novaSenha>
 *
 * Uso (produção — aponte para o banco da Vercel/Supabase):
 *   DATABASE_URL="postgres://...:5432/...?sslmode=require" \
 *     npx tsx scripts/reset-password.ts <email> <novaSenha>
 */
import { eq } from "drizzle-orm";
import { db, sqlRaw } from "../src/server/db/client";
import { users } from "../src/server/db/schema";
import { hashPassword } from "../src/server/auth/password";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase() ?? "";
  const newPassword = process.argv[3] ?? "";

  if (!email || !newPassword) {
    console.error("uso: npm run db:reset-password -- <email> <novaSenha>");
    process.exit(1);
  }
  if (newPassword.length < 8) {
    console.error("a nova senha precisa ter pelo menos 8 caracteres");
    process.exit(1);
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    console.error(`nenhum usuário com o e-mail '${email}'`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  console.log(`senha redefinida para '${email}'. As sessões antigas continuam válidas até o token expirar.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sqlRaw.end());
