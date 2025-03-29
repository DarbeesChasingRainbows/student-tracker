import { Student } from "../../domain/models/Student.ts";

/**
 * Repository interface for Student entities following the repository pattern
 */
export interface StudentRepository {
  /**
   * Find a student by their unique identifier
   */
  findById(id: string): Promise<Student | null>;
  
  /**
   * Find a student by their username
   */
  findByUsername(username: string): Promise<Student | null>;
  
  /**
   * Save a new student or update an existing one
   */
  save(student: Omit<Student, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Student>;
  
  /**
   * Delete a student by their unique identifier
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * List all students
   */
  findAll(): Promise<Student[]>;
  
  /**
   * Authenticate a student using username and PIN (if PIN is set)
   */
  authenticate(username: string, pin?: string): Promise<Student | null>;
}
