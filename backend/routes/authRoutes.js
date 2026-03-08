import express from "express";
import { loginUser } from "../controllers/authController.js";

const router = express.Router();

// This matches the POST request from your frontend
// The full path will be: http://localhost:5000/api/auth/login
router.post("/login", loginUser);

// You can easily add a register route here later:
// router.post('/register', registerUser);

export default router;
