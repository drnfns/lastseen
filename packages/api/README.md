# api

## developing

this project uses yarn.

```sh
yarn                 # install dependencies
yarn wrangler types  # generate types
yarn dev             # start local server
```

## database

migrations live in `migrations/` and are tracked by wrangler.

```sh
yarn migrate:new <name>  # create migrations/NNNN_<name>.sql
yarn migrate:local       # apply to the local dev database
yarn migrate             # apply to the remote database
```

## secrets

```sh
yarn wrangler secret put TOKEN  # admin token for /register-device
```
