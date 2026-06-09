import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: 'src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    cover: z.string().optional(),
  }),
});

export const collections = { blog };