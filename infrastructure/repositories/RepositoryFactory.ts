import { Pool as _Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { StudentRepository } from "../../ports/repositories/StudentRepository.ts";
import { QuestionRepository } from "../../ports/repositories/QuestionRepository.ts";
import { StudentAssignmentStatus as _StudentAssignmentStatus } from "../../domain/models/StudentAssignment.ts";
import { AssignmentStatus as _AssignmentStatus, AssignmentType as _AssignmentType } from "../../domain/models/Assignment.ts";
import { StudentAssignmentRepository } from "../../ports/repositories/StudentAssignmentRepository.ts";
import { DifficultyLevel as _DifficultyLevel } from "../../domain/models/Question.ts";
import { AssignmentRepository } from "../../ports/repositories/AssignmentRepository.ts";
import { StudentAnswerRepository } from "../../ports/repositories/StudentAnswerRepository.ts";
import { StudentAssignment as _StudentAssignment } from "../../domain/models/StudentAssignment.ts";
import { Assignment as _Assignment } from "../../domain/models/Assignment.ts";
import { Question as _Question, QuestionType as _QuestionType } from "../../domain/models/Question.ts";
import { StudentAnswer as _StudentAnswer } from "../../domain/models/StudentAnswer.ts";

// PostgreSQL Repositories
import { PostgresStudentRepository } from "./PostgresStudentRepository.ts";
import { PostgresQuestionRepository } from "./PostgresQuestionRepository.ts";
import { PostgresAssignmentRepository } from "./PostgresAssignmentRepository.ts";
import { PostgresStudentAssignmentRepository } from "./PostgresStudentAssignmentRepository.ts";
import { PostgresStudentAnswerRepository } from "./PostgresStudentAnswerRepository.ts";

/**
 * Repository storage types
 */
export enum StorageType {
  POSTGRES = "postgres",
  FIREBASE = "firebase",
}

/**
 * Configuration for repository factory
 */
export interface DatabaseConfig {
  storageType: StorageType;
  postgres: {
    connectionString: string;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    collection?: string;
  };
}

/**
 * Factory for creating repository instances based on the configured storage type.
 */
export class RepositoryFactory {
  private static instance: RepositoryFactory | null = null;
  private static config: DatabaseConfig = {
    storageType: StorageType.POSTGRES,
    postgres: {
      connectionString: "postgres://postgres:postgres@localhost:5432/student_tracker_dev"
    },
    firebase: {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
      collection: "students"
    }
  };

  private studentRepository: StudentRepository | null = null;
  private questionRepository: QuestionRepository | null = null;
  private assignmentRepository: AssignmentRepository | null = null;
  private studentAssignmentRepository: StudentAssignmentRepository | null = null;
  private studentAnswerRepository: StudentAnswerRepository | null = null;

  /**
   * Create a new RepositoryFactory instance.
   * @param config The database configuration.
   */
  constructor(private config: DatabaseConfig) {}

  /**
   * Configure the repository factory with settings
   * @param config The database configuration
   */
  static configure(config: DatabaseConfig): void {
    this.config = config;
    // Reset instance when configuration changes
    this.instance = null;
  }

  /**
   * Get the singleton instance of RepositoryFactory
   */
  private static getInstance(): RepositoryFactory {
    if (!this.instance) {
      this.instance = new RepositoryFactory(this.config);
    }
    return this.instance;
  }

  /**
   * Create a student repository instance based on the configured storage type.
   * @returns A student repository instance.
   */
  static createStudentRepository(): StudentRepository {
    return this.getInstance().createStudentRepositoryInstance();
  }

  /**
   * Instance method to create a student repository
   */
  createStudentRepositoryInstance(): StudentRepository {
    if (this.studentRepository) {
      return this.studentRepository;
    }

    switch (this.config.storageType) {
      case StorageType.POSTGRES:
        this.studentRepository = new PostgresStudentRepository(
          this.config.postgres.connectionString
        );
        break;
      case StorageType.FIREBASE:
        // Firebase implementation is not available, use PostgreSQL instead
        console.warn("Firebase implementation not available, using PostgreSQL instead");
        this.studentRepository = new PostgresStudentRepository(
          this.config.postgres.connectionString
        );
        break;
    }

    if (!this.studentRepository) {
      throw new Error(
        `Failed to create student repository for storage type: ${this.config.storageType}`
      );
    }

    return this.studentRepository;
  }

  /**
   * Create a question repository instance based on the configured storage type.
   * @returns A question repository instance.
   */
  static createQuestionRepository(): QuestionRepository {
    return this.getInstance().createQuestionRepositoryInstance();
  }

  /**
   * Instance method to create a question repository
   */
  createQuestionRepositoryInstance(): QuestionRepository {
    if (this.questionRepository) {
      return this.questionRepository;
    }

    switch (this.config.storageType) {
      case StorageType.POSTGRES:
        this.questionRepository = new PostgresQuestionRepository(
          this.config.postgres.connectionString
        );
        break;
      case StorageType.FIREBASE:
        // Firebase implementation is not available, use PostgreSQL instead
        console.warn("Firebase implementation not available, using PostgreSQL instead");
        this.questionRepository = new PostgresQuestionRepository(
          this.config.postgres.connectionString
        );
        break;
    }

    if (!this.questionRepository) {
      throw new Error(
        `Failed to create question repository for storage type: ${this.config.storageType}`
      );
    }

    return this.questionRepository;
  }

  /**
   * Create an assignment repository instance based on the configured storage type.
   * @returns An assignment repository instance.
   */
  static createAssignmentRepository(): AssignmentRepository {
    return this.getInstance().createAssignmentRepositoryInstance();
  }

  /**
   * Instance method to create an assignment repository
   */
  createAssignmentRepositoryInstance(): AssignmentRepository {
    if (this.assignmentRepository) {
      return this.assignmentRepository;
    }

    switch (this.config.storageType) {
      case StorageType.POSTGRES:
        this.assignmentRepository = new PostgresAssignmentRepository(
          this.config.postgres.connectionString
        );
        break;
      case StorageType.FIREBASE:
        // Firebase implementation is not available, use PostgreSQL instead
        console.warn("Firebase implementation not available, using PostgreSQL instead");
        this.assignmentRepository = new PostgresAssignmentRepository(
          this.config.postgres.connectionString
        );
        break;
    }

    if (!this.assignmentRepository) {
      throw new Error(
        `Failed to create assignment repository for storage type: ${this.config.storageType}`
      );
    }

    return this.assignmentRepository;
  }

  /**
   * Create a student assignment repository instance based on the configured storage type.
   * @returns A student assignment repository instance.
   */
  static createStudentAssignmentRepository(): StudentAssignmentRepository {
    return this.getInstance().createStudentAssignmentRepositoryInstance();
  }

  /**
   * Instance method to create a student assignment repository
   */
  createStudentAssignmentRepositoryInstance(): StudentAssignmentRepository {
    if (this.studentAssignmentRepository) {
      return this.studentAssignmentRepository;
    }

    switch (this.config.storageType) {
      case StorageType.POSTGRES:
        this.studentAssignmentRepository = new PostgresStudentAssignmentRepository(
          this.config.postgres.connectionString
        );
        break;
      case StorageType.FIREBASE:
        // Firebase implementation is not available, use PostgreSQL instead
        console.warn("Firebase implementation not available, using PostgreSQL instead");
        this.studentAssignmentRepository = new PostgresStudentAssignmentRepository(
          this.config.postgres.connectionString
        );
        break;
    }

    if (!this.studentAssignmentRepository) {
      throw new Error(
        `Failed to create student assignment repository for storage type: ${this.config.storageType}`
      );
    }

    return this.studentAssignmentRepository;
  }

  /**
   * Create a student answer repository instance based on the configured storage type.
   * @returns A student answer repository instance.
   */
  static createStudentAnswerRepository(): StudentAnswerRepository {
    return this.getInstance().createStudentAnswerRepositoryInstance();
  }

  /**
   * Instance method to create a student answer repository
   */
  createStudentAnswerRepositoryInstance(): StudentAnswerRepository {
    if (this.studentAnswerRepository) {
      return this.studentAnswerRepository;
    }

    switch (this.config.storageType) {
      case StorageType.POSTGRES:
        this.studentAnswerRepository = new PostgresStudentAnswerRepository(
          this.config.postgres.connectionString
        );
        break;
      case StorageType.FIREBASE:
        // Firebase implementation is not available, use PostgreSQL instead
        console.warn("Firebase implementation not available, using PostgreSQL instead");
        this.studentAnswerRepository = new PostgresStudentAnswerRepository(
          this.config.postgres.connectionString
        );
        break;
    }

    if (!this.studentAnswerRepository) {
      throw new Error(
        `Failed to create student answer repository for storage type: ${this.config.storageType}`
      );
    }

    return this.studentAnswerRepository;
  }
}
