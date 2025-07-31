import { env } from "@/utils/env";
import jwt, { JwtPayload } from "jsonwebtoken";

type JwtCustomPayload = JwtPayload & {
  userId: string;
  email: string;
};

export const extractJWTPayload = <T extends JwtPayload = JwtCustomPayload>(token: string) => {
  const payload = jwt.verify(token, env.jwtSecret) as T;

  return payload;
};
