// SpacedRepetitionRepository.ts
export interface SpacedRepetitionItem {
    studentId: string;
    questionId: string;
    easeFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: Date;
    lastReviewDate: Date | null;
  }
  
  export interface SpacedRepetitionRepository {
    /**
     * Get a specific spaced repetition item
     */
    getItem(studentId: string, questionId: string): Promise<SpacedRepetitionItem | null>;
    
    /**
     * Save a spaced repetition item
     */
    saveItem(item: SpacedRepetitionItem): Promise<SpacedRepetitionItem>;
    
    /**
     * Get items due for review
     */
    getDueItems(studentId: string, beforeDate: Date, limit?: number): Promise<SpacedRepetitionItem[]>;
    
    /**
     * Get question IDs that a student has reviewed
     */
    getStudentQuestionIds(studentId: string): Promise<string[]>;
    
    /**
     * Get recently incorrect items for a student
     */
    getRecentlyIncorrectItems(studentId: string, limit?: number): Promise<string[]>;
  }