import type { AppMethods } from "../../app";
import { eta } from "../../utils/eta";

export const initLoginRoutes = (app: AppMethods) => {
  app.methodGet("/login", async (req, res) => {
    const body = eta.render("./pages/login.eta", {});
    const html = await eta.render("./layout.eta", {
      title: "Login",
      body,
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  });
};
