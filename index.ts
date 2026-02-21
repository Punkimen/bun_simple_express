import { createApp } from './app';
import { initTransactionsRoutes } from './transactions/routes';
import { initUsersRoutes } from './users/routes';
import { AppError } from './utils/error';

const app = createApp();

app.use(async (req, res, next) => {
  return await next?.();
});

app.use(async (req, res, next) => {
  return await next?.();
});

app.use(async (req, res, next) => {
  try {
    return await next?.();
  } catch (error: any) {
    let status = 500;
    let message = 'Internal Server Error';

    if (error instanceof AppError) {
      status = error.status;
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

initUsersRoutes(app);
initTransactionsRoutes(app);

app.listen(3000, () => {
  console.log('Server is running on port 3000 on http://localhost:3000');
});
