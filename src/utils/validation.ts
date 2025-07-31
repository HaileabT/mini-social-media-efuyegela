import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().optional(),
  published: z.boolean().optional().default(false),
  category: z.string().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().max(100, "Title too long.").optional(),
  content: z.string().optional(),
  published: z.boolean().optional().default(false),
  category: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
