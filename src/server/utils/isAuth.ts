import type { BunRequest } from "bun";
import { tokenController } from "../modules/auth/controller";

class Auth {
  async isAuth(req: BunRequest): Promise<boolean> {
    const accessToken = req.cookies.get("access_token");
    if (!accessToken) return false;
    try {
      await tokenController.verifyAccess(accessToken);
      return true;
    } catch {
      return false;
    }
  }
}

export const authController = new Auth();
