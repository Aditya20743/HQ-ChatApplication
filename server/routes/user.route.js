import express from "express";
import { login, logout, newUser, searchUser } from "../controllers/user.controller.js";
import {
  loginValidator,
  registerValidator,
  validateHandler,
} from "../lib/validators.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { singleAvatar } from "../middlewares/multer.middleware.js";

const app = express.Router();

app.post("/new", singleAvatar, registerValidator(), validateHandler, newUser);
app.post("/login", loginValidator(), validateHandler, login);

app.use(isAuthenticated);

app.get("/logout", logout);
app.get("/search", searchUser);

export default app;
