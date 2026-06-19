import type { AppMethods } from "../../app";
import { renderPage } from "../../utils/renderPage";
import { getRequestContext } from "../../utils/requestContext";
import { prisma } from "../../prisma/db";

export const renderHtml = async (app: AppMethods) => {
  app.methodHtml("/login", () => renderPage("login"));

  app.methodHtml("/forgot-password", () => renderPage("forgot-password"));

  app.methodHtml("/reset-password", (req) => {
    const token = new URL(req.url).searchParams.get("token") ?? "";
    return renderPage("reset-password", { token });
  });

  app.methodHtml("/home", async (req) => {
    const ctx = getRequestContext(req);
    const user = ctx?.userId
      ? await prisma.user.findUnique({ where: { id: ctx.userId }, select: { name: true, password: true } })
      : null;
    return renderPage("index", { userName: user?.name ?? "", hasPassword: user?.password !== null, activePage: "home" });
  });

  app.methodHtml("/statistics", async (req) => {
    const ctx = getRequestContext(req);
    const user = ctx?.userId
      ? await prisma.user.findUnique({ where: { id: ctx.userId }, select: { name: true, password: true } })
      : null;
    return renderPage("statistics", { userName: user?.name ?? "", hasPassword: user?.password !== null, activePage: "statistics" });
  });
};
