import { StudentAssignmentStatus } from "../models/StudentAssignment.ts";
import { BaseDomainEvent } from "./DomainEvent.ts";

/**
 * Event fired when an assignment is assigned to a student
 */
export class AssignmentAssignedToStudentEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly assignmentId: string;
  public readonly isAdaptive: boolean;
  public readonly originalAssignmentId?: string;

  constructor(
    studentAssignmentId: string,
    studentId: string,
    assignmentId: string,
    isAdaptive: boolean,
    originalAssignmentId?: string,
  ) {
    super("AssignmentAssignedToStudent", studentAssignmentId, "StudentAssignment");
    this.studentId = studentId;
    this.assignmentId = assignmentId;
    this.isAdaptive = isAdaptive;
    this.originalAssignmentId = originalAssignmentId;
  }
}

/**
 * Event fired when a student starts an assignment
 */
export class StudentAssignmentStartedEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly assignmentId: string;
  public readonly startedAt: Date;

  constructor(
    studentAssignmentId: string,
    studentId: string,
    assignmentId: string,
    startedAt: Date,
  ) {
    super("StudentAssignmentStarted", studentAssignmentId, "StudentAssignment");
    this.studentId = studentId;
    this.assignmentId = assignmentId;
    this.startedAt = startedAt;
  }
}

/**
 * Event fired when a student submits an assignment
 */
export class StudentAssignmentSubmittedEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly assignmentId: string;
  public readonly submittedAt: Date;
  public readonly attemptNumber: number;

  constructor(
    studentAssignmentId: string,
    studentId: string,
    assignmentId: string,
    submittedAt: Date,
    attemptNumber: number,
  ) {
    super("StudentAssignmentSubmitted", studentAssignmentId, "StudentAssignment");
    this.studentId = studentId;
    this.assignmentId = assignmentId;
    this.submittedAt = submittedAt;
    this.attemptNumber = attemptNumber;
  }
}

/**
 * Event fired when a student assignment is graded
 */
export class StudentAssignmentGradedEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly assignmentId: string;
  public readonly score: number;
  public readonly gradedAt: Date;
  public readonly hasFeedback: boolean;
  public readonly attemptNumber: number;
  public readonly confettiTriggered: boolean;

  constructor(
    studentAssignmentId: string,
    studentId: string,
    assignmentId: string,
    score: number,
    gradedAt: Date,
    hasFeedback: boolean,
    attemptNumber: number,
    confettiTriggered: boolean,
  ) {
    super("StudentAssignmentGraded", studentAssignmentId, "StudentAssignment");
    this.studentId = studentId;
    this.assignmentId = assignmentId;
    this.score = score;
    this.gradedAt = gradedAt;
    this.hasFeedback = hasFeedback;
    this.attemptNumber = attemptNumber;
    this.confettiTriggered = confettiTriggered;
  }
}

/**
 * Event fired when a student assignment is marked for adaptive reassignment
 */
export class StudentAssignmentMarkedForReassignmentEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly assignmentId: string;
  public readonly score: number;
  public readonly threshold: number;

  constructor(
    studentAssignmentId: string,
    studentId: string,
    assignmentId: string,
    score: number,
    threshold: number,
  ) {
    super("StudentAssignmentMarkedForReassignment", studentAssignmentId, "StudentAssignment");
    this.studentId = studentId;
    this.assignmentId = assignmentId;
    this.score = score;
    this.threshold = threshold;
  }
}

/**
 * Event fired when a student assignment status changes
 */
export class StudentAssignmentStatusChangedEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly assignmentId: string;
  public readonly previousStatus: StudentAssignmentStatus;
  public readonly newStatus: StudentAssignmentStatus;

  constructor(
    studentAssignmentId: string,
    studentId: string,
    assignmentId: string,
    previousStatus: StudentAssignmentStatus,
    newStatus: StudentAssignmentStatus,
  ) {
    super("StudentAssignmentStatusChanged", studentAssignmentId, "StudentAssignment");
    this.studentId = studentId;
    this.assignmentId = assignmentId;
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
  }
}

/**
 * Event fired when a student assignment is reset for retake
 */
export class StudentAssignmentResetForRetakeEvent extends BaseDomainEvent {
  public readonly studentId: string;
  public readonly assignmentId: string;
  public readonly previousAttemptNumber: number;
  public readonly previousScore?: number;

  constructor(
    studentAssignmentId: string,
    studentId: string,
    assignmentId: string,
    previousAttemptNumber: number,
    previousScore?: number,
  ) {
    super("StudentAssignmentResetForRetake", studentAssignmentId, "StudentAssignment");
    this.studentId = studentId;
    this.assignmentId = assignmentId;
    this.previousAttemptNumber = previousAttemptNumber;
    this.previousScore = previousScore;
  }
}
