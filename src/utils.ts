import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { Types } from 'mongoose';
import { User } from "./models";

const jwtSecretKey = process.env.TOKEN_SECRET || "token-secret";

export function generateAccessToken(email: string): string {
  return jwt.sign(email, jwtSecretKey);
}

export async function verifyAccessTokenHeader(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const accessToken = req.header("Access-Token");

  if (!accessToken) {
    res.status(401).json({ message: "Unauthorized" });
    return next(null);
  }

  try {
    const email = jwt.verify(accessToken, jwtSecretKey);

    const user = await User.findOne({email});
    if (!user) {
        res.status(401).json({ message: 'Unauthorized'});
        return next(null);
    }

    (req as any).authenticatedUserId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return next(error);
  }
}

export function verifyNoteIdParam(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id = req.params.id;
  if (!id) {
    res.status(404).json({ message: "Note not found" });
    return next(null);
  }

  try {
    (req as any).parsedNoteId = new Types.ObjectId(id);
    next();
  } catch (error) {
    res.status(404).json({ message: "Note not found" });
    return next(error);
  }
}

export function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, function (err, isMatch) {
      if (err) reject(err);
      resolve(isMatch);
    });
  });
}
