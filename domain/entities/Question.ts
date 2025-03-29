import { 
  Question, 
  QuestionType, 
  DifficultyLevel,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  EssayQuestion,
  MatchingQuestion
} from "../models/Question.ts";

/**
 * Question entity class that encapsulates question data and behavior
 * This is a rich domain entity with business logic and validation
 */
export class QuestionEntity {
  private readonly data: Question;

  constructor(data: Question) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get prompt(): string {
    return this.data.prompt;
  }

  get type(): QuestionType {
    return this.data.type;
  }

  get difficultyLevel(): DifficultyLevel {
    return this.data.difficultyLevel;
  }

  get explanation(): string | undefined {
    return this.data.explanation;
  }

  get tags(): string[] {
    return [...this.data.tags];
  }

  get createdBy(): string {
    return this.data.createdBy;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  /**
   * Updates the question prompt
   * @param prompt New prompt for the question
   */
  updatePrompt(prompt: string): QuestionEntity {
    return new QuestionEntity({
      ...this.data,
      prompt,
      updatedAt: new Date(),
    });
  }

  /**
   * Updates the question difficulty level
   * @param difficultyLevel New difficulty level for the question
   */
  updateDifficultyLevel(difficultyLevel: DifficultyLevel): QuestionEntity {
    return new QuestionEntity({
      ...this.data,
      difficultyLevel,
      updatedAt: new Date(),
    });
  }

  /**
   * Updates the question explanation
   * @param explanation New explanation for the question
   */
  updateExplanation(explanation?: string): QuestionEntity {
    return new QuestionEntity({
      ...this.data,
      explanation,
      updatedAt: new Date(),
    });
  }

  /**
   * Adds tags to the question
   * @param tags Tags to add to the question
   */
  addTags(tags: string[]): QuestionEntity {
    const uniqueTags = [...new Set([...this.data.tags, ...tags])];
    
    return new QuestionEntity({
      ...this.data,
      tags: uniqueTags,
      updatedAt: new Date(),
    });
  }

  /**
   * Removes tags from the question
   * @param tags Tags to remove from the question
   */
  removeTags(tags: string[]): QuestionEntity {
    const tagsSet = new Set(tags);
    const filteredTags = this.data.tags.filter(tag => !tagsSet.has(tag));
    
    return new QuestionEntity({
      ...this.data,
      tags: filteredTags,
      updatedAt: new Date(),
    });
  }

  /**
   * Checks if the question has a specific tag
   * @param tag Tag to check
   */
  hasTag(tag: string): boolean {
    return this.data.tags.includes(tag);
  }

  /**
   * For multiple choice questions, updates the options
   * @param options New options for the multiple choice question
   * @throws Error if the question is not a multiple choice question
   */
  updateMultipleChoiceOptions(options: Array<{ id: string; text: string; isCorrect: boolean }>): QuestionEntity {
    if (this.data.type !== QuestionType.MULTIPLE_CHOICE) {
      throw new Error("Cannot update options for non-multiple choice question");
    }

    const mcQuestion = this.data as MultipleChoiceQuestion;
    
    return new QuestionEntity({
      ...mcQuestion,
      options,
      updatedAt: new Date(),
    });
  }

  /**
   * For true/false questions, updates the correct answer
   * @param correctAnswer New correct answer for the true/false question
   * @throws Error if the question is not a true/false question
   */
  updateTrueFalseAnswer(correctAnswer: boolean): QuestionEntity {
    if (this.data.type !== QuestionType.TRUE_FALSE) {
      throw new Error("Cannot update correct answer for non-true/false question");
    }

    const tfQuestion = this.data as TrueFalseQuestion;
    
    return new QuestionEntity({
      ...tfQuestion,
      correctAnswer,
      updatedAt: new Date(),
    });
  }

  /**
   * For short answer questions, updates the correct answers
   * @param correctAnswers New correct answers for the short answer question
   * @param caseSensitive Whether the answers are case sensitive
   * @throws Error if the question is not a short answer question
   */
  updateShortAnswerCorrectAnswers(correctAnswers: string[], caseSensitive?: boolean): QuestionEntity {
    if (this.data.type !== QuestionType.SHORT_ANSWER) {
      throw new Error("Cannot update correct answers for non-short answer question");
    }

    const saQuestion = this.data as ShortAnswerQuestion;
    
    return new QuestionEntity({
      ...saQuestion,
      correctAnswers,
      ...(caseSensitive !== undefined && { caseSensitive }),
      updatedAt: new Date(),
    });
  }

  /**
   * For essay questions, updates the rubric and word limit
   * @param rubric New rubric for the essay question
   * @param wordLimit New word limit for the essay question
   * @throws Error if the question is not an essay question
   */
  updateEssayRubric(rubric?: string, wordLimit?: number): QuestionEntity {
    if (this.data.type !== QuestionType.ESSAY) {
      throw new Error("Cannot update rubric for non-essay question");
    }

    const essayQuestion = this.data as EssayQuestion;
    
    return new QuestionEntity({
      ...essayQuestion,
      ...(rubric !== undefined && { rubric }),
      ...(wordLimit !== undefined && { wordLimit }),
      updatedAt: new Date(),
    });
  }

  /**
   * For matching questions, updates the pairs
   * @param pairs New pairs for the matching question
   * @throws Error if the question is not a matching question
   */
  updateMatchingPairs(pairs: Array<{ id: string; left: string; right: string }>): QuestionEntity {
    if (this.data.type !== QuestionType.MATCHING) {
      throw new Error("Cannot update pairs for non-matching question");
    }

    const matchingQuestion = this.data as MatchingQuestion;
    
    return new QuestionEntity({
      ...matchingQuestion,
      pairs,
      updatedAt: new Date(),
    });
  }

  /**
   * Validates a student's answer for this question
   * @param answer The student's answer
   * @returns Whether the answer is correct
   */
  validateAnswer(answer: unknown): boolean {
    switch (this.data.type) {
      case QuestionType.MULTIPLE_CHOICE: {
        const mcQuestion = this.data as MultipleChoiceQuestion;
        const selectedOptionId = answer as string;
        const selectedOption = mcQuestion.options.find(opt => opt.id === selectedOptionId);
        return selectedOption?.isCorrect ?? false;
      }
      
      case QuestionType.TRUE_FALSE: {
        const tfQuestion = this.data as TrueFalseQuestion;
        return tfQuestion.correctAnswer === (answer as boolean);
      }
      
      case QuestionType.SHORT_ANSWER: {
        const saQuestion = this.data as ShortAnswerQuestion;
        const studentAnswer = answer as string;
        
        if (saQuestion.caseSensitive) {
          return saQuestion.correctAnswers.includes(studentAnswer);
        } else {
          return saQuestion.correctAnswers
            .map(a => a.toLowerCase())
            .includes(studentAnswer.toLowerCase());
        }
      }
      
      case QuestionType.MATCHING: {
        const matchingQuestion = this.data as MatchingQuestion;
        const studentMatches = answer as Array<{ leftId: string; rightId: string }>;
        
        // Create a map of correct pairs
        const correctPairs = new Map<string, string>();
        for (const pair of matchingQuestion.pairs) {
          correctPairs.set(pair.id, pair.id);
        }
        
        // Check if all student matches are correct
        for (const match of studentMatches) {
          if (correctPairs.get(match.leftId) !== match.rightId) {
            return false;
          }
        }
        
        return true;
      }
      
      case QuestionType.ESSAY:
        // Essay questions cannot be automatically validated
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Converts the entity back to a data transfer object
   */
  toDTO(): Question {
    return { ...this.data };
  }
}
