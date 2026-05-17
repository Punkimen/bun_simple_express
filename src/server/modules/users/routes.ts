import type { AppMethods } from "../../app";
import { userController } from "./controller";
import { BadRequestError } from "../../utils/error";
import { authController } from "../auth/controller";

export const initUsersRoutes = (app: AppMethods) => {
  app.methodPost<{
    name: string;
    login: string;
    password: string;
    confirmPassword: string;
  }>("/api/register", async (req) => {
    const { name, login, password, confirmPassword } = await req.json();

    if (!name || !login || !password) {
      throw new BadRequestError("Заполните все поля");
    }
    if (password !== confirmPassword) {
      throw new BadRequestError("Пароли не совпадают");
    }

    await userController.createUser(name, login, password);
    return userController.login(req.cookies, login, password);
  });

  app.methodPost<{ login: string; password: string }>(
    "/api/login",
    async (req) => {
      const cookies = req.cookies;
      const { login, password } = await req.json();

      return userController.login(cookies, login, password);
    },
  );

  app.methodPost("/api/logout", async (req) => {
    const refreshToken = req.cookies.get("refresh_token");
    if (refreshToken) {
      await authController.logout(refreshToken);
    }
    req.cookies.set("access_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    req.cookies.set("refresh_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return new Response(null, {
      status: 200,
      headers: { "HX-Redirect": "/login" },
    });
  });
};
