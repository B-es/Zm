import { z } from "zod";

export const emailSchema = z.string().email("Неверный формат email");
export const passwordSchema = z.string().min(6, "Минимум 6 символов");
export const nicknameSchema = z.string().min(2).max(50);

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nickname: nicknameSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const roomSchema = z.object({
  name: z.string().min(1).max(100),
  password: z.string().min(4).max(50),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
