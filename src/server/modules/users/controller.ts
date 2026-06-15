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

  async changePassword(
    userId: string,
    oldPass: string,
    newPass: string,
    confirmPass: string,
    refreshToken: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestError("user not found");
    }
    
    if(!user.password){
      throw new BadRequestError("it`s oAuth accaunt")
    }

    const validPass = await passwordController.verify(oldPass, user.password);
    if (!validPass || newPass !== confirmPass) {
      throw new BadRequestError("passwords is not valid. Try again");
    }

    const hashPass = await passwordController.hash(newPass);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashPass },
    });

    await authController.logout(refreshToken);
  }

  async resetPassword(email: string) {
    const isHasUser = await prisma.user.findUnique({where: {email}})
    if(!isHasUser){
      throw new BadRequestError("User with this email not found");
    }
  }

  async deleteUser(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
  }
}

export const userController = new Users();
