import { RepositoryFactory } from "./RepositoryFactory.ts";
import databaseConfig from "../../config/database.ts";

// Configure the repository factory with settings from the database config
RepositoryFactory.configure(databaseConfig);

// Create and export repository instances
export const studentRepository = RepositoryFactory.createStudentRepository();
export const assignmentRepository = RepositoryFactory.createAssignmentRepository();
export const studentAssignmentRepository = RepositoryFactory.createStudentAssignmentRepository();
export const questionRepository = RepositoryFactory.createQuestionRepository();
export const studentAnswerRepository = RepositoryFactory.createStudentAnswerRepository();

/**
 * Helper function to get all repositories
 */
export function getRepositories() {
  return {
    studentRepository,
    assignmentRepository,
    studentAssignmentRepository,
    questionRepository,
    studentAnswerRepository
  };
}

// Export repository implementations and factory
export { PostgresStudentRepository } from "./PostgresStudentRepository.ts";
export { RepositoryFactory, StorageType } from "./RepositoryFactory.ts";
