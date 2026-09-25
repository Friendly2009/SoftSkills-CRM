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
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import express, { Express } from "express";
import session from "express-session";
import cors from "cors";
import routes from "./router.js";

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
    secret: process.env.SESSION_SECRET || "21r4qwgrvfs24tqwgavdsewqt4cxasvdrwgq",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, 
      httpOnly: true, 
      sameSite: "lax" 
    },
  }),
);

app.use("/", routes);

const buildPath = path.join(__dirname, "..", "frontend");
app.use(express.static(buildPath));

setInterval(() => {}, 24 * 60 * 60 * 1000);

app.listen(BACKEND_PORT, BACKEND_HOST, () => {
  console.log(`Your server is running on http://${BACKEND_HOST}:${BACKEND_PORT}`);
});
