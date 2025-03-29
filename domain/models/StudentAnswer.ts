import { z } from "zod";
import { QuestionType } from "./Question.ts";

// Base student answer schema
const BaseStudentAnswerSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  questionId: z.string().uuid(),
  studentAssignmentId: z.string().uuid(),
  isCorrect: z.boolean().optional(), // May be null for essay questions before grading
  attemptNumber: z.number().int().positive().default(1),
  questionType: z.nativeEnum(QuestionType),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Multiple choice answer
export const MultipleChoiceAnswerSchema = BaseStudentAnswerSchema.extend({
  questionType: z.literal(QuestionType.MULTIPLE_CHOICE),
  selectedOptionId: z.string().uuid(),
});

// True/False answer
export const TrueFalseAnswerSchema = BaseStudentAnswerSchema.extend({
  questionType: z.literal(QuestionType.TRUE_FALSE),
  answer: z.boolean(),
});

// Short answer response
export const ShortAnswerResponseSchema = BaseStudentAnswerSchema.extend({
  questionType: z.literal(QuestionType.SHORT_ANSWER),
  answer: z.string(),
});

// Essay response
export const EssayResponseSchema = BaseStudentAnswerSchema.extend({
  questionType: z.literal(QuestionType.ESSAY),
  answer: z.string(),
  feedback: z.string().optional(),
  score: z.number().min(0).optional(), // Essay scoring might be on different scale
});

// Matching response
export const MatchingResponseSchema = BaseStudentAnswerSchema.extend({
  questionType: z.literal(QuestionType.MATCHING),
  matches: z.array(z.object({
    leftId: z.string().uuid(),
    rightId: z.string().uuid(),
  })),
});

// Combined student answer schema using discriminated union
export const StudentAnswerSchema = z.discriminatedUnion("questionType", [
  MultipleChoiceAnswerSchema,
  TrueFalseAnswerSchema,
  ShortAnswerResponseSchema,
  EssayResponseSchema,
  MatchingResponseSchema,
]);

export type StudentAnswer = z.infer<typeof StudentAnswerSchema>;
export type MultipleChoiceAnswer = z.infer<typeof MultipleChoiceAnswerSchema>;
export type TrueFalseAnswer = z.infer<typeof TrueFalseAnswerSchema>;
export type ShortAnswerResponse = z.infer<typeof ShortAnswerResponseSchema>;
export type EssayResponse = z.infer<typeof EssayResponseSchema>;
export type MatchingResponse = z.infer<typeof MatchingResponseSchema>;

// Factory functions for creating student answers
export function createMultipleChoiceAnswer(
  studentId: string,
  questionId: string,
  studentAssignmentId: string,
  selectedOptionId: string,
  isCorrect: boolean,
  attemptNumber: number = 1,
): Omit<MultipleChoiceAnswer, "id" | "createdAt" | "updatedAt"> {
  return {
    studentId,
    questionId,
    studentAssignmentId,
    questionType: QuestionType.MULTIPLE_CHOICE,
    selectedOptionId,
    isCorrect,
    attemptNumber,
  };
}

export function createTrueFalseAnswer(
  studentId: string,
  questionId: string,
  studentAssignmentId: string,
  answer: boolean,
  isCorrect: boolean,
  attemptNumber: number = 1,
): Omit<TrueFalseAnswer, "id" | "createdAt" | "updatedAt"> {
  return {
    studentId,
    questionId,
    studentAssignmentId,
    questionType: QuestionType.TRUE_FALSE,
    answer,
    isCorrect,
    attemptNumber,
  };
}
