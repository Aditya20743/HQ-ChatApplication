import express from "express";
import { login, logout, newUser, searchUser,updateUserStatus } from "../controllers/user.controller.js";
import {
  loginValidator,
  registerValidator,
  validateHandler,
} from "../lib/validators.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { singleAvatar } from "../middlewares/multer.middleware.js";

const app = express.Router();

app.post("/new", singleAvatar, registerValidator(), validateHandler, newUser); // checked without avatar
app.post("/login", loginValidator(), validateHandler, login); 

app.use(isAuthenticated);

app.get("/logout", logout);
app.get("/search", searchUser);
app.patch("/:userId/status", updateUserStatus);

export default app;
