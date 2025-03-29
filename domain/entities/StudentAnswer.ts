import { 
  StudentAnswer,
  MultipleChoiceAnswer,
  TrueFalseAnswer,
  ShortAnswerResponse,
  EssayResponse,
  MatchingResponse,
  QuestionType
} from "../models/StudentAnswer.ts";

/**
 * StudentAnswer entity class that encapsulates student answer data and behavior
 * This is a rich domain entity with business logic and validation
 */
export class StudentAnswerEntity {
  private readonly data: StudentAnswer;

  constructor(data: StudentAnswer) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get studentId(): string {
    return this.data.studentId;
  }

  get questionId(): string {
    return this.data.questionId;
  }

  get studentAssignmentId(): string {
    return this.data.studentAssignmentId;
  }

  get isCorrect(): boolean | undefined {
    return this.data.isCorrect;
  }

  get attemptNumber(): number {
    return this.data.attemptNumber;
  }

  get questionType(): QuestionType {
    return this.data.questionType;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  /**
   * Marks the answer as correct or incorrect
   * @param isCorrect Whether the answer is correct
   */
  markAsCorrectOrIncorrect(isCorrect: boolean): StudentAnswerEntity {
    return new StudentAnswerEntity({
      ...this.data,
      isCorrect,
      updatedAt: new Date(),
    });
  }

  /**
   * For essay responses, provides feedback and score
   * @param feedback Feedback for the essay response
   * @param score Score for the essay response
   * @throws Error if the answer is not an essay response
   */
  provideEssayFeedback(feedback: string, score: number): StudentAnswerEntity {
    if (this.data.questionType !== QuestionType.ESSAY) {
      throw new Error("Cannot provide essay feedback for non-essay answer");
    }

    const essayResponse = this.data as EssayResponse;
    
    return new StudentAnswerEntity({
      ...essayResponse,
      feedback,
      score,
      isCorrect: score > 0, // Consider any score above 0 as "correct" for essays
      updatedAt: new Date(),
    });
  }

  /**
   * Gets the specific answer content based on question type
   */
  getAnswerContent(): unknown {
    switch (this.data.questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        return (this.data as MultipleChoiceAnswer).selectedOptionId;
      
      case QuestionType.TRUE_FALSE:
        return (this.data as TrueFalseAnswer).answer;
      
      case QuestionType.SHORT_ANSWER:
        return (this.data as ShortAnswerResponse).answer;
      
      case QuestionType.ESSAY:
        return (this.data as EssayResponse).answer;
      
      case QuestionType.MATCHING:
        return (this.data as MatchingResponse).matches;
      
      default:
        return null;
    }
  }

  /**
   * Checks if this answer is for a specific question
   * @param questionId ID of the question to check
   */
  isForQuestion(questionId: string): boolean {
    return this.data.questionId === questionId;
  }

  /**
   * Checks if this is a retry attempt
   */
  isRetryAttempt(): boolean {
    return this.data.attemptNumber > 1;
  }

  /**
   * Converts the entity back to a data transfer object
   */
  toDTO(): StudentAnswer {
    return { ...this.data };
  }
}
