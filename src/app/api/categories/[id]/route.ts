import { hasPermission } from "@/lib/permissionsManager";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/utils/validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let { id: idString } = await params;
    const id = parseInt(idString);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const where: any = {};
    where.id = id;

    const category = await prisma.category.findUnique({
      where,
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            content: true,
          },
          take: 10,
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts", details: error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let { id: idString } = await params;
    const id = parseInt(idString);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const userId = req.headers.get("x-user-id");

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const permission = hasPermission(user.role || "user", "categories", "update");

    if (permission.error || !permission.hasPermission) {
      return NextResponse.json({ error: permission.error || "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validationResult = updateCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation failed", details: validationResult.error.issues }, { status: 400 });
    }

    const { name } = validationResult.data;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      return NextResponse.json({ error: "Category does not exist" }, { status: 404 });
    }

    const anotherCategory = await prisma.category.findUnique({
      where: { name },
    });
    if (anotherCategory) {
      return NextResponse.json({ error: "Category with that name already exists" }, { status: 409 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid Request Body" }, { status: 400 });
    }
    console.error("Error creating category", error);
    return NextResponse.json({ error: "Failed to create category", details: error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let { id: idString } = await params;
    const id = parseInt(idString);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const userId = req.headers.get("x-user-id");

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const permission = hasPermission(user.role || "user", "categories", "delete");

    if (permission.error || !permission.hasPermission) {
      return NextResponse.json({ error: permission.error || "Forbidden" }, { status: 403 });
    }

    const result = await prisma.category.delete({
      where: { id },
    });
    return NextResponse.json({ status: "successful" }, { status: 204 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid Request Body" }, { status: 400 });
    }
    console.error("Error creating category", error);
    return NextResponse.json({ error: "Failed to create category", details: error }, { status: 500 });
  }
}
