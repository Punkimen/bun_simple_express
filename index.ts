import { createApp } from "./app";
import { initTransactionsRoutes } from "./modules/transactions/routes";
import { initUsersRoutes } from "./modules/users/routes";
import { initCategoryRoutes } from "./modules/category/routes";
import { initLoginRoutes } from "./modules/login/routes";
import { authMiddleware } from "./middlewares/authMiddleware";
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware";

const app = createApp();

app.use(errorHandlerMiddleware);

app.use(authMiddleware);

initLoginRoutes(app);
initUsersRoutes(app);
initTransactionsRoutes(app);
initCategoryRoutes(app);

app.listen(3000, () => {
  console.log("Server is running on port 3000 on http://localhost:3000");
});
