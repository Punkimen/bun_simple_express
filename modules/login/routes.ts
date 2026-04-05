import type { AppMethods } from "../../app";
import { loginController } from "./controller";

export const initLoginRoutes = (app: AppMethods) => {
  app.methodPost("/api/login", async (req, res) => {
    const cookies = req.cookies;
    const body = await req.formData();
    const login = body.get("login");
    const password = body.get("password");

    loginController.login(cookies, login, password);
  });
};
