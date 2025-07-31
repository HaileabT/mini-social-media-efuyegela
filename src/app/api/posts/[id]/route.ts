import { prisma } from "@/lib/prisma";
import { updatePostSchema } from "@/utils/validation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let { id: idString } = await params;
    const id = parseInt(idString);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const where: any = {};
    if (id) where.id = { contains: id, mode: "insensitive" };

    const post = await prisma.post.findUnique({
      where,
      include: {
        comments: {
          select: {
            id: true,
            content: true,
          },
          take: 10,
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch posts", details: error }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();

    let { id: idString } = await params;
    const id = parseInt(idString);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const validationResult = updatePostSchema.safeParse(body);
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

    const oldPost = await prisma.post.findUnique({ where: { id } });
    if (!oldPost) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    if (userId !== oldPost.authorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        published: published ?? false,
        authorId: userId,
        categoryId: categoryId!,
      },
    });
    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post", details: error }, { status: 500 });
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
    const oldPost = await prisma.post.findUnique({ where: { id } });
    if (!oldPost) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    if (userId !== oldPost.authorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await prisma.post.delete({ where: { id } });
    return NextResponse.json({ status: "successful" }, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post", details: error }, { status: 500 });
  }
}
