import { defineCollection, z } from 'astro:content';
import { moduleEnum, dailyEntrySchema } from './schemas/daily';
import { quizQuestion } from './schemas/quiz';

const lessons = defineCollection({
  type: 'content', // MDX
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

const daily = defineCollection({ type: 'data', schema: dailyEntrySchema });

const glossary = defineCollection({
  type: 'content',
  schema: z.object({
    term: z.string(),
    aliases: z.array(z.string()).default([]),
    module: moduleEnum.optional(),
  }),
});

export const collections = { lessons, daily, glossary };
