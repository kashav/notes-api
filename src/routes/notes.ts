import { Router } from "express";
import { Note } from "../models";
import { verifyAccessTokenHeader, verifyNoteIdParam } from "../utils";

const router = Router();

// Create a new note for the authenticated user.
router.post("/", verifyAccessTokenHeader, async (req, res) => {
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

// Retrieve a list of notes for the authenticated user.
router.get("/", verifyAccessTokenHeader, async (req, res) => {
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

// Execute full-text search for the authenticated user using the ?q parameter.
router.get("/search", verifyAccessTokenHeader, async (req, res) => {
  const userId = (req as any).authenticatedUserId;
  const query = req.query.q as string;
  try {
    const results = await Note.find(
      { author: userId, $text: { $search: query } },
      ["_id", "title", "body", "tags"]
    );
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// Retrieve a single note for the authenticated user.
router.get(
  "/:id",
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

// Update a single note for the authenticated user.
router.put(
  "/:id",
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

// Delete a single note for the authenticated user.
router.delete(
  "/:id",
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

export default router;
