import { createApp } from "./app";
import { initTransactionsRoutes } from "./modules/transactions/routes";
import { initUsersRoutes } from "./modules/users/routes";
import { AppError, UnauthorizedError } from "./utils/error";
import type { AdminLogin } from "./types/common.type";
import { initCategoryRoutes } from "./modules/category/routes";
import { Eta } from "eta";
import path from "node:path";

const eta = new Eta({ views: path.join(import.meta.dirname, "views") });
const app = createApp();

app.use(async (req, res, next) => {
  const cookies = req.cookies;
  const url = new URL(req.url);
  const path = url.pathname;
  const key = cookies.get("auth");

  if (
    key !== process.env.AUTH_COOKIE_KEY &&
    path !== "/api/login" &&
    path !== "/login"
  ) {
    throw new UnauthorizedError();
  }

  return await next?.();
});

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

app.methodHtml("/login", async (req, res) => {
  const body = await eta.render("./pages/login.eta", {});
  return await eta.render("./layout.eta", {
    title: "Login",
    body,
  });
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
