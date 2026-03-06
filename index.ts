import { CookieMap } from "bun";
import { createApp } from "./app";
import { initTransactionsRoutes } from "./modules/transactions/routes";
import { initUsersRoutes } from "./modules/users/routes";
import { AppError, UnauthorizedError } from "./utils/error";
import type { AdminLogin } from "./types/common.type";

const app = createApp();

app.use(async (req, res, next) => {
  const cookies = req.cookies;
  const url = new URL(req.url);
  const path = url.pathname;
  console.log({ url }, { path });
  if (!cookies.get("auth") && path !== "login") {
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

app.methodPost<AdminLogin>("/login", async (req, res) => {
  const cookies = req.cookies;
  const body = await req.json();
  console.log({ body }, process.env.ADMIN_LOGIN);
  if (
    body.login === process.env.ADMIN_LOGIN &&
    body.password === process.env.PASSWORD
  ) {
    cookies.set("auth", "11123", { httpOnly: true, path: "/" });
  } else {
    throw new UnauthorizedError();
  }

  return;
});

app.listen(3000, () => {
  console.log("Server is running on port 3000 on http://localhost:3000");
});
