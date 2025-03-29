import { Question, QuestionType, DifficultyLevel } from "../../domain/models/Question.ts";

/**
 * Repository interface for Question entities following the repository pattern
 */
export interface QuestionRepository {
  /**
   * Find a question by its unique identifier
   */
  findById(id: string): Promise<Question | null>;
  
  /**
   * Save a new question or update an existing one
   */
  save(question: Omit<Question, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Question>;
  
  /**
   * Delete a question by its unique identifier
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Find all questions created by a specific admin/teacher
   */
  findByCreator(creatorId: string): Promise<Question[]>;
  
  /**
   * Find questions by type
   */
  findByType(type: QuestionType): Promise<Question[]>;
  
  /**
   * Find questions by difficulty level
   */
  findByDifficultyLevel(level: DifficultyLevel): Promise<Question[]>;
  
  /**
   * Find questions by tag
   */
  findByTag(tagId: string): Promise<Question[]>;
  
  /**
   * Find all questions
   */
  findAll(): Promise<Question[]>;
  
  /**
   * Find questions by multiple tags (for generating adaptive assignments)
   */
  findByTags(tagIds: string[]): Promise<Question[]>;
}
