# supademo-assignment

### Instructions:

1. Build the Docker containers:

    ```sh
    $ docker-compose build
    ```

1. Start MongoDB via Docker Compose:

    ```sh
    $ docker-compose up -d mongo
    ```

1. Start the API server via Docker Compose:

    ```sh
    $ docker-compose up api
    ```

    Exit with Ctrl-C

1. Cleanup if necessary:

    ```sh
    $ docker-compose down
    ```

### Routes:

- POST `/register` responds with an access token, payload: `{email: string, password: string}`.

- POST `/login` responds with an access token, payload: `{email: string, password: string}`.

- POST `/notes` creates a new note, payload: `{title: string, body: string, tags: string[]}`.

- GET `/notes` lists all notes of the authenticated user.

- GET `/notes/:id` retrieves a single note.

- PUT `/notes/:id` updates a note, payload: `{title: string, body: string, tags: string[]}`.

- DELETE `/notes/:id` deletes a note.

- GET `/search?q=<query>` does a full text search on all notes.

- _All `/notes` routes expect an 'Access-Token` header to be provided._

