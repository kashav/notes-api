import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';

import router from './router';

const port = process.env.PORT || 8080;
const mongoURI = process.env.MONGO_URI || `mongodb://127.0.0.1:27017`;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', router);

mongoose.connect(mongoURI).then(() => {
  console.log(`Connected to MongoDB at ${mongoURI}`);
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
