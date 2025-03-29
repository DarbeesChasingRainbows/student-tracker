import { AssignmentStatus, AssignmentType } from "../models/Assignment.ts";
import { BaseDomainEvent } from "./DomainEvent.ts";

/**
 * Event fired when a new assignment is created
 */
export class AssignmentCreatedEvent extends BaseDomainEvent {
  public readonly title: string;
  public readonly type: AssignmentType;
  public readonly questionCount: number;
  public readonly createdBy: string;

  constructor(
    assignmentId: string,
    title: string,
    type: AssignmentType,
    questionCount: number,
    createdBy: string,
  ) {
    super("AssignmentCreated", assignmentId, "Assignment");
    this.title = title;
    this.type = type;
    this.questionCount = questionCount;
    this.createdBy = createdBy;
  }
}

/**
 * Event fired when an assignment's status is changed
 */
export class AssignmentStatusChangedEvent extends BaseDomainEvent {
  public readonly previousStatus: AssignmentStatus;
  public readonly newStatus: AssignmentStatus;

  constructor(
    assignmentId: string,
    previousStatus: AssignmentStatus,
    newStatus: AssignmentStatus,
  ) {
    super("AssignmentStatusChanged", assignmentId, "Assignment");
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
  }
}

/**
 * Event fired when questions are added to an assignment
 */
export class QuestionsAddedToAssignmentEvent extends BaseDomainEvent {
  public readonly questionIds: string[];

  constructor(
    assignmentId: string,
    questionIds: string[],
  ) {
    super("QuestionsAddedToAssignment", assignmentId, "Assignment");
    this.questionIds = questionIds;
  }
}

/**
 * Event fired when questions are removed from an assignment
 */
export class QuestionsRemovedFromAssignmentEvent extends BaseDomainEvent {
  public readonly questionIds: string[];

  constructor(
    assignmentId: string,
    questionIds: string[],
  ) {
    super("QuestionsRemovedFromAssignment", assignmentId, "Assignment");
    this.questionIds = questionIds;
  }
}

/**
 * Event fired when an assignment's settings are updated
 */
export class AssignmentSettingsUpdatedEvent extends BaseDomainEvent {
  public readonly updatedSettings: Record<string, unknown>;

  constructor(
    assignmentId: string,
    updatedSettings: Record<string, unknown>,
  ) {
    super("AssignmentSettingsUpdated", assignmentId, "Assignment");
    this.updatedSettings = updatedSettings;
  }
}

/**
 * Event fired when an assignment is published (assigned to students)
 */
export class AssignmentPublishedEvent extends BaseDomainEvent {
  public readonly title: string;
  public readonly type: AssignmentType;
  public readonly dueDate?: Date;

  constructor(
    assignmentId: string,
    title: string,
    type: AssignmentType,
    dueDate?: Date,
  ) {
    super("AssignmentPublished", assignmentId, "Assignment");
    this.title = title;
    this.type = type;
    this.dueDate = dueDate;
  }
}
