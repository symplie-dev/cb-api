# collaborative-bookmarks-api
Server-side api for collaborative bookmarks

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