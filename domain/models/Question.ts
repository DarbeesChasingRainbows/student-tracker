import { z } from "zod";

// Question types
export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_false",
  SHORT_ANSWER = "short_answer",
  ESSAY = "essay",
  MATCHING = "matching",
}

// Question difficulty levels
export enum DifficultyLevel {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

// Tags for categorizing questions (for spaced repetition and adaptive learning)
export const QuestionTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

export type QuestionTag = z.infer<typeof QuestionTagSchema>;

// Base schema for all question types
const BaseQuestionSchema = z.object({
  id: z.string().uuid(),
  prompt: z.string().min(1, "Question prompt is required"),
  type: z.nativeEnum(QuestionType),
  difficultyLevel: z.nativeEnum(DifficultyLevel).default(DifficultyLevel.MEDIUM),
  explanation: z.string().optional(),
  tags: z.array(z.string()), // Tag IDs for categorization
  group: z.string().optional(), // Subject or topic group
  createdBy: z.string().uuid(), // Admin/Teacher ID
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Multiple choice question schema
export const MultipleChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal(QuestionType.MULTIPLE_CHOICE),
  options: z.array(z.object({
    id: z.string().uuid(),
    text: z.string().min(1),
    isCorrect: z.boolean().default(false),
  })).min(2, "At least 2 options are required"),
});

// True/False question schema
export const TrueFalseQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal(QuestionType.TRUE_FALSE),
  correctAnswer: z.boolean(),
});

// Short answer question schema
export const ShortAnswerQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal(QuestionType.SHORT_ANSWER),
  correctAnswers: z.array(z.string()).min(1, "At least one correct answer is required"),
  caseSensitive: z.boolean().default(false),
});

// Essay question schema
export const EssayQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal(QuestionType.ESSAY),
  rubric: z.string().optional(),
  wordLimit: z.number().positive().optional(),
});

// Matching question schema
export const MatchingQuestionSchema = BaseQuestionSchema.extend({
  type: z.literal(QuestionType.MATCHING),
  pairs: z.array(z.object({
    id: z.string().uuid(),
    left: z.string().min(1),
    right: z.string().min(1),
  })).min(2, "At least 2 pairs are required"),
});

// Combined question schema using discriminated union
export const QuestionSchema = z.discriminatedUnion("type", [
  MultipleChoiceQuestionSchema,
  TrueFalseQuestionSchema,
  ShortAnswerQuestionSchema,
  EssayQuestionSchema,
  MatchingQuestionSchema,
]);

export type Question = 
  | z.infer<typeof MultipleChoiceQuestionSchema> 
  | z.infer<typeof TrueFalseQuestionSchema> 
  | z.infer<typeof ShortAnswerQuestionSchema> 
  | z.infer<typeof EssayQuestionSchema> 
  | z.infer<typeof MatchingQuestionSchema>;

export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;
export type ShortAnswerQuestion = z.infer<typeof ShortAnswerQuestionSchema>;
export type EssayQuestion = z.infer<typeof EssayQuestionSchema>;
export type MatchingQuestion = z.infer<typeof MatchingQuestionSchema>;

// Factory functions for creating different question types
export const createMultipleChoiceQuestion = (
  prompt: string,
  options: Array<{ text: string; isCorrect: boolean }>,
  difficultyLevel: DifficultyLevel = DifficultyLevel.MEDIUM,
  createdBy: string,
  explanation?: string,
  tags: string[] = [],
  group?: string,
): Omit<MultipleChoiceQuestion, "id" | "createdAt" | "updatedAt"> => {
  return {
    prompt,
    type: QuestionType.MULTIPLE_CHOICE,
    options: options.map((opt) => ({
      id: crypto.randomUUID(),
      text: opt.text,
      isCorrect: opt.isCorrect,
    })),
    difficultyLevel,
    createdBy,
    explanation,
    tags,
    group,
  };
};

export const createTrueFalseQuestion = (
  prompt: string,
  correctAnswer: boolean,
  difficultyLevel: DifficultyLevel = DifficultyLevel.MEDIUM,
  createdBy: string,
  explanation?: string,
  tags: string[] = [],
  group?: string,
): Omit<TrueFalseQuestion, "id" | "createdAt" | "updatedAt"> => {
  return {
    prompt,
    type: QuestionType.TRUE_FALSE,
    correctAnswer,
    difficultyLevel,
    createdBy,
    explanation,
    tags,
    group,
  };
};

export const createShortAnswerQuestion = (
  prompt: string,
  correctAnswers: string[],
  difficultyLevel: DifficultyLevel = DifficultyLevel.MEDIUM,
  createdBy: string,
  caseSensitive: boolean = false,
  explanation?: string,
  tags: string[] = [],
  group?: string,
): Omit<ShortAnswerQuestion, "id" | "createdAt" | "updatedAt"> => {
  return {
    prompt,
    type: QuestionType.SHORT_ANSWER,
    correctAnswers,
    caseSensitive,
    difficultyLevel,
    createdBy,
    explanation,
    tags,
    group,
  };
};

// Generic factory function to create a question based on type
export function createQuestion(
  prompt: string,
  type: QuestionType,
  difficultyLevel: DifficultyLevel = DifficultyLevel.MEDIUM,
  createdBy: string,
  tags: string[] = [],
  group?: string,
): Partial<Question> {
  const baseQuestion = {
    prompt,
    type,
    difficultyLevel,
    createdBy,
    tags,
    group,
  };

  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return {
        ...baseQuestion,
        options: [],
      };
    case QuestionType.TRUE_FALSE:
      return {
        ...baseQuestion,
        correctAnswer: false,
      };
    case QuestionType.SHORT_ANSWER:
      return {
        ...baseQuestion,
        correctAnswers: [],
        caseSensitive: false,
      };
    case QuestionType.ESSAY:
      return {
        ...baseQuestion,
        rubric: "",
        wordLimit: 10,
      };
    case QuestionType.MATCHING:
      return {
        ...baseQuestion,
        pairs: [],
      };
    default:
      return baseQuestion;
  }
}
