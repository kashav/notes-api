import { Document, model, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";
import { comparePassword } from "./utils";

const salt: number = 12;

// User

export interface IUser extends Document {
  email: string;
  password: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

UserSchema.pre(
  "save",
  async function (this: IUser, next: (err?: Error | undefined) => void) {
    if (!this.isModified("password")) {
      return next();
    }

    try {
      const hash = await bcrypt.hash(this.password, salt);
      this.password = hash;
    } catch (error) {
      return next(error);
    }
  }
);

UserSchema.methods.comparePassword = function (
  password: string,
  next: (err: Error | null, same: boolean | null) => void
) {
  comparePassword(password, this.password)
    .then((isMatch: boolean) => next(null, isMatch))
    .catch((err: Error) => next(err, null));
};

export const User = model("User", UserSchema);

// Note

export interface INote extends Document {
  author: Types.ObjectId;
  title: string;
  body: string;
  tags: Array<string>;
}

const NoteSchema = new Schema<INote>({
  author: { type: Schema.ObjectId, required: true, ref: "UserSchema" },
  title: { type: String, required: true },
  body: { type: String, required: true },
  tags: { type: [String], required: true },
});

NoteSchema.index({ "$**": "text" });

export const Note = model("Note", NoteSchema);
