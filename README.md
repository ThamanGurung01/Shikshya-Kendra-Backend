# Shikshya Kendra Backend

Backend for the Shikshya Kendra project, built with Express, TypeScript, and MongoDB.

## Features

- Express server with TypeScript
- MongoDB connection through Mongoose
- Authentication routes
- Cookie and CORS support

## Requirements

- Node.js
- MongoDB instance

## Environment Variables

Create a `.env` file in the project root with:

```env
PORT=3000
MONGO_URI=your-mongodb-connection-string
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
FRONTEND_URL=http://localhost:5173
```

## Setup

Install dependencies:

```bash
npm install
```

Run the app in development:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Start the production build:

```bash
npm start
```
