import { StudentAssignment, StudentAssignmentStatus } from "../../domain/models/StudentAssignment.ts";

/**
 * Repository interface for StudentAssignment entities following the repository pattern
 */
export interface StudentAssignmentRepository {
  /**
   * Find a student assignment by its unique identifier
   */
  findById(id: string): Promise<StudentAssignment | null>;
  
  /**
   * Save a new student assignment or update an existing one
   */
  save(studentAssignment: Omit<StudentAssignment, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<StudentAssignment>;
  
  /**
   * Delete a student assignment by its unique identifier
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Find all assignments for a specific student
   */
  findByStudentId(studentId: string): Promise<StudentAssignment[]>;
  
  /**
   * Find all student assignments for a specific assignment
   */
  findByAssignmentId(assignmentId: string): Promise<StudentAssignment[]>;
  
  /**
   * Find all student assignments by status
   */
  findByStatus(status: StudentAssignmentStatus): Promise<StudentAssignment[]>;
  
  /**
   * Find all student assignments
   */
  findAll(): Promise<StudentAssignment[]>;
  
  /**
   * Update student assignment status
   */
  updateStatus(id: string, status: StudentAssignmentStatus): Promise<StudentAssignment | null>;
  
  /**
   * Find student assignments below a certain score threshold
   * (for generating adaptive assignments)
   */
  findBelowScoreThreshold(threshold: number): Promise<StudentAssignment[]>;
  
  /**
   * Find student assignments that are adaptive reassignments
   */
  findAdaptiveAssignments(originalAssignmentId: string): Promise<StudentAssignment[]>;
}
