import mongoose, { Schema, model } from "mongoose";
import bcrypt  from "bcrypt";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email:{
        type:String,
        required: true,
        unique: true
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        // required: true,
      },
      url: {
        type: String,
        // required: true,
      },
    },
    status:{
        type: String,
        enum: ['Available', 'Busy'],
        default: 'Available',
    }
  },
  {
    timestamps: true,
  }
);

schema.pre('save', async function(next){
    if(this.isModified('password')){
        const salt = await bcrypt.genSalt(3);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to update user status
schema.methods.updateStatus = async function(newStatus) {
    this.status = newStatus;
    await this.save();
};

export const User = mongoose.models.User || model("User", schema);