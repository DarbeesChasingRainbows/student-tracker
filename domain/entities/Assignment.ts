import { Assignment, AssignmentSettings, AssignmentStatus, AssignmentType } from "../models/Assignment.ts";

/**
 * Assignment entity class that encapsulates assignment data and behavior
 * This is a rich domain entity with business logic and validation
 */
export class AssignmentEntity {
  private readonly data: Assignment;

  constructor(data: Assignment) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get title(): string {
    return this.data.title;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get type(): AssignmentType {
    return this.data.type;
  }

  get questionIds(): string[] {
    return [...this.data.questionIds];
  }

  get createdBy(): string {
    return this.data.createdBy;
  }

  get status(): AssignmentStatus {
    return this.data.status;
  }

  get settings(): AssignmentSettings {
    return { ...this.data.settings };
  }

  get dueDate(): Date | undefined {
    return this.data.dueDate;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  /**
   * Updates the assignment title
   * @param title New title for the assignment
   */
  updateTitle(title: string): AssignmentEntity {
    return new AssignmentEntity({
      ...this.data,
      title,
      updatedAt: new Date(),
    });
  }

  /**
   * Updates the assignment description
   * @param description New description for the assignment
   */
  updateDescription(description?: string): AssignmentEntity {
    return new AssignmentEntity({
      ...this.data,
      description,
      updatedAt: new Date(),
    });
  }

  /**
   * Updates the assignment status
   * @param status New status for the assignment
   */
  updateStatus(status: AssignmentStatus): AssignmentEntity {
    return new AssignmentEntity({
      ...this.data,
      status,
      updatedAt: new Date(),
    });
  }

  /**
   * Updates the assignment settings
   * @param settings New settings for the assignment
   */
  updateSettings(settings: Partial<AssignmentSettings>): AssignmentEntity {
    return new AssignmentEntity({
      ...this.data,
      settings: {
        ...this.data.settings,
        ...settings,
      },
      updatedAt: new Date(),
    });
  }

  /**
   * Updates the assignment due date
   * @param dueDate New due date for the assignment
   */
  updateDueDate(dueDate?: Date): AssignmentEntity {
    return new AssignmentEntity({
      ...this.data,
      dueDate,
      updatedAt: new Date(),
    });
  }

  /**
   * Adds questions to the assignment
   * @param questionIds IDs of questions to add
   */
  addQuestions(questionIds: string[]): AssignmentEntity {
    const uniqueQuestionIds = [...new Set([...this.data.questionIds, ...questionIds])];
    
    return new AssignmentEntity({
      ...this.data,
      questionIds: uniqueQuestionIds,
      updatedAt: new Date(),
    });
  }

  /**
   * Removes questions from the assignment
   * @param questionIds IDs of questions to remove
   */
  removeQuestions(questionIds: string[]): AssignmentEntity {
    const questionIdsSet = new Set(questionIds);
    const filteredQuestionIds = this.data.questionIds.filter(id => !questionIdsSet.has(id));
    
    return new AssignmentEntity({
      ...this.data,
      questionIds: filteredQuestionIds,
      updatedAt: new Date(),
    });
  }

  /**
   * Checks if the assignment can be published (assigned to students)
   */
  canBePublished(): boolean {
    return this.data.questionIds.length > 0 && 
           this.data.status === AssignmentStatus.DRAFT;
  }

  /**
   * Publishes the assignment by changing its status to ASSIGNED
   * @throws Error if the assignment cannot be published
   */
  publish(): AssignmentEntity {
    if (!this.canBePublished()) {
      throw new Error("Assignment cannot be published. It must be in DRAFT status and have at least one question.");
    }
    
    return this.updateStatus(AssignmentStatus.ASSIGNED);
  }

  /**
   * Checks if the assignment allows retakes based on its settings
   */
  allowsRetakes(): boolean {
    return this.data.settings.allowRetake;
  }

  /**
   * Checks if the assignment should trigger confetti for the given score
   * @param score The score to check against the confetti threshold
   */
  shouldTriggerConfetti(score: number): boolean {
    return score >= this.data.settings.confettiThreshold;
  }

  /**
   * Checks if the assignment should generate an adaptive reassignment for the given score
   * @param score The score to check against the adaptive threshold
   */
  shouldGenerateAdaptiveReassignment(score: number): boolean {
    return score < this.data.settings.adaptiveReassignThreshold;
  }

  /**
   * Converts the entity back to a data transfer object
   */
  toDTO(): Assignment {
    return { ...this.data };
  }
}
