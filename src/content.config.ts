import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: 'src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    cover: z.string().optional(),
    category: z.string().optional().default('Reflection'),
    description: z.string().optional(),
  }),
});

const categories = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: 'src/content/categories' }),
  schema: z.object({
    name: z.string(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: 'src/content/pages' }),
  schema: z.object({
    title: z.string(),
    cover: z.string().optional(),
  }),
});

export const collections = { blog, pages, categories };
