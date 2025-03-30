// SpacedRepetitionService.ts
import { StudentRepository } from "../../ports/repositories/StudentRepository.ts";
import { QuestionRepository } from "../../ports/repositories/QuestionRepository.ts";
import { SpacedRepetitionRepository } from "../../ports/repositories/SpacedRepetitionRepository.ts";

/**
 * Implements the SM-2 algorithm for spaced repetition
 * Based on principles from "Make It Stick" and Anki's algorithm
 */
export class SpacedRepetitionService {
  constructor(
    private studentRepo: StudentRepository,
    private questionRepo: QuestionRepository,
    private spacedRepRepo: SpacedRepetitionRepository
  ) {}

  /**
   * Initialize a new card for spaced repetition
   */
  async initializeCard(studentId: string, questionId: string): Promise<void> {
    // Default values for a new card
    const now = new Date();
    await this.spacedRepRepo.saveItem({
      studentId,
      questionId,
      easeFactor: 2.5,     // Initial ease factor (standard in SM-2)
      interval: 1,         // 1 day initial interval
      repetitions: 0,      // Number of times reviewed
      nextReviewDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      lastReviewDate: null
    });
  }

  /**
   * Process a review result using SM-2 algorithm
   * @param studentId The student ID
   * @param questionId The question ID
   * @param quality Rating of recall quality (0-5)
   *        0: complete blackout
   *        1: incorrect, but recognized answer
   *        2: incorrect, but answer seemed familiar
   *        3: correct with difficulty
   *        4: correct with some hesitation
   *        5: perfect recall
   */
  async processReview(studentId: string, questionId: string, quality: number): Promise<void> {
    // Get the current spaced repetition data
    const item = await this.spacedRepRepo.getItem(studentId, questionId);
    
    if (!item) {
      // If the item doesn't exist, initialize it
      await this.initializeCard(studentId, questionId);
      return;
    }
    
    // SM-2 algorithm implementation
    const now = new Date();
    let { easeFactor, interval, repetitions } = item;
    
    // Update repetition count
    repetitions++;
    
    // Calculate new ease factor (bounded between 1.3 and 2.5)
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    
    // Determine new interval based on quality
    if (quality < 3) {
      // If recall was difficult, reset repetitions but maintain ease factor
      repetitions = 0;
      interval = 1;
    } else {
      // Calculate new interval based on repetitions
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }
    
    // Implement interleaving from "Make It Stick"
    // Slightly adjust intervals to prevent clustering of reviews
    const randomFactor = 0.95 + Math.random() * 0.1; // 0.95-1.05
    interval = Math.round(interval * randomFactor);
    
    // Calculate the next review date
    const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
    
    // Save the updated item
    await this.spacedRepRepo.saveItem({
      ...item,
      easeFactor,
      interval,
      repetitions,
      nextReviewDate,
      lastReviewDate: now
    });
  }

  /**
   * Get questions due for review
   * @param studentId The student ID
   * @param limit Maximum number of questions to return
   * @param includeNew Whether to include new questions that haven't been reviewed yet
   * @returns Array of question IDs due for review
   */
  async getDueQuestions(studentId: string, limit: number = 20, includeNew: boolean = true): Promise<string[]> {
    const now = new Date();
    
    // Get due questions from the repository
    const dueItems = await this.spacedRepRepo.getDueItems(studentId, now, limit);
    
    const dueQuestionIds = dueItems.map(item => item.questionId);
    
    // If we need to include new questions and haven't reached the limit
    if (includeNew && dueQuestionIds.length < limit) {
      // Get questions the student hasn't seen yet
      const allQuestions = await this.questionRepo.findAll();
      const reviewedQuestionIds = await this.spacedRepRepo.getStudentQuestionIds(studentId);
      
      // Filter to get only new questions
      const newQuestionIds = allQuestions
        .filter(q => !reviewedQuestionIds.includes(q.id))
        .map(q => q.id);
      
      // Randomly select new questions to fill up to the limit
      const remainingSlots = limit - dueQuestionIds.length;
      const selectedNewQuestionIds = this.getRandomItems(newQuestionIds, remainingSlots);
      
      // Combine due and new questions
      return [...dueQuestionIds, ...selectedNewQuestionIds];
    }
    
    return dueQuestionIds;
  }

  /**
   * Generate a practice session based on spaced repetition and interleaving
   * principles from "Make It Stick"
   */
  async generatePracticeSession(studentId: string, sessionSize: number = 20): Promise<any> {
    // Get questions due for review
    const dueQuestionIds = await this.getDueQuestions(studentId, Math.ceil(sessionSize * 0.7), true);
    
    // Get some recently incorrect questions for retrieval practice
    const incorrectQuestionIds = await this.spacedRepRepo.getRecentlyIncorrectItems(
      studentId, 
      Math.ceil(sessionSize * 0.3)
    );
    
    // Combine and shuffle for interleaving
    const combinedIds = [...dueQuestionIds, ...incorrectQuestionIds];
    const uniqueIds = Array.from(new Set(combinedIds)); // Remove duplicates
    const shuffledIds = this.shuffleArray(uniqueIds).slice(0, sessionSize);
    
    // Get full question details
    const questions = await Promise.all(
      shuffledIds.map(id => this.questionRepo.findById(id))
    );
    
    // Filter out any nulls and return the questions
    return questions.filter(q => q !== null);
  }

  // Helper methods
  
  /**
   * Get random items from an array
   */
  private getRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffleArray([...array]);
    return shuffled.slice(0, count);
  }
  
  /**
   * Shuffle an array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}