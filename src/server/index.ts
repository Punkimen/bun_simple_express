import { createApp } from "./app";
import { initTransactionsRoutes } from "./modules/transactions/routes";
import { initUsersRoutes } from "./modules/users/routes";
import { initCategoryRoutes } from "./modules/category/routes";
import { authMiddleware } from "./middlewares/authMiddleware";
import { renderHtml } from "./modules/html/renderHtml";
import { initOAuthRoutes } from "./modules/oauth/routes";
const app = createApp();

app.use(authMiddleware);

initUsersRoutes(app);
initTransactionsRoutes(app);
initCategoryRoutes(app);
initOAuthRoutes(app);
renderHtml(app);

app.listen(3000, () => {
  console.log("Server is running on port 3000 on http://localhost:3000");
});
