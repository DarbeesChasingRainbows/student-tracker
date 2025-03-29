import { Student } from "../../domain/models/Student.ts";
import { StudentRepository } from "../../ports/repositories/StudentRepository.ts";
import { StudentAssignmentRepository } from "../../ports/repositories/StudentAssignmentRepository.ts";
import { StudentAnswerRepository } from "../../ports/repositories/StudentAnswerRepository.ts";
import { StudentAssignment as _StudentAssignment } from "../../domain/models/StudentAssignment.ts";
import { StudentAnswer as _StudentAnswer } from "../../domain/models/StudentAnswer.ts";

/**
 * Service for handling student-related business logic
 */
export class StudentService {
  constructor(
    private studentRepo: StudentRepository,
    private studentAssignmentRepo: StudentAssignmentRepository,
    private studentAnswerRepo: StudentAnswerRepository,
  ) {}

  /**
   * Create a new student
   */
  async createStudent(student: Omit<Student, "id" | "createdAt" | "updatedAt">): Promise<Student> {
    return await this.studentRepo.save(student);
  }

  /**
   * Get a student by ID
   */
  async getStudentById(id: string): Promise<Student | null> {
    return await this.studentRepo.findById(id);
  }

  /**
   * Get a student by username
   */
  async getStudentByUsername(username: string): Promise<Student | null> {
    return await this.studentRepo.findByUsername(username);
  }

  /**
   * Update a student
   */
  async updateStudent(
    id: string,
    studentData: Partial<Omit<Student, "id" | "createdAt" | "updatedAt">>
  ): Promise<Student | null> {
    const student = await this.studentRepo.findById(id);
    if (!student) {
      return null;
    }

    const updatedStudent = {
      ...student,
      ...studentData,
      updatedAt: new Date(),
    };

    return await this.studentRepo.save(updatedStudent);
  }

  /**
   * Delete a student
   */
  async deleteStudent(id: string): Promise<boolean> {
    return await this.studentRepo.delete(id);
  }

  /**
   * Get all students
   */
  async getAllStudents(): Promise<Student[]> {
    return await this.studentRepo.findAll();
  }

  /**
   * Authenticate a student using username and PIN
   */
  async authenticateStudent(username: string, pin?: string): Promise<Student | null> {
    return await this.studentRepo.authenticate(username, pin);
  }

  /**
   * Get a student's performance metrics
   */
  async getStudentPerformanceMetrics(studentId: string): Promise<{
    totalAssignments: number;
    completedAssignments: number;
    averageScore: number;
    assignmentsByType: Record<string, number>;
    scoresByAssignmentType: Record<string, number>;
  }> {
    const assignments = await this.studentAssignmentRepo.findByStudentId(studentId);
    
    const completedAssignments = assignments.filter(a => a.score !== undefined);
    const averageScore = completedAssignments.length > 0
      ? completedAssignments.reduce((sum, a) => sum + (a.score || 0), 0) / completedAssignments.length
      : 0;
    
    // Count assignments by type
    const assignmentsByType: Record<string, number> = {};
    const scoresByType: Record<string, Record<string, number>> = {};
    
    for (const assignment of assignments) {
      const originalAssignment = await this._getAssignmentType(assignment.assignmentId);
      if (originalAssignment) {
        assignmentsByType[originalAssignment] = (assignmentsByType[originalAssignment] || 0) + 1;
        
        if (assignment.score !== undefined) {
          if (!scoresByType[originalAssignment]) {
            scoresByType[originalAssignment] = {
              sum: 0,
              count: 0,
            };
          }
          
          scoresByType[originalAssignment].sum += assignment.score;
          scoresByType[originalAssignment].count += 1;
        }
      }
    }
    
    // Calculate average scores by type
    const scoresByAssignmentType: Record<string, number> = {};
    for (const [type, data] of Object.entries(scoresByType)) {
      scoresByAssignmentType[type] = data.count > 0 ? data.sum / data.count : 0;
    }
    
    return {
      totalAssignments: assignments.length,
      completedAssignments: completedAssignments.length,
      averageScore,
      assignmentsByType,
      scoresByAssignmentType,
    };
  }

  /**
   * Helper method to get assignment type (internal use only)
   */
  private _getAssignmentType(_assignmentId: string): string | null {
    // This would typically fetch the assignment from a repository
    // For now, we just return a placeholder
    // In a real implementation, you would inject the AssignmentRepository and use it here
    return "homework"; // Placeholder
  }

  /**
   * Get a student's frequently missed concepts
   * (Based on tags of questions they frequently answer incorrectly)
   */
  async getStudentWeakAreas(studentId: string): Promise<{ tag: string; count: number }[]> {
    const _incorrectAnswers = await this.studentAnswerRepo.findIncorrectByStudentId(studentId);
    
    // In a real implementation, we would fetch the questions and extract tags
    // For now, we'll return a placeholder
    return [
      { tag: "algebra", count: 5 },
      { tag: "fractions", count: 3 },
    ];
  }

  /**
   * Track a student's progress over time
   */
  async getStudentProgressOverTime(studentId: string): Promise<{
    dates: string[];
    scores: number[];
  }> {
    const assignments = await this.studentAssignmentRepo.findByStudentId(studentId);
    
    // Filter to completed assignments with scores and sort by date
    const completedAssignments = assignments
      .filter(a => a.score !== undefined && a.gradedAt !== undefined)
      .sort((a, b) => {
        const dateA = a.gradedAt?.getTime() || 0;
        const dateB = b.gradedAt?.getTime() || 0;
        return dateA - dateB;
      });
    
    const dates = completedAssignments.map(a => 
      a.gradedAt ? a.gradedAt.toISOString().split('T')[0] : ''
    );
    
    const scores = completedAssignments.map(a => a.score || 0);
    
    return { dates, scores };
  }
}
