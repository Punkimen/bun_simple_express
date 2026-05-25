# OAuth Integration Plan

Добавление OAuth поверх существующей JWT-аутентификации (login/password).
Провайдеры: Google, Yandex, GitHub.

---

## Протоколы

| Провайдер | Протокол         | Discovery              | ID Token                       | User Info                                                |
| --------- | ---------------- | ---------------------- | ------------------------------ | -------------------------------------------------------- |
| Google    | OIDC             | `client.discovery()`   | Да — email, name, sub в claims | Из claims                                                |
| Yandex    | OIDC             | `client.discovery()`   | Да — email, name, sub в claims | Из claims                                                |
| GitHub    | OAuth 2.0 только | Ручная `Configuration` | Нет                            | GET `api.github.com/user` + `api.github.com/user/emails` |

---

## 1. Регистрация приложений у провайдеров

### Google

1. [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create Credentials → OAuth client ID → Web application
3. Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
4. Получить `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Yandex

1. [oauth.yandex.ru](https://oauth.yandex.ru) → Создать приложение
2. Платформа: Веб-сервисы
3. Redirect URI: `http://localhost:3000/auth/yandex/callback`
4. Права: `login:email`, `login:info`
5. Получить `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`

### GitHub

1. [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → New OAuth App
2. Authorization callback URL: `http://localhost:3000/auth/github/callback`
3. Получить `GITHUB_CLIENT_ID`, сгенерировать `GITHUB_CLIENT_SECRET`
4. Client secret показывается один раз — сохранить сразу

---

## 2. Переменные окружения (.env)

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

YANDEX_CLIENT_ID=...
YANDEX_CLIENT_SECRET=...

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

APP_BASE_URL=http://localhost:3000
```

---

## 3. Миграция схемы БД

### 3.1 Сделать password nullable

```prisma
model User {
  ...
  password  String?   # было String (NOT NULL)
  ...
  oauthAccounts OAuthAccount[]
}
```

OAuth-пользователи не имеют пароля — поле будет `null`.

### 3.2 Добавить таблицу oauth_accounts

```prisma
model OAuthAccount {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provider    String   // "google" | "yandex" | "github"
  provider_id String   // sub из ID token (OIDC) или id из GitHub API
  user_id     String   @db.Uuid
  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  created_at  DateTime @default(now())

  @@unique([provider, provider_id])
  @@map("oauth_accounts")
}
```

Отдельная таблица (а не колонки в users) позволяет одному пользователю иметь несколько провайдеров.

### 3.3 Применить миграцию

```bash
bunx prisma migrate dev --name add_oauth_accounts
```

---

## 4. Установка зависимости

```bash
bun add openid-client
```

---

## 5. Структура нового модуля

```
src/server/modules/oauth/
  clients.ts      — конфигурация провайдеров
  controller.ts   — initiateLogin, handleCallback, findOrCreateUser
  routes.ts       — GET /auth/:provider, GET /auth/:provider/callback
```

---

## 6. clients.ts — конфигурация провайдеров

```ts
import * as client from "openid-client";

// OIDC провайдеры — конфигурируются через discovery
export async function getGoogleConfig() {
  return client.discovery(
    new URL("https://accounts.google.com"),
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
  );
}

export async function getYandexConfig() {
  return client.discovery(
    new URL("https://login.yandex.ru"),
    process.env.YANDEX_CLIENT_ID!,
    process.env.YANDEX_CLIENT_SECRET!,
  );
}

// GitHub — OAuth 2.0 без OIDC, конфигурация вручную
export function getGithubConfig() {
  return new client.Configuration(
    {
      issuer: "https://github.com",
      authorization_endpoint: "https://github.com/login/oauth/authorize",
      token_endpoint: "https://github.com/login/oauth/access_token",
    },
    process.env.GITHUB_CLIENT_ID!,
    process.env.GITHUB_CLIENT_SECRET!,
  );
}
```

Для Google и Yandex `discovery()` — async (делает HTTP запрос за `/.well-known/openid-configuration`).
Для GitHub — sync (endpoints указаны вручную, запрос не нужен).

Кешировать конфиги на старте сервера, чтобы не делать discovery при каждом запросе.

---

## 7. controller.ts

### 7.1 initiateLogin(provider, res)

1. Получить конфиг провайдера
2. Сгенерировать `state` и `code_verifier` (PKCE) через openid-client
3. Построить authorization URL: `client.buildAuthorizationUrl(config, { scope, redirect_uri, code_challenge, state })`
4. Сохранить `state` и `code_verifier` в httpOnly cookie (`oauth_state`) на 10 минут
5. Вернуть redirect на authorization URL

```ts
// Примерные scopes
const SCOPES = {
  google: "openid email profile",
  yandex: "openid login:email login:info",
  github: "read:user user:email",
};
```

### 7.2 handleCallback(provider, req)

1. Прочитать cookie `oauth_state` → `{ state, code_verifier }`
2. Удалить cookie сразу после прочтения (one-time use)
3. Для OIDC (Google, Yandex):
   ```ts
   const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
     pkceCodeVerifier: code_verifier,
     expectedState: state,
   });
   const claims = tokens.claims(); // sub, email, name, email_verified
   ```
4. Для GitHub (OAuth 2.0):
   ```ts
   const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
     pkceCodeVerifier: code_verifier,
     expectedState: state,
   });
   // ID token нет — нужен отдельный запрос
   const userInfo = await fetchGithubUser(tokens.access_token);
   ```
5. Вызвать `findOrCreateUser(provider, providerId, email, name)`
6. Выдать JWT access + refresh токены через существующий `tokenController`
7. Установить cookies и редирект на `/home`

### 7.3 fetchGithubUser(accessToken) — только для GitHub

```ts
async function fetchGithubUser(accessToken: string) {
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const user = await userRes.json();

  let email = user.email;
  if (!email) {
    // GitHub позволяет скрыть email — нужен отдельный запрос
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const emails = await emailsRes.json();
    email = emails.find((e: any) => e.primary && e.verified)?.email ?? null;
  }

  return { id: String(user.id), email, name: user.name ?? user.login };
}
```

### 7.4 findOrCreateUser(provider, providerId, email, name)

```
1. Найти OAuthAccount по (provider, provider_id)
   → Да: вернуть связанного user

2. Нет OAuthAccount — найти User по email
   → Да: создать OAuthAccount для этого user, вернуть user
   (связывание существующего аккаунта с OAuth провайдером)

3. Ни того, ни другого — создать нового User (password = null)
   и OAuthAccount вместе в одной транзакции
```

Важно: шаги 2 и 3 делать в `prisma.$transaction()` во избежание race condition.

---

## 8. Проверка email_verified

Перед `findOrCreateUser` для OIDC провайдеров:

```ts
const claims = tokens.claims();
if (!claims.email_verified) {
  throw new BadRequestError("Email не подтверждён у провайдера");
}
```

Для GitHub — проверять `verified: true` в массиве `/user/emails` (уже учтено в `fetchGithubUser`).

---

## 9. Хранение state в cookie

```ts
// Установка перед редиректом
res.cookies.set("oauth_state", JSON.stringify({ state, code_verifier }), {
  httpOnly: true,
  path: "/auth",
  maxAge: 60 * 10, // 10 минут
  sameSite: "Lax", // обязательно для OAuth redirect flow
});

// Чтение и удаление в callback
const raw = req.cookies.get("oauth_state");
res.cookies.delete("oauth_state");
const { state, code_verifier } = JSON.parse(raw);
```

`SameSite: Lax` — минимально необходимо для OAuth: cookie отправляется при top-level навигации (redirect от провайдера), но не при cross-site AJAX.

---

## 10. routes.ts

```ts
export function initOAuthRoutes(app: App) {
  app.methodGet("/auth/google", (req, res) =>
    oauthController.initiateLogin("google", res),
  );
  app.methodGet("/auth/google/callback", (req, res) =>
    oauthController.handleCallback("google", req, res),
  );

  app.methodGet("/auth/yandex", (req, res) =>
    oauthController.initiateLogin("yandex", res),
  );
  app.methodGet("/auth/yandex/callback", (req, res) =>
    oauthController.handleCallback("yandex", req, res),
  );

  app.methodGet("/auth/github", (req, res) =>
    oauthController.initiateLogin("github", res),
  );
  app.methodGet("/auth/github/callback", (req, res) =>
    oauthController.handleCallback("github", req, res),
  );
}
```

---

## 11. Обновление authMiddleware.ts

Добавить OAuth маршруты в список публичных:

```ts
const isPublicRoute =
  path === "/login" ||
  path === "/register" ||
  path === "/api/login" ||
  path === "/api/register" ||
  path === "/api/logout" ||
  path.startsWith("/auth/") || // <-- добавить
  path.startsWith("/public");
```

---

## 12. Обновление login.ejs

Добавить кнопки OAuth. Это обычные ссылки, не HTMX — нужен полный редирект (не XHR):

```html
<div class="login-divider"><span>или войдите через</span></div>
<div class="oauth-buttons">
  <a href="/auth/google" class="login-btn-oauth login-btn-oauth--google">
    Google
  </a>
  <a href="/auth/yandex" class="login-btn-oauth login-btn-oauth--yandex">
    Яндекс
  </a>
  <a href="/auth/github" class="login-btn-oauth login-btn-oauth--github">
    GitHub
  </a>
</div>
```

---

## 13. Регистрация модуля в index.ts

```ts
import { initOAuthRoutes } from "./modules/oauth/routes";

// ...
initOAuthRoutes(app);
```

---

## 14. Деплой — важно

При выходе на прод нужно:

1. Обновить `APP_BASE_URL` на продовый домен
2. Добавить продовый callback URL в настройках каждого провайдера:
   - Google: Authorized redirect URIs
   - Yandex: Redirect URI в настройках приложения
   - GitHub: Authorization callback URL
3. Либо создать отдельные OAuth приложения для prod и dev

---

## Порядок реализации

1. Миграция схемы (`password?` + `OAuthAccount`)
2. `bun add openid-client`
3. `clients.ts` — конфиги провайдеров
4. `controller.ts` — `initiateLogin` + `handleCallback` + `findOrCreateUser`
5. `routes.ts` + регистрация в `index.ts`
6. `authMiddleware.ts` — добавить `/auth/*` в публичные
7. `login.ejs` — кнопки OAuth
8. Ручное тестирование каждого провайдера
