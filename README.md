# budget

Персональный трекер бюджета на Bun + EJS + PostgreSQL.

## Установка зависимостей

```bash
bun install
```

## Запуск в dev-режиме

```bash
bun run dev
```

## Развёртывание базы данных на Ubuntu (production)

### 1. Установка PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

### 2. Создание пользователя и базы данных

```bash
sudo -u postgres psql
```

Внутри psql:

```sql
CREATE USER budjet_user WITH PASSWORD 'your_strong_password';
CREATE DATABASE budjet OWNER budjet_user;
\q
```

### 3. Применение схемы

Скопируйте файл `src/server/db/schema.sql` на сервер, затем выполните:

```bash
psql -U budjet_user -d budjet -h localhost -f schema.sql
```

Или одной командой без копирования файла (с локальной машины через ssh):

```bash
ssh user@your-server "psql -U budjet_user -d budjet -h localhost" < src/server/db/schema.sql
```

### 4. Настройка доступа (pg_hba.conf)

По умолчанию PostgreSQL разрешает локальные подключения через сокет. Если приложение подключается по TCP (`localhost`), убедитесь что в `/etc/postgresql/<version>/main/pg_hba.conf` есть строка:

```
host    budjet    budjet_user    127.0.0.1/32    md5
```

После изменения перезапустите PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 5. Файл .env

Создайте `.env` в корне проекта:

```env
DATABASE_URL=postgresql://budjet_user:your_strong_password@localhost:5432/budjet
ADMIN_LOGIN=admin
ADMIN_PASSWORD=your_admin_password
AUTH_COOKIE_KEY=your_random_secret_string
```

### 6. Запуск в production

Соберите проект и запустите:

```bash
bun build.ts
bun build/index.js
```

Рекомендуется использовать `systemd` для автозапуска процесса.

#### Пример systemd-юнита (`/etc/systemd/system/budget.service`):

```ini
[Unit]
Description=Budget App
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/budget
EnvironmentFile=/opt/budget/.env
ExecStart=/usr/local/bin/bun /opt/budget/build/index.js
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now budget
```

## Настройка Nginx (reverse proxy)

Nginx принимает внешние HTTPS-запросы и проксирует их на `localhost:3000`, где работает bun-приложение. Статика (`/public/*`) отдаётся nginx напрямую с диска — без участия bun.

```
Internet → nginx :443 → bun :3000 → PostgreSQL
                  └──► /public/* (с диска, минуя bun)
```

### 1. Установка nginx

```bash
sudo apt update && sudo apt install nginx -y
sudo systemctl enable nginx
```

### 2. Скопировать конфиг

```bash
# Заменить your-domain.com на реальный домен или IP сервера
sudo cp nginx.conf /etc/nginx/sites-available/budget
sudo ln -s /etc/nginx/sites-available/budget /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # убрать дефолтный сайт

sudo nginx -t && sudo systemctl reload nginx
```

### 3. SSL-сертификат (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot сам пропишет пути к сертификатам в конфиге и настроит автообновление через cron.

### 4. Открыть порты в firewall

```bash
sudo ufw allow 'Nginx Full'   # открывает 80 и 443
sudo ufw allow OpenSSH
sudo ufw enable
```

### 5. Что заменить в `nginx.conf`

| Placeholder | Что подставить |
|---|---|
| `your-domain.com` | реальный домен или IP |
| `/home/ubuntu/budjet/` | путь к проекту на сервере |

---

## Схема базы данных

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense'))
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NULL REFERENCES categories(id),
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  note TEXT
);
```
