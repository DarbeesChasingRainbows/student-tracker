import { RepositoryFactory } from "../repositories/RepositoryFactory.ts";
import { StudentRepository } from "../../ports/repositories/StudentRepository.ts";
import { QuestionRepository } from "../../ports/repositories/QuestionRepository.ts";
import { AssignmentRepository } from "../../ports/repositories/AssignmentRepository.ts";
import { StudentAssignmentRepository } from "../../ports/repositories/StudentAssignmentRepository.ts";
import { StudentAnswerRepository } from "../../ports/repositories/StudentAnswerRepository.ts";
import { initializeDatabase } from "../db/initializeDatabase.ts";
import config from "../../config/database.ts";

/**
 * Database service that provides access to all repositories
 * This is the main entry point for database operations
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private initialized = false;

  private studentRepository: StudentRepository;
  private questionRepository: QuestionRepository;
  private assignmentRepository: AssignmentRepository;
  private studentAssignmentRepository: StudentAssignmentRepository;
  private studentAnswerRepository: StudentAnswerRepository;

  private constructor() {
    // Configure repository factory with database settings
    RepositoryFactory.configure(config);

    // Create repositories
    this.studentRepository = RepositoryFactory.createStudentRepository();
    this.questionRepository = RepositoryFactory.createQuestionRepository();
    this.assignmentRepository = RepositoryFactory.createAssignmentRepository();
    this.studentAssignmentRepository = RepositoryFactory.createStudentAssignmentRepository();
    this.studentAnswerRepository = RepositoryFactory.createStudentAnswerRepository();
  }

  /**
   * Get the singleton instance of the database service
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize the database
   * This should be called when the application starts
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize database schema
      await initializeDatabase();
      this.initialized = true;
      console.log("Database service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database service:", error);
      throw error;
    }
  }

  /**
   * Get the student repository
   */
  public getStudentRepository(): StudentRepository {
    return this.studentRepository;
  }

  /**
   * Get the question repository
   */
  public getQuestionRepository(): QuestionRepository {
    return this.questionRepository;
  }

  /**
   * Get the assignment repository
   */
  public getAssignmentRepository(): AssignmentRepository {
    return this.assignmentRepository;
  }

  /**
   * Get the student assignment repository
   */
  public getStudentAssignmentRepository(): StudentAssignmentRepository {
    return this.studentAssignmentRepository;
  }

  /**
   * Get the student answer repository
   */
  public getStudentAnswerRepository(): StudentAnswerRepository {
    return this.studentAnswerRepository;
  }

  /**
   * Close all database connections
   * This should be called when the application shuts down
   */
  public async close(): Promise<void> {
    try {
      await this.studentRepository.close();
      await this.questionRepository.close();
      await this.assignmentRepository.close();
      await this.studentAssignmentRepository.close();
      await this.studentAnswerRepository.close();
      console.log("Database connections closed successfully");
    } catch (error) {
      console.error("Error closing database connections:", error);
      throw error;
    }
  }
}
