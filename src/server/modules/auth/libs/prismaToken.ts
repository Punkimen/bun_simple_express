import type { ITokenRepository, StoredRefreshToken } from "auth_package";
import { prisma } from "../../../prisma/db";

class PrismaToken implements ITokenRepository {
  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await prisma.refreshToken.create({
      data: { token, user_id: userId, expires_at: expiresAt },
    });
  }
  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { token } });
  }
  async findRefreshToken(token: string): Promise<StoredRefreshToken | null> {
    const row = await prisma.refreshToken.findUnique({ where: { token } });
    if (!row) return null;
    return { userId: row.user_id, expiresAt: row.expires_at };
  }
  async deleteAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { user_id: userId } });
  }
}
export const prismaTokenController = new PrismaToken();
