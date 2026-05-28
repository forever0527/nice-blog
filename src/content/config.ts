import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    desc: z.string(),
    date: z.union([z.string(), z.date()]),
    tag: z.string(),
    color: z.string().default('#0040ff'),
    img: z.string().default('/img/bg/1.webp'),
  }),
});

export const collections = { blog };
