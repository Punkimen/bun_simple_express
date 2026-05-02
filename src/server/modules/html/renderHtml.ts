import type { AppMethods } from "../../app";
import { renderPage } from "../../utils/renderPage";

export const renderHtml = async (app: AppMethods) => {
  app.methodHtml("/login", () => {
    return renderPage("login");
  });
  app.methodHtml("/home", () => {
    return renderPage("index");
  });
};
