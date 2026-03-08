import User from "../models/User.js";
import jwt from "jsonwebtoken";
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      // CRITICAL CHECK: Is the secret actually there?
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing from .env file");
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      res.json({ _id: user._id, email: user.email, token: token });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error); // This prints the error in your terminal
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

export const registerUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ email, password });
    res
      .status(201)
      .json({ message: "User created successfully", _id: user._id });
  } catch (error) {
    console.error(error); // This prints the error in your terminal
    res.status(500).json({ message: "Server error", details: error.message });
  }
};
