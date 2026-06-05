import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import cors from "cors";
import routes from "./routes/routes"

const app: Express = express();

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,          
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log("use json");

app.use(
  session({
    secret: "mysecretkey",
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Your server is running on http://localhost:${PORT}`);
});