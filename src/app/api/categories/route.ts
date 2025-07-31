import { hasPermission } from "@/lib/permissionsManager";
import { prisma } from "@/lib/prisma";
import { createCategorySchema, updateCategorySchema } from "@/utils/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const permission = hasPermission(user.role || "user", "categories", "create");

    if (permission.error || !permission.hasPermission) {
      return NextResponse.json({ error: permission.error || "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    const validationResult = createCategorySchema.safeParse({ name });

    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation failed", details: validationResult.error.issues }, { status: 400 });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const category = await prisma.category.create({
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const name = searchParams.get("name");

    const take = parseInt(searchParams.get("take") || "10", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const orderBy = searchParams.get("orderBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: any = {};
    if (name) where.name = { contains: name, mode: "insensitive" };

    const categories = await prisma.category.findMany({
      where,
      take,
      skip,
      orderBy: { [orderBy]: order },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            content: true,
          },
          take: 5,
        },
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts", details: error }, { status: 500 });
  }
}
