import supertest from "supertest";
import http from "http";
import { Mongoose } from "mongoose";

import { startApp, connectMongoose } from "./app";
import { Note, User, IUser, INote } from "./models";

let server: http.Server;
let db: Mongoose;

let user1: IUser, user2: IUser;
let note1: INote, note2: INote;

beforeAll(async () => {
  db = await connectMongoose(
    "test-" + Math.random().toString().replace(/\./, "")
  );
  server = startApp();
});

afterAll(async () => {
  await db.connection.close();
  server.close();
});

beforeEach(async () => {
  user1 = await User.create({ email: "a@a.com", password: "password" });
  user2 = await User.create({ email: "b@b.com", password: "password" });

  note1 = await Note.create({
    author: user1._id,
    title: "Test note 1",
    body: "Note body",
    tags: ["note", "test", "1"],
  });

  note2 = await Note.create({
    author: user2._id,
    title: "User 2's test note",
    body: "Note body",
    tags: ["user2"],
  });

  User.createIndexes();
  Note.createIndexes();
});

afterEach(async () => {
  await db.connection.collections["users"]!.drop();
  await db.connection.collections["notes"]!.drop();
});

test("POST /register", async () => {
  await supertest(server)
    .post("/register")
    .send({ email: "email@email.com", password: "password" })
    .expect(200)
    .then((response) => {
      expect(response.get("Authorization")).toBeTruthy();
    });
});

test("POST /login", async () => {
  await supertest(server)
    .post("/login")
    .send({ email: "email@email.com", password: "password" })
    .expect(404);

  await supertest(server)
    .post("/login")
    .send({ email: "a@a.com", password: "password" })
    .expect(200)
    .then((response) => {
      expect(response.get("Authorization")).toBeTruthy();
    });

  await supertest(server)
    .post("/login")
    .send({ email: "b@b.com", password: "wrong-password" })
    .expect(403);
});

test("POST /notes", async () => {
  let accessToken: string;

  await supertest(server)
    .post("/login")
    .send({ email: "a@a.com", password: "password" })
    .expect(200)
    .then((response) => {
      accessToken = response.get("Authorization");
    });

  await supertest(server)
    .post("/notes")
    .set("Authorization", accessToken)
    .send({
      title: "Test note 2",
      body: "Test note 2 body",
      tags: ["test", "note", "2"],
    })
    .expect(200)
    .then((response) => {
      expect(response.body.message).toEqual("Created note");
      expect(response.body.note).toBeTruthy();
    });
});

test("GET /notes", async () => {
  let accessToken: string;

  await supertest(server)
    .post("/login")
    .send({ email: "a@a.com", password: "password" })
    .expect(200)
    .then((response) => {
      accessToken = response.get("Authorization");
    });

  await supertest(server)
    .get("/notes")
    .set("Authorization", accessToken)
    .send()
    .expect(200)
    .then((response) => {
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toEqual(1);
      expect(response.body[0].title).toEqual(note1.title);
      expect(response.body[0].body).toEqual(note1.body);
      expect(response.body[0].tags).toEqual(note1.tags);
    });

  const note2 = await Note.create({
    author: user1._id,
    title: "Test note 2",
    body: "Test note 2 body",
    tags: ["test", "note", "2"],
  });

  await supertest(server)
    .get("/notes")
    .set("Authorization", accessToken)
    .send()
    .expect(200)
    .then((response) => {
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toEqual(2);
      expect(response.body[1].title).toEqual(note2.title);
      expect(response.body[1].body).toEqual(note2.body);
      expect(response.body[1].tags).toEqual(note2.tags);
    });

  await Note.create({
    author: user2._id,
    title: "Test note 3",
    body: "Test note 3 body",
    tags: ["test", "note", "3"],
  });

  await supertest(server)
    .get("/notes")
    .set("Authorization", accessToken)
    .send()
    .expect(200)
    .then((response) => {
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toEqual(2);
    });
});

test("GET /notes/:id", async () => {
  let accessToken: string;

  await supertest(server)
    .post("/login")
    .send({ email: "a@a.com", password: "password" })
    .expect(200)
    .then((response) => {
      accessToken = response.get("Authorization");
    });

  await supertest(server)
    .get(`/notes/1`)
    .set("Authorization", accessToken)
    .send()
    .expect(404);

  await supertest(server)
    .get(`/notes/${note1._id}`)
    .set("Authorization", accessToken)
    .send()
    .expect(200)
    .then((response) => {
      expect(response.body.title).toEqual(note1.title);
      expect(response.body.body).toEqual(note1.body);
      expect(response.body.tags).toEqual(note1.tags);
    });

  await supertest(server)
    .get(`/notes/${note2._id}`)
    .set("Authorization", accessToken)
    .send()
    .expect(404);
});

test("PUT /notes/:id", async () => {
  let accessToken: string;

  await supertest(server)
    .post("/login")
    .send({ email: "a@a.com", password: "password" })
    .expect(200)
    .then((response) => {
      accessToken = response.get("Authorization");
    });

  const updatedTitle = "Updated note title via PUT";

  await supertest(server)
    .put(`/notes/${note1._id}`)
    .set("Authorization", accessToken)
    .send({ title: updatedTitle })
    .expect(200)
    .then((response) => {
      expect(response.body.title).toEqual(updatedTitle);
      expect(response.body.body).toEqual(note1.body);
      expect(response.body.tags).toEqual(note1.tags);
    });

  await supertest(server)
    .put(`/notes/${note2._id}`)
    .set("Authorization", accessToken)
    .send({ title: updatedTitle })
    .expect(404);
});

test("DELETE /notes/:id", async () => {
  let accessToken: string;

  await supertest(server)
    .post("/login")
    .send({ email: "a@a.com", password: "password" })
    .expect(200)
    .then((response) => {
      accessToken = response.get("Authorization");
    });

  await supertest(server)
    .delete(`/notes/${note1._id}`)
    .set("Authorization", accessToken)
    .send()
    .expect(200);

  await supertest(server)
    .get(`/notes/${note1._id}`)
    .set("Authorization", accessToken)
    .send()
    .expect(404);

  await supertest(server)
    .delete(`/notes/${note2._id}`)
    .set("Authorization", accessToken)
    .send()
    .expect(404);
});

test("GET /search", async () => {
  let accessToken: string;

  await supertest(server)
    .post("/login")
    .send({ email: "a@a.com", password: "password" })
    .expect(200)
    .then((response) => {
      accessToken = response.get("Authorization");
    });

  await supertest(server)
    .get("/search?q=Note%20body")
    .set("Authorization", accessToken)
    .send()
    .expect(200)
    .then((response) => {
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toEqual(1);
      expect(response.body[0].title).toEqual(note1.title);
      expect(response.body[0].body).toEqual(note1.body);
      expect(response.body[0].tags).toEqual(note1.tags);
    });

  await supertest(server)
    .get("/search?q=No%20match")
    .set("Authorization", accessToken)
    .send()
    .expect(200)
    .then((response) => {
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toEqual(0);
    });
});
