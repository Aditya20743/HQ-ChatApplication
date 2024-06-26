import express from "express";
import { connectToMongoDB } from "./utils/features.js";
import dotenv from "dotenv";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import { v4 as uuid } from "uuid";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  ONLINE_USERS,
  START_TYPING,
  STOP_TYPING,
} from "./constants/events.js";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.model.js";
import { corsOptions } from "./constants/config.js";
import { socketAuthenticator } from "./middlewares/auth.middleware.js";

import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";

import { getUserStatus } from "./controllers/user.controller.js";
import { getLLMResponse } from "./utils/features.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000;
const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
const userSocketIDs = new Map();
const onlineUsers = new Set();

connectToMongoDB();

// createUser(10);
// createSingleChats(10);
// createMessages(10);
// createMessagesInAChat('6631e6a4022aa5afdd44e0c9',10);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

// Using Middlewares Here
app.use(express.json());
app.use(cookieParser());
// app.use(cors(corsOptions));
app.use(cors())

app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);

app.get("/", (req, res) => {
  res.send("Hello World");
});

io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticator(err, socket, next)
  );
});

io.on("connection", (socket) => {
    const user = socket.user;
    userSocketIDs.set(user._id.toString(), socket.id);
    onlineUsers.add(user._id.toString());
  
    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
      const recipientId = members.find(member => member !== user._id.toString());
      const recipientSocketId = userSocketIDs.get(recipientId);
  
      if (!recipientSocketId) {
        // Recipient is not online
        socket.emit(NEW_MESSAGE, { chatId, message: "Recipient is currently offline" });
        return;
      }
  
      const recipientStatus = await getUserStatus(recipientId); 
      // console.log(recipientStatus);
      
      const messageForRealTime = {
        content: message,
        _id: uuid(),
        sender: {
          _id: user._id,
          name: user.name,
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };
  
      const messageForDB = {
        content: message,
        sender: user._id,
        chat: chatId,
      };
  
      const membersSocket = getSockets(members);
      io.to(membersSocket).emit(NEW_MESSAGE, {
        chatId,
        message: messageForRealTime,
      });
      io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });
  
      if (recipientStatus === 'Busy') {
        // console.log("working");
        // Recipient is busy, generate response from language model API
        let response = "";
  
        try {
            response = await Promise.race([
                getLLMResponse(message), // Call the language model API
                new Promise((resolve) => {
                    // Create a timeout that resolves after 10 seconds
                    setTimeout(() => {
                        resolve("Recipient is currently unavailable");
                    }, 10000); // 10 seconds timeout
                })
            ]);
        } catch (error) {
            console.error("Error generating response from LLM:", error);
            response = "Recipient is currently unavailable";
        }
        // console.log(response);
        // Emit the response to the sender
        const messageForRealTime = {
          content: response,
          _id: uuid(),
          sender: {
            _id: recipientId,
            name: "Generated",
          },
          chat: chatId,
          createdAt: new Date().toISOString(),
        };
  
        const membersSocket = getSockets(members);
        io.to(membersSocket).emit(NEW_MESSAGE, {
          chatId,
          message: messageForRealTime,
        });
        io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });
        // return;
      }
  
      try {
        await Message.create(messageForDB);
      } catch (error) {
        throw new Error(error);
      }
    });
  
    socket.on(START_TYPING, ({ members, chatId }) => {
      const membersSockets = getSockets(members);
      socket.to(membersSockets).emit(START_TYPING, { chatId });
    });
  
    socket.on(STOP_TYPING, ({ members, chatId }) => {
      const membersSockets = getSockets(members);
      socket.to(membersSockets).emit(STOP_TYPING, { chatId });
    });

    socket.on("disconnect", () => {
      userSocketIDs.delete(user._id.toString());
      onlineUsers.delete(user._id.toString());
      socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
    });
  });

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`Server is running on port ${port} in ${envMode} Mode`);
});

export { envMode, userSocketIDs };