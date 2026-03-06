import ejs from "ejs";

import { join } from "path";

const baseDir = import.meta.dir;
export async function renderPage(page: string, data = {}) {
  const pagePath = join(baseDir, "../../client/views/pages", `${page}.ejs`);
  const layoutPath = join(baseDir, "../../client/views/layout/layout.ejs");

  const content = await ejs.renderFile(pagePath, data);

  return await ejs.renderFile(layoutPath, { content });
}

export async function renderHtmlPart(
  htmlPath: { clientPath: string; name: string },
  data = {},
) {
  const html = join(
    baseDir,
    `../../client/${htmlPath.clientPath}`,
    `${htmlPath.name}.ejs`,
  );
  return await ejs.renderFile(html, data);
}
