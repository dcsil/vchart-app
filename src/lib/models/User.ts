import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  username: string;
  password: string;
  role: "admin" | "nurse";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "nurse"],
      default: "nurse",
    },
  },
  { timestamps: true }
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model<IUser>("User", UserSchema, "users");

export default User;
