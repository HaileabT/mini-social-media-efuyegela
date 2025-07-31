import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPostSchema, updatePostSchema } from "../../../utils/validation";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const published = searchParams.get("published");
    const authorId = searchParams.get("authorId");

    const take = parseInt(searchParams.get("take") || "10", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const orderBy = searchParams.get("orderBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const where: any = {};
    if (published !== null) where.published = published === "true";
    if (authorId) where.authorId = Number(authorId);
    if (search) where.title = { contains: search, mode: "insensitive" };
    if (category) where.category = category;

    const posts = await prisma.post.findMany({
      where,
      take,
      skip,
      orderBy: { [orderBy]: order },
      include: {
        author: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts", details: error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = createPostSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { title, content, published, category } = validationResult.data;

    let categoryId = undefined;
    let cat = undefined;
    if (category) {
      cat = await prisma.category.findUnique({ where: { name: category } });

      if (!cat) {
        cat = (await prisma.category.findUnique({ where: { name: "General" } })) || { id: 1, name: "General" };
      }
      categoryId = cat.id;
    }
    const userId = parseInt(req.headers.get("x-user-id") || "");
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published: published ?? false,
        authorId: userId,
        categoryId: categoryId!,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        comments: true,
        categoryRel: true,
      },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post", details: error }, { status: 500 });
  }
}
