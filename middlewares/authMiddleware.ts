import type { MiddlewareCallback } from "../app";
import { authController } from "../utils/isAuth";

export const authMiddleware: MiddlewareCallback = async (req, res, next) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const isAuth = authController.isAuth(req);
  const isPublicRoute =
    path === "/login" || path === "/api/login" || path.startsWith("/public");

  if (!isAuth && !isPublicRoute) {
    if (path.startsWith("/api")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login",
      },
    });
  }

  if (isAuth && path === "/login") {
    const isHx = req.headers.get("HX-Request") === "true";

    if (isHx) {
      return new Response(null, {
        status: 200,
        headers: {
          "HX-Redirect": "/home",
        },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/home",
      },
    });
  }

  return await next?.();
};
