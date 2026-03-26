import { z } from "zod";

export const loginSchema = z.object({
  eid: z.string().min(1, "EID is required"),
  password: z.string().min(1, "Password is required"),
});

export const createPostSchema = z.object({
  itemName: z.string().min(1, "Item name is required").max(100),
  categoryPath: z.array(z.string()).min(1, "Category is required"),
  description: z.string().min(1, "Description is required").max(1000),
  dateLost: z.string().min(1, "Date is required"),
  timeLost: z.string().nullable(),
  locationLost: z.string().min(1, "Location is required"),
  contactInfo: z.object({
    useDefault: z.boolean(),
    email: z.string().email("Valid email required").nullable(),
    phone: z.string().nullable(),
  }),
});

export const claimSchema = z.object({
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().min(1, "Phone number is required"),
});

export const rejectSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

export const updateContactSchema = z.object({
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
});

export const updateRoleSchema = z.object({
  role: z.enum(["regular", "admin"]),
});

export const updatePostSchema = z.object({
  itemName: z.string().min(1, "Item name is required").max(100).optional(),
  categoryPath: z.array(z.string()).min(1, "Category is required").optional(),
  description: z.string().min(1, "Description is required").max(1000).optional(),
  dateLost: z.string().min(1, "Date is required").optional(),
  timeLost: z.string().nullable().optional(),
  locationLost: z.string().min(1, "Location is required").optional(),
  photos: z.array(z.string()).optional(),
  contactInfo: z
    .object({
      useDefault: z.boolean(),
      email: z.string().email("Valid email required").nullable(),
      phone: z.string().nullable(),
    })
    .optional(),
});

export const updateProfileSchema = z.object({
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
});
