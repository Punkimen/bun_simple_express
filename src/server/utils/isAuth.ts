import type { BunRequest } from "bun";

class Auth {
  isAuth(req: BunRequest) {
    const cookies = req.cookies;
    const key = cookies.get("auth");
    if (key !== process.env.AUTH_COOKIE_KEY) {
      return false;
    }

    return true;
  }
}

export const authController = new Auth();
