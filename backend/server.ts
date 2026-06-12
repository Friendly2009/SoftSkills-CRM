import 'dotenv/config';
import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import cors from "cors";
import routes from "./router.js"

const app: Express = express();

const FRONTEND_PORT = process.env.FRONT_PORT;
const FRONTEND_HOST = process.env.DB_HOST;
app.use(cors({
  origin: `http://${FRONTEND_HOST}:${FRONTEND_PORT}`, 
  credentials: true,          
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecretkey",
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildPath = path.join(__dirname, "..", "frontend");
app.use(express.static(buildPath));

const BACKEND_PORT = process.env.PORT;
const BACKEND_HOST = process.env.DB_HOST;
app.listen(BACKEND_PORT, () => {
  console.log(`Your server is running on http://${BACKEND_HOST}:${BACKEND_PORT}`);
});