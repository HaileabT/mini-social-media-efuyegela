import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const publicGetRoutes = ["/posts", "/categories", "/comments"];

export async function middleware(req: NextRequest) {
  if (publicGetRoutes.some((el) => req.url.includes(el)) && req.method === "GET") {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.replace("Bearer ", "");
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));

    if (!payload || !payload.userId || !payload.email) {
      throw new Error("Invalid token");
    }

    const response = NextResponse.next();
    const userId = payload.userId as string;
    response.headers.set("x-user-id", userId);
    return response;
  } catch (error) {
    console.error("ERROR", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/api/posts", "/api/posts/:id", "/api/categories", "/api/categories/:id", "/api/users/promote/:id", "/api/users", "/api/users/:id"],
};
