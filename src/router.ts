import { Router } from "express";

import { Note, User } from "./models";
import {
  comparePassword,
  generateAccessToken,
  verifyAccessTokenHeader,
  verifyNoteIdParam,
} from "./utils";

const router = Router();

// create a new user
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
      return res.status(403).json({ message: "Bad password" });
    }

    const token = generateAccessToken(email);
    res.status(200).header("Authorization", token).json({ message: "OK" });
  } catch (error) {
    return res.status(500).json(error);
  }
});

// create a new note for the authenticated user
router.post("/notes", verifyAccessTokenHeader, async (req, res) => {
  const userId = (req as any).authenticatedUserId;
  const { title, body, tags } = req.body;

  try {
    const note = await Note.create({
      author: userId,
      title,
      body,
      tags,
    });

    if (!note) {
      return res.status(500).json({ message: "Couldn't create note" });
    }

    res.status(200).json({ message: "Created note", note: note._id });
  } catch (error) {
    res.status(500).json(error);
  }
});

// retrieve a list of notes for the authenticated user
router.get("/notes", verifyAccessTokenHeader, async (req, res) => {
  const userId = (req as any).authenticatedUserId;

  try {
    const notes = await Note.find({ author: userId }, [
      "title",
      "body",
      "tags",
    ]);
    res.status(200).json(notes || []);
  } catch (error) {
    res.status(500).json(error);
  }
});

// retrieve a single note :id for the authenticated user
router.get(
  "/notes/:id",
  verifyAccessTokenHeader,
  verifyNoteIdParam,
  async (req, res) => {
    const userId = (req as any).authenticatedUserId;
    const noteId = (req as any).parsedNoteId;

    try {
      const note = await Note.findOne({ _id: noteId, author: userId }, [
        "title",
        "body",
        "tags",
      ]);

      if (!note) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      res.status(200).json(note || {});
    } catch (error) {
      res.status(500).json(error);
    }
  }
);

// update a single note :id for the authenticated user
router.put(
  "/notes/:id",
  verifyAccessTokenHeader,
  verifyNoteIdParam,
  async (req, res) => {
    const userId = (req as any).authenticatedUserId;
    const noteId = (req as any).parsedNoteId;
    const { title, body, tags } = req.body;

    try {
      const updatedNote = await Note.findOneAndUpdate(
        { _id: noteId, author: userId },
        { title, body, tags },
        { new: true }
      );

      if (!updatedNote) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      res.status(200).json(updatedNote);
    } catch (error) {
      res.status(500).json(error);
    }
  }
);

// delete a single note :id for the authenticated user
router.delete(
  "/notes/:id",
  verifyAccessTokenHeader,
  verifyNoteIdParam,
  async (req, res) => {
    const userId = (req as any).authenticatedUserId;
    const noteId = (req as any).parsedNoteId;

    try {
      const deletedNote = await Note.findOneAndDelete({
        _id: noteId,
        author: userId,
      });

      if (!deletedNote) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      res.status(200).json({ message: "OK" });
    } catch (error) {
      res.status(500).json(error);
    }
  }
);

// full-text-search the title, body, and tags field of all notes
router.get("/search", verifyAccessTokenHeader, async (req, res) => {
  const userId = (req as any).authenticatedUserId;
  const query = req.query.q as string;
  try {
    const results = await Note.find({ author: userId, $text: { $search: query } }, [
      "_id",
      "title",
      "body",
      "tags",
    ]);
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// todo:
//  - Write unit tests for different components of the application.
//  - Implement integration tests for the API endpoints.

export default router;
