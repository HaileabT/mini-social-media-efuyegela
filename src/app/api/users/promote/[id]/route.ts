import { hasPermission } from "@/lib/permissionsManager";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let { id: idString } = await params;
    const id = parseInt(idString);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const userId = parseInt(req.headers.get("x-user-id") || "");
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const reqUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!reqUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permission = hasPermission(reqUser.role, "users", "promote");
    if (!permission.hasPermission || permission.error) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        role: "admin",
      },
    });
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user", details: error }, { status: 500 });
  }
}
