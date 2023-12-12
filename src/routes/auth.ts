import { Router } from "express";

import { User } from "../models";
import { generateAccessToken, comparePassword } from "../utils";

const router = Router();

// Register a new user.
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    await User.create({ email, password });
    const token = generateAccessToken(email);
    res
      .status(200)
      .header("Authorization", token)
      .json({ message: "User created" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }
    return res.status(500).json(error);
  }
});

// Authenticate an existing user.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(403).json({ message: "Bad password" });
    }

    const token = generateAccessToken(email);
    res.status(200).header("Authorization", token).json({ message: "OK" });
  } catch (error) {
    return res.status(500).json(error);
  }
});

export default router;
