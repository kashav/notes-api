import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

const jwtSecretKey = process.env.TOKEN_SECRET || "token-secret";

export function generateAccessToken(email: string): string {
  return jwt.sign(email, jwtSecretKey);
}

export function verifyAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const accessToken = req.header("Access-Token");

  if (!accessToken) {
    res.status(401).json({ message: "Unauthorized" });
    return next(null);
  }

  try {
    const email = jwt.verify(accessToken, jwtSecretKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).authenticatedEmail = email;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
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
