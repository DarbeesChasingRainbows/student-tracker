import { Student } from "../models/Student.ts";

/**
 * Student entity class that encapsulates student data and behavior
 * This is a rich domain entity with business logic and validation
 */
export class StudentEntity {
  private readonly data: Student;

  constructor(data: Student) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get username(): string {
    return this.data.username;
  }

  get pin(): string | undefined {
    return this.data.pin;
  }

  get avatarId(): string {
    return this.data.avatarId;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  /**
   * Updates the student's name
   * @param name New name for the student
   */
  updateName(name: string): StudentEntity {
    return new StudentEntity({
      ...this.data,
      name,
      updatedAt: new Date(),
    });
  }

  /**
   * Updates the student's username
   * @param username New username for the student
   */
  updateUsername(username: string): StudentEntity {
    return new StudentEntity({
      ...this.data,
      username,
      updatedAt: new Date(),
    });
  }

  /**
   * Sets or updates the student's PIN
   * @param pin New PIN for the student
   */
  updatePin(pin: string | undefined): StudentEntity {
    return new StudentEntity({
      ...this.data,
      pin,
      updatedAt: new Date(),
    });
  }

  /**
   * Updates the student's avatar
   * @param avatarId New avatar ID for the student
   */
  updateAvatar(avatarId: string): StudentEntity {
    return new StudentEntity({
      ...this.data,
      avatarId,
      updatedAt: new Date(),
    });
  }

  /**
   * Validates if the provided PIN matches the student's PIN
   * @param inputPin PIN to validate
   * @returns True if PIN matches or if student has no PIN
   */
  validatePin(inputPin?: string): boolean {
    // If student has no PIN, any input is valid
    if (!this.data.pin) {
      return true;
    }
    
    // Otherwise, PIN must match
    return this.data.pin === inputPin;
  }

  /**
   * Converts the entity back to a data transfer object
   */
  toDTO(): Student {
    return { ...this.data };
  }
}
