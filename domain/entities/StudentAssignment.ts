import { StudentAssignment, StudentAssignmentStatus } from "../models/StudentAssignment.ts";

/**
 * StudentAssignment entity class that encapsulates student assignment data and behavior
 * This is a rich domain entity with business logic and validation
 */
export class StudentAssignmentEntity {
  private readonly data: StudentAssignment;

  constructor(data: StudentAssignment) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get studentId(): string {
    return this.data.studentId;
  }

  get assignmentId(): string {
    return this.data.assignmentId;
  }

  get status(): StudentAssignmentStatus {
    return this.data.status;
  }

  get score(): number | undefined {
    return this.data.score;
  }

  get startedAt(): Date | undefined {
    return this.data.startedAt;
  }

  get submittedAt(): Date | undefined {
    return this.data.submittedAt;
  }

  get gradedAt(): Date | undefined {
    return this.data.gradedAt;
  }

  get attempts(): number {
    return this.data.attempts;
  }

  get feedback(): string | undefined {
    return this.data.feedback;
  }

  get isAdaptive(): boolean {
    return this.data.isAdaptive;
  }

  get originalAssignmentId(): string | undefined {
    return this.data.originalAssignmentId;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  /**
   * Marks the assignment as started
   */
  startAssignment(): StudentAssignmentEntity {
    if (this.data.status !== StudentAssignmentStatus.ASSIGNED) {
      throw new Error("Cannot start an assignment that is not in ASSIGNED status");
    }

    return new StudentAssignmentEntity({
      ...this.data,
      status: StudentAssignmentStatus.IN_PROGRESS,
      startedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Submits the assignment
   */
  submitAssignment(): StudentAssignmentEntity {
    if (this.data.status !== StudentAssignmentStatus.IN_PROGRESS) {
      throw new Error("Cannot submit an assignment that is not in IN_PROGRESS status");
    }

    return new StudentAssignmentEntity({
      ...this.data,
      status: StudentAssignmentStatus.SUBMITTED,
      submittedAt: new Date(),
      attempts: this.data.attempts + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Grades the assignment
   * @param score The score for the assignment (0-100)
   * @param feedback Optional feedback for the student
   */
  gradeAssignment(score: number, feedback?: string): StudentAssignmentEntity {
    if (this.data.status !== StudentAssignmentStatus.SUBMITTED) {
      throw new Error("Cannot grade an assignment that is not in SUBMITTED status");
    }

    if (score < 0 || score > 100) {
      throw new Error("Score must be between 0 and 100");
    }

    return new StudentAssignmentEntity({
      ...this.data,
      status: StudentAssignmentStatus.GRADED,
      score,
      feedback,
      gradedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Marks the assignment for adaptive reassignment
   */
  markForReassignment(): StudentAssignmentEntity {
    if (this.data.status !== StudentAssignmentStatus.GRADED) {
      throw new Error("Cannot reassign an assignment that is not in GRADED status");
    }

    return new StudentAssignmentEntity({
      ...this.data,
      status: StudentAssignmentStatus.REASSIGNED,
      updatedAt: new Date(),
    });
  }

  /**
   * Checks if the assignment needs adaptive reassignment based on score
   * @param threshold The threshold score below which adaptive reassignment is needed
   */
  needsAdaptiveReassignment(threshold: number): boolean {
    return this.data.status === StudentAssignmentStatus.GRADED && 
           this.data.score !== undefined && 
           this.data.score < threshold;
  }

  /**
   * Checks if the assignment is eligible for a retake
   * @param maxAttempts The maximum number of attempts allowed
   */
  canRetake(maxAttempts: number): boolean {
    return this.data.status === StudentAssignmentStatus.GRADED && 
           this.data.attempts < maxAttempts;
  }

  /**
   * Resets the assignment for a retake
   */
  resetForRetake(): StudentAssignmentEntity {
    if (this.data.status !== StudentAssignmentStatus.GRADED) {
      throw new Error("Cannot reset an assignment that is not in GRADED status");
    }

    return new StudentAssignmentEntity({
      ...this.data,
      status: StudentAssignmentStatus.ASSIGNED,
      startedAt: undefined,
      submittedAt: undefined,
      gradedAt: undefined,
      updatedAt: new Date(),
    });
  }

  /**
   * Converts the entity back to a data transfer object
   */
  toDTO(): StudentAssignment {
    return { ...this.data };
  }
}
