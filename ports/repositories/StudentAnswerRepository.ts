import { StudentAnswer } from "../../domain/models/StudentAnswer.ts";
import { QuestionType } from "../../domain/models/Question.ts";

/**
 * Repository interface for StudentAnswer entities following the repository pattern
 */
export interface StudentAnswerRepository {
  /**
   * Find a student answer by its unique identifier
   */
  findById(id: string): Promise<StudentAnswer | null>;
  
  /**
   * Save a new student answer or update an existing one
   */
  save(studentAnswer: Omit<StudentAnswer, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<StudentAnswer>;
  
  /**
   * Delete a student answer by its unique identifier
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Find all answers for a specific student
   */
  findByStudentId(studentId: string): Promise<StudentAnswer[]>;
  
  /**
   * Find all answers for a specific question
   */
  findByQuestionId(questionId: string): Promise<StudentAnswer[]>;
  
  /**
   * Find all answers for a specific student assignment
   */
  findByStudentAssignmentId(studentAssignmentId: string): Promise<StudentAnswer[]>;
  
  /**
   * Find all incorrect answers for a student
   * (for spaced repetition and adaptive learning)
   */
  findIncorrectByStudentId(studentId: string): Promise<StudentAnswer[]>;
  
  /**
   * Find answers by question type
   */
  findByQuestionType(questionType: QuestionType): Promise<StudentAnswer[]>;
  
  /**
   * Find answers by attempt number
   */
  findByAttemptNumber(attemptNumber: number): Promise<StudentAnswer[]>;
  
  /**
   * Find all incorrect answers for specific question tags
   * (for spaced repetition and adaptive learning)
   */
  findIncorrectByTags(studentId: string, tagIds: string[]): Promise<StudentAnswer[]>;
}
