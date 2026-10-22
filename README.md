# GREEN-API Messenger — тестовое задание

Пользовательский интерфейс для отправки и получения текстовых сообщений
через [GREEN-API](https://green-api.com/). Внешний вид вдохновлён
[web.max.ru](https://web.max.ru/).

## Стек

- React 18 (Create React App)
- Tailwind CSS
- Fetch API (без сторонних HTTP-клиентов)
- Long polling для получения входящих сообщений

## Требования

- Node.js 18+ и npm 9+
- Аккаунт GREEN-API с созданным инстансом
  (нужны `idInstance` и `apiTokenInstance`)

## Локальный запуск

1. Клонируйте репозиторий:

   git clone git@github.com:Vichislav/react_max.git
   cd <папка-проекта>

2. Установите зависимоти:

   npm install

3. Запустите dev-сервер:

    npm run dev