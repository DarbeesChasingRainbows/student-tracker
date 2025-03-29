import { Question, QuestionType, DifficultyLevel } from "../../domain/models/Question.ts";
import { StudentAnswer as _StudentAnswer } from "../../domain/models/StudentAnswer.ts";
import { QuestionRepository } from "../../ports/repositories/QuestionRepository.ts";
import { StudentAnswerRepository } from "../../ports/repositories/StudentAnswerRepository.ts";

/**
 * Service for handling question-related business logic
 */
export class QuestionService {
  constructor(
    private questionRepo: QuestionRepository,
    private studentAnswerRepo: StudentAnswerRepository,
  ) {}

  /**
   * Create a new question
   */
  async createQuestion(question: Omit<Question, "id" | "createdAt" | "updatedAt">): Promise<Question> {
    return await this.questionRepo.save(question);
  }

  /**
   * Get a question by ID
   */
  async getQuestionById(id: string): Promise<Question | null> {
    return await this.questionRepo.findById(id);
  }

  /**
   * Get all questions created by a specific admin/teacher
   */
  async getQuestionsByCreator(creatorId: string): Promise<Question[]> {
    return await this.questionRepo.findByCreator(creatorId);
  }

  /**
   * Get questions by type
   */
  async getQuestionsByType(type: QuestionType): Promise<Question[]> {
    return await this.questionRepo.findByType(type);
  }

  /**
   * Get questions by difficulty level
   */
  async getQuestionsByDifficultyLevel(level: DifficultyLevel): Promise<Question[]> {
    return await this.questionRepo.findByDifficultyLevel(level);
  }

  /**
   * Get questions by tag
   */
  async getQuestionsByTag(tagId: string): Promise<Question[]> {
    return await this.questionRepo.findByTag(tagId);
  }

  /**
   * Get all questions
   */
  async getAllQuestions(): Promise<Question[]> {
    return await this.questionRepo.findAll();
  }

  /**
   * Delete a question
   */
  async deleteQuestion(id: string): Promise<boolean> {
    return await this.questionRepo.delete(id);
  }

  /**
   * Update a question
   */
  async updateQuestion(
    id: string, 
    questionData: Partial<Omit<Question, "id" | "createdAt" | "updatedAt">>
  ): Promise<Question | null> {
    const question = await this.questionRepo.findById(id);
    if (!question) {
      return null;
    }

    const updatedQuestion = {
      ...question,
      ...questionData,
      updatedAt: new Date(),
    };

    return await this.questionRepo.save(updatedQuestion);
  }

  /**
   * Get frequently missed questions for a student
   * (for spaced repetition and adaptive learning)
   */
  async getFrequentlyMissedQuestions(studentId: string): Promise<Question[]> {
    const incorrectAnswers = await this.studentAnswerRepo.findIncorrectByStudentId(studentId);
    
    // Count question occurrences and sort by most frequently missed
    const questionCounts = incorrectAnswers.reduce((acc, answer) => {
      acc[answer.questionId] = (acc[answer.questionId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sortedQuestionIds = Object.entries(questionCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([id]) => id);
    
    // Get the questions for the sorted IDs
    const questions = await Promise.all(
      sortedQuestionIds.map(id => this.questionRepo.findById(id))
    );
    
    return questions.filter((q): q is Question => q !== null);
  }

  /**
   * Generate a practice quiz based on a student's performance
   * Implements spaced repetition based on the principles from "Make It Stick"
   */
  async generatePracticeQuiz(
    studentId: string, 
    questionCount: number = 10
  ): Promise<string[]> {
    // 1. Get frequently missed questions
    const missedQuestions = await this.getFrequentlyMissedQuestions(studentId);
    
    // Get the tags from these questions to find related questions
    const tags = missedQuestions.flatMap(q => q.tags);
    
    // 2. Get related questions based on tags
    const relatedQuestions = await this.questionRepo.findByTags(tags);
    
    // 3. Filter out questions the student has already answered correctly multiple times
    const allStudentAnswers = await this.studentAnswerRepo.findByStudentId(studentId);
    
    // Count correct answers per question
    const correctAnswerCounts = allStudentAnswers.reduce((acc, answer) => {
      if (answer.isCorrect) {
        acc[answer.questionId] = (acc[answer.questionId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Filter out questions with 3+ correct answers (mastered)
    const candidateQuestions = relatedQuestions.filter(
      q => !(correctAnswerCounts[q.id] && correctAnswerCounts[q.id] >= 3)
    );
    
    // 4. Interleave missed questions with related questions
    // This implements the interleaving principle from "Make It Stick"
    const questionIds: string[] = [];
    const missedIds = new Set(missedQuestions.map(q => q.id));
    const remainingIds = candidateQuestions.filter(q => !missedIds.has(q.id)).map(q => q.id);
    
    // Add missed questions first (higher priority)
    questionIds.push(...missedIds);
    
    // Fill remaining slots with related questions
    while (questionIds.length < questionCount && remainingIds.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingIds.length);
      const questionId = remainingIds[randomIndex];
      questionIds.push(questionId);
      remainingIds.splice(randomIndex, 1);
    }
    
    // Shuffle the questions for the interleaving effect
    return questionIds.sort(() => Math.random() - 0.5).slice(0, questionCount);
  }
}
