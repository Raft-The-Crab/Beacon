CREATE UNIQUE INDEX IF NOT EXISTS "User_username_lower_key"
ON "User" (LOWER("username"));