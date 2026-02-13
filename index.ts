import { createApp } from './app';
import { initRoutes } from './routes';
import { AppError } from './utils/error';

const app = createApp();

app.use((req, res, next) => {
  console.log('Middleware 1');
  return next?.(req, res) || new Response();
});

app.use(async (req, res, next) => {
  try {
    return await next?.(req, res);
  } catch (error: any) {
    console.error(error);

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

initRoutes(app);

app.listen(3000, () => {
  console.log('Server is running on port 3000 on http://localhost:3000');
});
