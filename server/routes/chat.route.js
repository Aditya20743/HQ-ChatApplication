import express from "express";
import {
  getChatDetails,
  getMessages,
  sendAttachments,
} from "../controllers/chat.controller.js";
import {
  chatIdValidator,
  sendAttachmentsValidator,
  validateHandler,
} from "../lib/validators.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { attachmentsMulter } from "../middlewares/multer.middleware.js";

const app = express.Router();

// After here user must be logged in to access the routes

app.use(isAuthenticated);

// Send Attachments
app.post(
  "/message",
  attachmentsMulter,
  sendAttachmentsValidator(),
  validateHandler,
  sendAttachments
);   // remaining

// Get Messages
app.get("/message/:id", chatIdValidator(), validateHandler, getMessages);

// Get Chat Details
app.get("/:id", chatIdValidator(), validateHandler, getChatDetails);

export default app;
