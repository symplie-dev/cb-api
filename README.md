# collaborative-bookmarks-api

Server-side API for collaborative bookmarks.

## Description

Collaborative Bookmarks or CB for short allows users to create and manage
lists of shared bookmarks. CB bookmarks can be shared directly user-to-user or
shared with a group of other users.

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
| `ADMIN_USER`          | The admin username            | _none_      |
| `ADMIN_PASS`          | The admin password            | _none_      |

### Installation

##### Install and run RethinkDB

1. Go to the RethinkDB installation [page][0] and install RethinkDB for your
  platform.
2. Start your local instance of rethink: `rethinkdb` or `rethinkdb.exe` on
  Windows

##### Install cb-api

_Note: This assumes you have node v4.x or higher installed_

1. Clone the repository `git clone git@github.com:symplie-dev/collaborative-bookmarks-api.git`
2. Install NPM dependencies: `npm install`
3. Add the `ADMIN_USER` and `ADMIN_PASS` environment variables
    - Postman tests expect: user: `postman`, pass: `test`
4. Start the API server: `npm start`

### Testing

##### End-to-End

1. Ensure RethinkDB and cb-api server are running (detailed above)
2. Install Postman `https://www.getpostman.com/docs/introduction`
3. Import the Postman test harness located at `tests/postman.json`
4. In Postman go to the newly imported collection and click `run` and then `start`

##### Unit

`TODO`



[0]: https://rethinkdb.com/docs/install/