import z from 'zod'

export const novelSchema = z.object({
    title: z.string().min(3),
    synopsis: z.string(),
    author: z.string(),
    releaseYear: z.string().refine((val) => /^[0-9]{4}$/.test(val), {message: "String should be a year"}),
})

export type NovelPayload = z.infer<typeof novelSchema>