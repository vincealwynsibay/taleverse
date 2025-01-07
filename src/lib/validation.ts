import z from 'zod'

const MAX_FILE_SIZE = 500000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


export const novelSchema = z.object({
    title: z.string().min(3),
    synopsis: z.string(),
    author: z.string(),
    releaseYear: z.string().refine((val) => /^[0-9]{4}$/.test(val), {message: "String should be a year"}),
    image: z.any()
    .refine((files) => files?.length == 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
})

export type NovelPayload = z.infer<typeof novelSchema>