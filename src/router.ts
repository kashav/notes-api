import { Router } from "express";

import { Note, User } from "./models";
import {
  comparePassword,
  generateAccessToken,
  verifyAccessToken,
} from "./utils";
import { Types } from "mongoose";

const router = Router();

router.get("/", async (req, res) => {
  res.status(200).json({ message: "hello world" });
});

// create a new user
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    await User.create({ email, password });
    const token = generateAccessToken(email);
    res.status(200).json({ message: "User created", token });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }
    return res.status(500).json(error);
  }
});

// authenticate an existing user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = generateAccessToken(email);
    res.status(200).json({ message: "OK", token });
  } catch (error) {
    return res.status(500).json(error);
  }
});

// // create a new note for the authenticated user
router.post("/notes", verifyAccessToken, async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const email = (req as any).authenticatedEmail;
  const user = await User.findOne({ email });

  const { title, body, tags } = req.body;

  try {
    const note = await Note.create({
      author: user._id,
      title,
      body,
      tags,
    });

    if (!note) {
      return res.status(500).json({ message: "Couldn't create note" });
    }

    res.status(200).json({ message: "OK", note: note._id });
  } catch (error) {
    res.status(500).json(error);
  }
});

// retrieve a list of notes for the authenticated user
router.get("/notes", verifyAccessToken, async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const email = (req as any).authenticatedEmail;
  const user = await User.findOne({ email });

  try {
    const notes = await Note.find({ author: user._id }, [
      "title",
      "body",
      "tags",
    ]);
    res.status(200).json(notes || []);
  } catch (error) {
    res.status(500).json(error);
  }
});

// // retrieve a single note :id for the authenticated user
router.get("/notes/:id", verifyAccessToken, async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const email = (req as any).authenticatedEmail;
  const user = await User.findOne({ email });

  const noteId = new Types.ObjectId(req.params.id);

  try {
    const note = await Note.findOne({ _id: noteId, author: user._id }, [
      "title",
      "body",
      "tags",
    ]);
    res.status(200).json(note || {});
  } catch (error) {
    res.status(500).json(error);
  }
});

// // update a single note :id for the authenticated user
router.put("/notes/:id", verifyAccessToken, async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const email = (req as any).authenticatedEmail;
  const user = await User.findOne({ email });

  const noteId = new Types.ObjectId(req.params.id);
  const { title, body, tags } = req.body;

  try {
    const updatedNote = await Note.findOneAndUpdate(
      { _id: noteId, author: user._id },
      { title, body, tags },
      { new: true }
    );
    if (!updatedNote) {
      res.status(500).json({ message: "Failed to update note" });
      return;
    }

    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json(error);
  }
});

// // delete a single note :id for the authenticated user
router.delete("/notes/:id", verifyAccessToken, async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const email = (req as any).authenticatedEmail;
  const user = await User.findOne({ email });

  const noteId = new Types.ObjectId(req.params.id);

  try {
    const deletedNote = await Note.findOneAndDelete({
      _id: noteId,
      author: user._id,
    });
    if (!deletedNote) {
      res.status(500).json({ message: "Failed to delete note" });
      return;
    }
    res.status(200).json({ message: "OK" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// todo:
//  - Add full-text search functionality to find notes by title, body, or tags.
//  - Write unit tests for different components of the application.

export default router;
