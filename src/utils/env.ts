export const env = {
  databseURL: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/db",
  jwtSecret: process.env.JWT_SECRET || "jwt-super-secret",
};
