import { BaseDomainEvent } from "./DomainEvent.ts";

/**
 * Event fired when a new student is created
 */
export class StudentCreatedEvent extends BaseDomainEvent {
  public readonly studentName: string;
  public readonly username: string;

  constructor(
    studentId: string,
    studentName: string,
    username: string,
  ) {
    super("StudentCreated", studentId, "Student");
    this.studentName = studentName;
    this.username = username;
  }
}

/**
 * Event fired when a student's profile is updated
 */
export class StudentProfileUpdatedEvent extends BaseDomainEvent {
  public readonly updatedFields: string[];
  public readonly previousValues: Record<string, unknown>;
  public readonly newValues: Record<string, unknown>;

  constructor(
    studentId: string,
    updatedFields: string[],
    previousValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
  ) {
    super("StudentProfileUpdated", studentId, "Student");
    this.updatedFields = updatedFields;
    this.previousValues = previousValues;
    this.newValues = newValues;
  }
}

/**
 * Event fired when a student's PIN is changed
 */
export class StudentPinChangedEvent extends BaseDomainEvent {
  public readonly hasPinNow: boolean;

  constructor(
    studentId: string,
    hasPinNow: boolean,
  ) {
    super("StudentPinChanged", studentId, "Student");
    this.hasPinNow = hasPinNow;
  }
}

/**
 * Event fired when a student's avatar is changed
 */
export class StudentAvatarChangedEvent extends BaseDomainEvent {
  public readonly previousAvatarId: string;
  public readonly newAvatarId: string;

  constructor(
    studentId: string,
    previousAvatarId: string,
    newAvatarId: string,
  ) {
    super("StudentAvatarChanged", studentId, "Student");
    this.previousAvatarId = previousAvatarId;
    this.newAvatarId = newAvatarId;
  }
}

/**
 * Event fired when a student successfully authenticates
 */
export class StudentAuthenticatedEvent extends BaseDomainEvent {
  public readonly username: string;
  public readonly usedPin: boolean;

  constructor(
    studentId: string,
    username: string,
    usedPin: boolean,
  ) {
    super("StudentAuthenticated", studentId, "Student");
    this.username = username;
    this.usedPin = usedPin;
  }
}

/**
 * Event fired when a student authentication fails
 */
export class StudentAuthenticationFailedEvent extends BaseDomainEvent {
  public readonly username: string;
  public readonly reason: string;

  constructor(
    username: string,
    reason: string,
  ) {
    super("StudentAuthenticationFailed", "none", "Student");
    this.username = username;
    this.reason = reason;
  }
}
