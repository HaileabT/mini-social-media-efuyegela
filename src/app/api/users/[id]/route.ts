import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/permissionsManager";
import { prisma } from "@/lib/prisma";

prisma;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { posts: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user", details: error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await req.json();
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

    const permission = hasPermission(reqUser.role, "users", "delete");
    if (!permission.hasPermission || permission.error) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (reqUser.role !== "admin" && id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        name: data.name,
      },
    });
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user", details: error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permission = hasPermission(user.role, "users", "delete");
    if (!permission.hasPermission || permission.error) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role !== "admin" && id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted" }, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user", details: error }, { status: 500 });
  }
}
