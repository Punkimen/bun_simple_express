import ejs from "ejs";
import { join } from "path";
import { CLIENT_DIR } from "./paths";

export async function renderPage(page: string, data = {}) {
  const pagePath = join(CLIENT_DIR, "views/pages", `${page}.ejs`);
  const layoutPath = join(CLIENT_DIR, "views/layout/layout.ejs");

  const content = await ejs.renderFile(pagePath, data);

  return await ejs.renderFile(layoutPath, { content });
}

export async function renderHtmlPart(
  htmlPath: { clientPath: string; name: string },
  data = {},
) {
  const html = join(CLIENT_DIR, htmlPath.clientPath, `${htmlPath.name}.ejs`);
  return await ejs.renderFile(html, data);
}
