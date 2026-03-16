import type { BunRequest } from "bun";

class Auth {
  isAuth(req: BunRequest) {
    const cookies = req.cookies;
    const key = cookies.get("auth");
    const path = new URL(req.url).pathname;

    if (
      key !== process.env.AUTH_COOKIE_KEY &&
      path !== "/api/login" &&
      path !== "/login"
    ) {
      return false;
    }
    return true;
  }
}

export const authController = new Auth();
