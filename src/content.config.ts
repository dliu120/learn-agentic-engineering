import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';
import { moduleEnum, dailyEntrySchema } from './content/schemas/daily';
import { quizQuestion } from './content/schemas/quiz';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    moduleId: moduleEnum,
    lessonId: z.string(),
    title: z.string(),
    order: z.number(),
    topicNumbers: z.array(z.number()), // which of the 22 topics this lesson surfaces
    objectives: z.array(z.string()),
    hasAudio: z.boolean().default(true),
    narration: z.string().optional(), // core-concept script for edge-tts (build-time)
    visualizations: z.array(z.object({ title: z.string(), summary: z.string() })).default([]),
    quiz: z.array(quizQuestion).default([]),
    isModuleGate: z.boolean().default(false),
  }),
});

const daily = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/daily' }),
  schema: dailyEntrySchema,
});

const glossary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/glossary' }),
  schema: z.object({
    term: z.string(),
    aliases: z.array(z.string()).default([]),
    module: moduleEnum.optional(),
  }),
});

export const collections = { lessons, daily, glossary };
