process.on('uncaughtException', (err) => {
  console.error('!!! КРИТИЧЕСКАЯ ОШИБКА БЭКЕНДА (Exception):', err.message);
  console.error(err.stack);
  process.exit(1);
});


process.on('unhandledRejection', (reason: any) => {
  console.error('!!! СБОЙ АСИНХРОННОГО ПРОМИСА (Rejection):', reason?.message || reason);
  if (reason?.stack) console.error(reason.stack);
  process.exit(1);
});

import dotenv from 'dotenv';
import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import cors from "cors";
import routes from "./router.js"

const app: Express = express();

const BACKEND_PORT = Number(process.env.BACKEND_PORT) || 3000;
const BACKEND_HOST = process.env.BACKEND_HOST || "0.0.0.0";

app.use(cors({
  origin: true,
  credentials: true,          
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_cookie_name",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: true, 
      httpOnly: true, 
      sameSite: "none" 
    },
  }),
);

app.use((req, res, next) => {
  const customSessionId = req.headers['x-session-id'] as string;
  
  if (customSessionId && req.sessionStore) {
    req.sessionStore.get(customSessionId, (err, session) => {
      if (session) {
        req.session = Object.assign(req.session, session);
      }
      next();
    });
  } else {
    next();
  }
});

app.use("/", routes);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildPath = path.join(__dirname, "..", "frontend");
app.use(express.static(buildPath));

setInterval(() => {}, 24 * 60 * 60 * 1000);

app.listen(BACKEND_PORT, () => {
  console.log(`Your server is running on http://${BACKEND_HOST}:${BACKEND_PORT}`);
});