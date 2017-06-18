# collaborative-bookmarks-api

Server-side API for collaborative bookmarks.

## Description

Collaborative Bookmarks or CB for short allows users to create and manage lists of shared
bookmarks. CB bookmarks can be shared directly user-to-user or shared with a group of other users.

### Environment Variables

| name                  | Description                   | Default     |
|:----------------------|:------------------------------|:------------|
| `PORT`                | Port that Express listens on  | `3000`      |
| `NODE_ENV`            | The environment name          | `test`      |
| `DB_NAME`             | The database name             | `cb_test`   |
| `DB_HOST`             | The database server host      | `localhost` |
| `DB_PORT`             | The database port             | `28015`     |
| `DB_KEY`              | The database TLS key          | _none_      |
| `DB_CERT`             | The database TLS cert         | _none_      |
| `OAUTH_CLIENT_ID`     | The oauth client id           | _none_      |
| `OAUTH_CLIENT_SECRET` | The oauth secret key          | _none_      |
| `NODE_LOG_LEVEL`      | Verbosity level for node logs | `verbose`   |
| `HTTP_LOG_LEVEL`      | Verbosity level for http logs | `verbose`   |
| `ADMIN_USER`          | The admin username            | `postman`   |
| `ADMIN_PASS`          | The admin password            | `test`      |

### Installation

##### Install and run RethinkDB

1. Go to the RethinkDB installation [page][0] and install RethinkDB for your platform.
2. Start your local instance of rethink: `rethinkdb` or `rethinkdb.exe` on Windows

##### Install cb-api

_Note: This assumes you have node v4.x or higher installed_

1. Clone the repository `git clone git@github.com:symplie-dev/collaborative-bookmarks-api.git`
2. Install NPM dependencies: `npm install`
3. Start the API server: `npm start`

### Testing

##### End-to-End

1. Ensure RethinkDB and the cb-api server are running (detailed above)
2. Install Postman `https://www.getpostman.com/docs/introduction`
3. Import the Postman test harness located at `tests/postman.json`
4. In Postman go to the newly imported collection and click `run` and then `start`

##### Unit

`TODO`

---

## API Documentation

The CB API follows a nested RESTful pattern where the context for most calls is the `user` entitiy.
Currently the CB API only supports JSON data formatting.

### Users

* `POST` `/api/users` -- Create a new user.

**Request Headers**

| Property Name   | Description                                             |
|:----------------|:--------------------------------------------------------|
| `Authorization` | `Bearer <Chrome Identity Token>` OR `Basic <user/pass>` |
| `Content-Type`  | `application/json`                                      |

**Request Body**

| Property Name   | Type     | Description                             |
|:----------------|:---------|:----------------------------------------|
| `username`      | `String` | The username for the user to be created |

**Query Params**

`N/A`

**Response Body**

| Property Name              | Type     | Description                                                   |
|:---------------------------|:---------|:--------------------------------------------------------------|
| `status`                   | `Number` | The HTTP return status code                                   |
| `data`                     | `Object` | The newly created user                                        |
| `data.username`            | `String` | The username                                                  |
| `data.id`                  | `String` | The unique ID of the user                                     |
| `data.numFriends`          | `Number` | The number of friends a user has                              |
| `data.numGroupsCreated`    | `Number` | The number of groups the user has created                     |
| `data.numMemberships`      | `Number` | The number of groups the user is a member of                  |
| `data.numBookmarksCreated` | `Number` | The number of bookmarks a user has created                    |
| `data.createdAt`           | `String` | The ISO date string when the user was created                 |

* `GET` `/api/users` -- Get a list of users that match the given query params. The query parameters
  are required and must be at least three characters long to prevent returning too many results.

**Request Headers**

| Property Name   | Description                                             |
|:----------------|:--------------------------------------------------------|
| `Authorization` | `Bearer <Chrome Identity Token>` OR `Basic <user/pass>` |
| `Content-Type`  | `application/json`                                      |

**Request Body**

`N/A`

**Query Params**

| Property Name   | Description                                      |
|:----------------|:-------------------------------------------------|
| `username`      | Used to search by username; ses prefix matching. |
| `sub`           | Search by sub (full match only)                  |

**Response Body**

| Property Name                 | Type     | Description                                                   |
|:------------------------------|:---------|:--------------------------------------------------------------|
| `status`                      | `Number` | The HTTP return status code                                   |
| `data`                        | `Array`  | An array of the matching results                              |
| `data[i].username`            | `String` | The username                                                  |
| `data[i].id`                  | `String` | The unique ID of the user                                     |
| `data[i].numFriends`          | `Number` | The number of friends a user has                              |
| `data[i].numGroupsCreated`    | `Number` | The number of groups the user has created                     |
| `data[i].numMemberships`      | `Number` | The number of groups the user is a member of                  |
| `data[i].numBookmarksCreated` | `Number` | The number of bookmarks a user has created                    |
| `data[i].createdAt`           | `String` | The ISO date string when the user was created                 |

* `GET` `/api/users/:userId` --  Get a specific user

**Request Headers**

| Property Name   | Description                                             |
|:----------------|:--------------------------------------------------------|
| `Authorization` | `Bearer <Chrome Identity Token>` OR `Basic <user/pass>` |
| `Content-Type`  | `application/json`                                      |

**Request Body**

`N/A`

**Query Params**

`N/A`

**Response Body**

| Property Name              | Type     | Description                                   |
|:---------------------------|:---------|:----------------------------------------------|
| `status`                   | `Number` | The HTTP return status code                   |
| `data`                     | `Object` | The user                                      |
| `data.username`            | `String` | The username                                  |
| `data.id`                  | `String` | The unique ID of the user                     |
| `data.numFriends`          | `Number` | The number of friends a user has              |
| `data.numGroupsCreated`    | `Number` | The number of groups the user has created     |
| `data.numMemberships`      | `Number` | The number of groups the user is a member of  |
| `data.numBookmarksCreated` | `Number` | The number of bookmarks a user has created    |
| `data.createdAt`           | `String` | The ISO date string when the user was created |



[0]: https://rethinkdb.com/docs/install/