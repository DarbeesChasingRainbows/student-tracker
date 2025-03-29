import { QuestionType } from "../models/Question.ts";
import { BaseDomainEvent } from "./DomainEvent.ts";

/**
 * Event fired when a student submits an answer to a question
 */
export class StudentAnswerSubmittedEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly questionId: string;
  public readonly studentAssignmentId: string;
  public readonly questionType: QuestionType;
  public readonly attemptNumber: number;
  public readonly isCorrect?: boolean;

  constructor(
    studentAnswerId: string,
    studentId: string,
    questionId: string,
    studentAssignmentId: string,
    questionType: QuestionType,
    attemptNumber: number,
    isCorrect?: boolean,
  ) {
    super("StudentAnswerSubmitted", studentAnswerId, "StudentAnswer");
    this.studentId = studentId;
    this.questionId = questionId;
    this.studentAssignmentId = studentAssignmentId;
    this.questionType = questionType;
    this.attemptNumber = attemptNumber;
    this.isCorrect = isCorrect;
  }
}

/**
 * Event fired when a student answer is marked as correct or incorrect
 */
export class StudentAnswerGradedEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly questionId: string;
  public readonly studentAssignmentId: string;
  public readonly questionType: QuestionType;
  public readonly attemptNumber: number;
  public readonly isCorrect: boolean;
  public readonly confettiTriggered: boolean;

  constructor(
    studentAnswerId: string,
    studentId: string,
    questionId: string,
    studentAssignmentId: string,
    questionType: QuestionType,
    attemptNumber: number,
    isCorrect: boolean,
    confettiTriggered: boolean,
  ) {
    super("StudentAnswerGraded", studentAnswerId, "StudentAnswer");
    this.studentId = studentId;
    this.questionId = questionId;
    this.studentAssignmentId = studentAssignmentId;
    this.questionType = questionType;
    this.attemptNumber = attemptNumber;
    this.isCorrect = isCorrect;
    this.confettiTriggered = confettiTriggered;
  }
}

/**
 * Event fired when an essay answer is graded with feedback
 */
export class EssayAnswerFeedbackProvidedEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly questionId: string;
  public readonly studentAssignmentId: string;
  public readonly attemptNumber: number;
  public readonly score: number;
  public readonly hasFeedback: boolean;

  constructor(
    studentAnswerId: string,
    studentId: string,
    questionId: string,
    studentAssignmentId: string,
    attemptNumber: number,
    score: number,
    hasFeedback: boolean,
  ) {
    super("EssayAnswerFeedbackProvided", studentAnswerId, "StudentAnswer");
    this.studentId = studentId;
    this.questionId = questionId;
    this.studentAssignmentId = studentAssignmentId;
    this.attemptNumber = attemptNumber;
    this.score = score;
    this.hasFeedback = hasFeedback;
  }
}

/**
 * Event fired when a student retries a question
 */
export class StudentQuestionRetryEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly questionId: string;
  public readonly studentAssignmentId: string;
  public readonly questionType: QuestionType;
  public readonly previousAttemptNumber: number;
  public readonly wasCorrectPreviously: boolean;

  constructor(
    studentAnswerId: string,
    studentId: string,
    questionId: string,
    studentAssignmentId: string,
    questionType: QuestionType,
    previousAttemptNumber: number,
    wasCorrectPreviously: boolean,
  ) {
    super("StudentQuestionRetry", studentAnswerId, "StudentAnswer");
    this.studentId = studentId;
    this.questionId = questionId;
    this.studentAssignmentId = studentAssignmentId;
    this.questionType = questionType;
    this.previousAttemptNumber = previousAttemptNumber;
    this.wasCorrectPreviously = wasCorrectPreviously;
  }
}

/**
 * Event fired when a student consistently gets a question wrong
 * This is useful for spaced repetition and adaptive learning
 */
export class RecurringIncorrectAnswerEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly questionId: string;
  public readonly questionType: QuestionType;
  public readonly tags: string[];
  public readonly incorrectAttempts: number;

  constructor(
    studentAnswerId: string,
    studentId: string,
    questionId: string,
    questionType: QuestionType,
    tags: string[],
    incorrectAttempts: number,
  ) {
    super("RecurringIncorrectAnswer", studentAnswerId, "StudentAnswer");
    this.studentId = studentId;
    this.questionId = questionId;
    this.questionType = questionType;
    this.tags = tags;
    this.incorrectAttempts = incorrectAttempts;
  }
}
