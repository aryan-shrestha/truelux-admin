import { z } from "zod";

// The API's upload rules (MAX_IMAGE_BYTES, ALLOWED_IMAGE_FORMATS): checked here for
// immediate feedback, and again by the API.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

export const IMAGE_FILE_SCHEMA = z
  .instanceof(File)
  .refine((file) => IMAGE_TYPES.includes(file.type), "Use a JPEG, PNG or WebP image.")
  .refine((file) => file.size <= MAX_IMAGE_BYTES, "Images must be 5 MB or smaller.");
