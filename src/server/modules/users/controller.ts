import { prisma } from "../../prisma/db";
import { passwordController } from "../auth/libs/passwordHasher";
import { BadRequestError, UnauthorizedError } from "../../utils/error";
import type { CookieMap } from "bun";
import { authController } from "../auth/controller";

class Users {
  async createUser(name: string, login: string, password: string) {
    const hashPassword = await passwordController.hash(password);
    try {
      await prisma.user.create({
        data: {
          email: login,
          name,
          password: hashPassword,
        },
      });
    } catch {
      throw new BadRequestError("Пользователь с таким email уже существует");
    }
  }

  async login(cookies: CookieMap, login: string, password: string) {
    if (!login || !password) {
      throw new BadRequestError();
    }

    let tokens: { accessToken: string; refreshToken: string };
    try {
      tokens = await authController.login(String(login), String(password));
    } catch {
      throw new UnauthorizedError();
    }

    cookies.set("access_token", tokens.accessToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 15,
    });
    cookies.set("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return new Response(null, {
      headers: { "HX-Redirect": "/home" },
    });
  }
  async getUsers() {
    const users = await prisma.user.findMany({});
    return users;
  }
  async deleteUser(id: string) {
    return await prisma.user.delete({ where: { id } });
  }
}

export const userController = new Users();
