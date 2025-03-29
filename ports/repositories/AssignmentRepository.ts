import { Assignment, AssignmentStatus, AssignmentType } from "../../domain/models/Assignment.ts";

/**
 * Repository interface for Assignment entities following the repository pattern
 */
export interface AssignmentRepository {
  /**
   * Find an assignment by its unique identifier
   */
  findById(id: string): Promise<Assignment | null>;
  
  /**
   * Save a new assignment or update an existing one
   */
  save(assignment: Omit<Assignment, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Assignment>;
  
  /**
   * Delete an assignment by its unique identifier
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Find all assignments created by a specific admin/teacher
   */
  findByCreator(creatorId: string): Promise<Assignment[]>;
  
  /**
   * Find assignments by type (homework, quiz, test)
   */
  findByType(type: AssignmentType): Promise<Assignment[]>;
  
  /**
   * Find assignments by status
   */
  findByStatus(status: AssignmentStatus): Promise<Assignment[]>;
  
  /**
   * Find all assignments
   */
  findAll(): Promise<Assignment[]>;
  
  /**
   * Update assignment status
   */
  updateStatus(id: string, status: AssignmentStatus): Promise<Assignment | null>;
}
