import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';

import router from './router';

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || `mongodb://127.0.0.1:27017`;
const DB_NAME = process.env.DB_NAME || 'app';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', router);

export const startApp = () => {
  return app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}`);
  });
}

export const connectMongoose = async (dbName: string) => {
  const mongoURI = `${MONGO_URI}/${dbName}`;
  const db = await mongoose.connect(mongoURI);
  console.log(`Connected to MongoDB at ${mongoURI}`);
  return db;
}

if (process.env.NODE_ENV !== "test") {
  connectMongoose(DB_NAME);
  startApp();
}
