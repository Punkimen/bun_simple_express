import type { MiddlewareCallback } from "../app";
import { authController, tokenController } from "../modules/auth/controller";
import { setRequestContext } from "../utils/requestContext";

const ACCESS_COOKIE_OPTS = {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 15,
} as const;
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
} as const;

export const authMiddleware: MiddlewareCallback = async (req, res, next) => {
  const url = new URL(req.url);
  const path = url.pathname;

  const isPublicRoute =
    path === "/login" ||
    path === "/register" ||
    path === "/api/login" ||
    path === "/api/register" ||
    path === "/api/logout" ||
    path === "/api/getGoogleOauth" ||
    path.startsWith("/auth/google/callback") ||
    path.startsWith("/public");

  const accessToken = req.cookies.get("access_token");
  const refreshToken = req.cookies.get("refresh_token");

  let isAuth = false;

  if (accessToken) {
    try {
      const payload = await tokenController.verifyAccess(accessToken);
      setRequestContext(req, { userId: payload.userId });
      isAuth = true;
    } catch {
      // access token expired — fall through to silent refresh
    }
  }

  if (!isAuth && refreshToken) {
    try {
      const tokens = await authController.refresh(refreshToken);
      req.cookies.set("access_token", tokens.accessToken, ACCESS_COOKIE_OPTS);
      req.cookies.set(
        "refresh_token",
        tokens.refreshToken,
        REFRESH_COOKIE_OPTS,
      );
      const payload = await tokenController.verifyAccess(tokens.accessToken);
      setRequestContext(req, { userId: payload.userId });
      isAuth = true;
    } catch {
      // refresh token invalid/revoked
    }
  }
  console.log({ isPublicRoute }, !isPublicRoute, path);
  if (!isAuth && !isPublicRoute) {
    console.log("w");
    const isHx = req.headers.get("HX-Request") === "true";
    if (path.startsWith("/api")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    if (isHx) {
      return new Response(null, {
        status: 200,
        headers: { "HX-Redirect": "/login" },
      });
    }
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }

  if (isAuth && path === "/login") {
    const isHx = req.headers.get("HX-Request") === "true";
    if (isHx) {
      return new Response(null, {
        status: 200,
        headers: { "HX-Redirect": "/home" },
      });
    }
    return new Response(null, { status: 302, headers: { Location: "/home" } });
  }

  return await next?.();
};
