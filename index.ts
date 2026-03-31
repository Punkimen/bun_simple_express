import { createApp } from "./app";
import { initTransactionsRoutes } from "./modules/transactions/routes";
import { initUsersRoutes } from "./modules/users/routes";
import { AppError, UnauthorizedError } from "./utils/error";
import { initCategoryRoutes } from "./modules/category/routes";
import { authController } from "./utils/isAuth";
import { eta } from "./utils/eta";

const app = createApp();

app.use(async (req, res, next) => {
  try {
    return await next?.();
  } catch (error: any) {
    let status = 500;
    let message = "Internal Server Error";

    if (error instanceof AppError) {
      status = error.status;
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
});

app.use(async (req, res, next) => {
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
});

initUsersRoutes(app);
initTransactionsRoutes(app);
initCategoryRoutes(app);

app.methodPost("/api/login", async (req, res) => {
  const cookies = req.cookies;
  const body = await req.formData();
  const login = body.get("login");
  const password = body.get("password");

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
});

app.methodHtml("/home", async (req, res) => {
  const body = await eta.render("./pages/home.eta", {});
  return await eta.render("./layout.eta", {
    title: "Home",
    body,
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000 on http://localhost:3000");
});
