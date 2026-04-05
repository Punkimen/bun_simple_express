import type { CookieMap, FormDataEntryValue } from "bun";
import { UnauthorizedError } from "../../utils/error";

class LoginController {
  login(
    cookies: CookieMap,
    login: FormDataEntryValue | null,
    password?: FormDataEntryValue | null,
  ) {
    if (
      login === process.env.ADMIN_LOGIN &&
      password === process.env.ADMIN_PASSWORD
    ) {
      cookies.set("auth", process.env.AUTH_COOKIE_KEY || "", {
        httpOnly: true,
        path: "/",
      });

      return new Response(null, {
        headers: {
          "HX-Redirect": "/home",
        },
      });
    } else {
      throw new UnauthorizedError();
    }
  }
}

export const loginController = new LoginController();
