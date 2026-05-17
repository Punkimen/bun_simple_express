import type { AppMethods } from "../../app";
import { renderPage } from "../../utils/renderPage";
import { getRequestContext } from "../../utils/requestContext";
import { prisma } from "../../prisma/db";

export const renderHtml = async (app: AppMethods) => {
  app.methodHtml("/login", () => renderPage("login"));

  app.methodHtml("/home", async (req) => {
    const ctx = getRequestContext(req);
    const user = ctx?.userId
      ? await prisma.user.findUnique({ where: { id: ctx.userId }, select: { name: true } })
      : null;
    return renderPage("index", { userName: user?.name ?? "" });
  });
};
