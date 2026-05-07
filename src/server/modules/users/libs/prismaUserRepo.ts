import type { IUserRepository, StoredUser } from "auth_package";
import { prisma } from "../../../prisma/db";

class PrismaUser implements IUserRepository {
  async findByEmail(email: string): Promise<StoredUser | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password,
    };
  }
  async findById(id: string): Promise<StoredUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password,
    };
  }
}
export const prismaUserController = new PrismaUser();
