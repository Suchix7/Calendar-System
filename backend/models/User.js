import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// --- Updated Middleware in models/User.js ---
userSchema.pre("save", async function () {
  // 1. Only hash if password is new or modified
  if (!this.isModified("password")) {
    return; // Just return, don't call next()
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // In async middleware, simply finishing the function acts as 'next()'
  } catch (error) {
    throw error; // Mongoose will catch this and pass it to your controller
  }
});

// Helper to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
