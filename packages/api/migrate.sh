#!/bin/sh

for file in ./drizzle/*.sql; do
  [ -f "$file" ] || continue
  yarn wrangler d1 execute lastseen --file "$file"
done

