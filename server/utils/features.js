import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";
import OpenAI from "openai";
import dotenv from "dotenv";


const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const connectToMongoDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("Connected to MongoDB");
	} catch (error) {
		console.log("Error connecting to MongoDB", error.message);
	}
};

const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  return res.status(code).cookie("chat-token", token, cookieOptions).json({
    success: true,
    user,
    message,
  });
};

const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
};

const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromises);

    const formattedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));
    return formattedResults;
  } catch (err) {
    throw new Error("Error uploading files to cloudinary", err);
  }
};

const deletFilesFromCloudinary = async (public_ids) => {
  // Delete files from cloudinary
};

const openai = new OpenAI({
  apiKey:process.env.GPT_KEY
});

const getLLMResponse = (prompt) => {
  return new Promise(async (resolve) => {
      try {
          const response = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
              ]
          });
          resolve(JSON.stringify(response.choices[0].message));
      } catch (error) {
          console.error("Error generating response from LLM:", error);
          setTimeout(() => {
              resolve("Recipient is currently unavailable");
          }, 15000);
          
      }
  });
};

export {
  connectToMongoDB,
  sendToken,
  cookieOptions,
  emitEvent,
  deletFilesFromCloudinary,
  uploadFilesToCloudinary,
  getLLMResponse
};