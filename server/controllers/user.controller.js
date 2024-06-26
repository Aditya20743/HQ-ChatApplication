import { compare } from "bcrypt";
import { TryCatch } from "../middlewares/error.middleware.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import {
  cookieOptions,
  sendToken,
  uploadFilesToCloudinary,
} from "../utils/features.js";

import { ErrorHandler } from "../utils/utility.js";

// Create a new user and save it to the database and save token in cookie
const newUser = TryCatch(async (req, res, next) => {
  const { email, name, username, password } = req.body;

//   const file = req.file;

//   if (!file) return next(new ErrorHandler("Please Upload Avatar"));

//   const result = await uploadFilesToCloudinary([file]);

//   const avatar = {
//     public_id: result[0].public_id,
//     url: result[0].url,
//   };

  const user = await User.create({
    email,
    name,
    username,
    password,
    // avatar,
  });

  sendToken(res, user, 201, "User created");
});

// Login user and save token in cookie
const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select("+password");

  if (!user) return next(new ErrorHandler("Invalid Username or Password", 404));

  const isMatch = await compare(password, user.password);

  if (!isMatch)
    return next(new ErrorHandler("Invalid Username or Password", 404));

  sendToken(res, user, 200, `Welcome Back, ${user.name}`);
});


const logout = TryCatch(async (req, res) => {
  return res
    .status(200)
    .cookie("chat-token", "", { ...cookieOptions, maxAge: 0 })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

const searchUser = TryCatch(async (req, res) => {
  const { name = "" } = req.query;

  // Finding All my chats
  const myChats = await Chat.find({ members: req.user });

  //  extracting All Users from my chats means friends or people I have chatted with
  const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);

  // Finding all users except me and my friends
  const allUsersExceptMeAndFriends = await User.find({
    _id: { $nin: allUsersFromMyChats },
    name: { $regex: name, $options: "i" },
  });

  // Modifying the response
  const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));

  return res.status(200).json({
    success: true,
    users,
  });
});

// Controller to update user status
const updateUserStatus = TryCatch(async (req, res, next) => {
    const { userId } = req.params; 
    const { newStatus } = req.body;
    // console.log(req.params);
    // console.log(req.body);
    
    if (!userId || !newStatus) {
      return next(new ErrorHandler("User ID and new status are required", 400));
    }
  
    // Validate new status
    if (!['Available', 'Busy'].includes(newStatus)) {
      return next(new ErrorHandler("Invalid status. Must be 'Available' or 'Busy'", 400));
    }
  
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
  
      // Update user status
      user.status = newStatus;
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "User status updated successfully",
        user: {
          _id: user._id,
          name: user.name,
          status: user.status,
        },
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
});

const getUserStatus = async (userId) => {
    try {
      // Find the user by their ID
      const user = await User.findById(userId);
      
      // If user not found, return 'BUSY' status
      if (!user) {
        return 'BUSY';
      }

      return user.status;
    } catch (error) {
      console.error("Error while getting user status:", error);
      return 'BUSY'; 
    }
  };

export {
  login,
  logout,
  newUser,
  searchUser,
  updateUserStatus,
  getUserStatus
};