import { 
  StudentAssignment, 
  StudentAssignmentSchema, 
  StudentAssignmentStatus 
} from "../../domain/models/StudentAssignment.ts";
import { StudentAssignmentRepository } from "../../ports/repositories/StudentAssignmentRepository.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

/**
 * PostgreSQL implementation of StudentAssignmentRepository
 * Stores student assignment data in a PostgreSQL database
 */
export class PostgresStudentAssignmentRepository implements StudentAssignmentRepository {
  private pool: Pool;
  private initialized = false;

  constructor(connectionString: string) {
    this.pool = new Pool(connectionString, 5);
  }

  /**
   * Initialize the repository
   * Note: Tables are created in PostgresStudentRepository
   */
  private initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Convert database row to StudentAssignment entity
   */
  private rowToStudentAssignment(row: Record<string, unknown>): StudentAssignment {
    // Convert student assignment data
    const studentAssignmentData = {
      id: row.id as string,
      studentId: row.student_id as string,
      assignmentId: row.assignment_id as string,
      status: row.status as string,
      score: row.score as number | undefined,
      startedAt: row.started_at ? new Date(row.started_at as string) : undefined,
      submittedAt: row.submitted_at ? new Date(row.submitted_at as string) : undefined,
      gradedAt: row.graded_at ? new Date(row.graded_at as string) : undefined,
      attempts: row.attempts as number,
      feedback: row.feedback as string | undefined,
      isAdaptive: row.is_adaptive as boolean,
      originalAssignmentId: row.original_assignment_id as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };

    // Validate with schema
    const result = StudentAssignmentSchema.safeParse(studentAssignmentData);
    if (!result.success) {
      console.error("Invalid student assignment data from database:", result.error);
      throw new Error("Invalid student assignment data from database");
    }

    return result.data;
  }

  /**
   * Find a student assignment by ID
   */
  async findById(id: string): Promise<StudentAssignment | null> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_assignments WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.rowToStudentAssignment(result.rows[0]);
    } catch (error) {
      console.error(`Error finding student assignment with ID ${id}:`, error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Save a student assignment
   */
  async save(studentAssignmentData: Omit<StudentAssignment, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<StudentAssignment> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      const now = new Date();
      const id = studentAssignmentData.id || crypto.randomUUID();

      // Check if student assignment exists
      let exists = false;
      if (studentAssignmentData.id) {
        const existingResult = await client.queryObject<{ count: number }>(`
          SELECT COUNT(*) as count FROM student_assignments WHERE id = $1
        `, [studentAssignmentData.id]);
        exists = existingResult.rows[0].count > 0;
      }

      // Save student assignment data
      if (exists) {
        await client.queryObject(`
          UPDATE student_assignments SET
            status = $1,
            score = $2,
            started_at = $3,
            submitted_at = $4,
            graded_at = $5,
            attempts = $6,
            feedback = $7,
            is_adaptive = $8,
            original_assignment_id = $9,
            updated_at = $10
          WHERE id = $11
        `, [
          studentAssignmentData.status,
          studentAssignmentData.score || null,
          studentAssignmentData.startedAt?.toISOString() || null,
          studentAssignmentData.submittedAt?.toISOString() || null,
          studentAssignmentData.gradedAt?.toISOString() || null,
          studentAssignmentData.attempts,
          studentAssignmentData.feedback || null,
          studentAssignmentData.isAdaptive,
          studentAssignmentData.originalAssignmentId || null,
          now.toISOString(),
          id
        ]);
      } else {
        await client.queryObject(`
          INSERT INTO student_assignments (
            id, student_id, assignment_id, status, score, started_at, submitted_at, 
            graded_at, attempts, feedback, is_adaptive, original_assignment_id, 
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
        `, [
          id,
          studentAssignmentData.studentId,
          studentAssignmentData.assignmentId,
          studentAssignmentData.status,
          studentAssignmentData.score || null,
          studentAssignmentData.startedAt?.toISOString() || null,
          studentAssignmentData.submittedAt?.toISOString() || null,
          studentAssignmentData.gradedAt?.toISOString() || null,
          studentAssignmentData.attempts,
          studentAssignmentData.feedback || null,
          studentAssignmentData.isAdaptive,
          studentAssignmentData.originalAssignmentId || null,
          now.toISOString(),
          now.toISOString()
        ]);
      }

      // Commit transaction
      await client.queryObject("COMMIT");

      // Return the saved student assignment
      return await this.findById(id) as StudentAssignment;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error("Error saving student assignment:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a student assignment
   */
  async delete(id: string): Promise<boolean> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      // Delete the student assignment (cascade will handle related data)
      const result = await client.queryObject<{ count: number }>(`
        DELETE FROM student_assignments WHERE id = $1 RETURNING COUNT(*) as count
      `, [id]);

      // Commit transaction
      await client.queryObject("COMMIT");

      return result.rows[0].count > 0;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error(`Error deleting student assignment ${id}:`, error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Find all student assignments for a student
   */
  async findByStudentId(studentId: string): Promise<StudentAssignment[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_assignments 
        WHERE student_id = $1
        ORDER BY created_at DESC
      `, [studentId]);

      return result.rows.map(row => this.rowToStudentAssignment(row));
    } catch (error) {
      console.error(`Error finding student assignments for student ${studentId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find all student assignments for an assignment
   */
  async findByAssignmentId(assignmentId: string): Promise<StudentAssignment[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_assignments 
        WHERE assignment_id = $1
        ORDER BY created_at DESC
      `, [assignmentId]);

      return result.rows.map(row => this.rowToStudentAssignment(row));
    } catch (error) {
      console.error(`Error finding student assignments for assignment ${assignmentId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find all student assignments with a specific status
   */
  async findByStatus(status: StudentAssignmentStatus): Promise<StudentAssignment[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_assignments 
        WHERE status = $1
        ORDER BY created_at DESC
      `, [status]);

      return result.rows.map(row => this.rowToStudentAssignment(row));
    } catch (error) {
      console.error(`Error finding student assignments with status ${status}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find all student assignments
   */
  async findAll(): Promise<StudentAssignment[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_assignments ORDER BY created_at DESC
      `);

      const assignments: StudentAssignment[] = [];
      for (const row of result.rows) {
        const assignment = await this.findById(row.id as string);
        if (assignment) {
          assignments.push(assignment);
        }
      }

      return assignments;
    } catch (error) {
      console.error("Error finding all student assignments:", error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Update student assignment status
   */
  async updateStatus(id: string, status: StudentAssignmentStatus): Promise<StudentAssignment | null> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      // Update student assignment status
      const now = new Date();
      const result = await client.queryObject<Record<string, unknown>>(`
        UPDATE student_assignments
        SET status = $1, updated_at = $2
        WHERE id = $3
        RETURNING *
      `, [status, now.toISOString(), id]);

      // Commit transaction
      await client.queryObject("COMMIT");

      if (result.rows.length === 0) {
        return null;
      }

      return await this.findById(result.rows[0].id as string);
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error(`Error updating status for student assignment ${id}:`, error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Record a grade change in the grade history
   */
  async recordGradeChange(
    studentAssignmentId: string, 
    previousScore: number | null, 
    newScore: number, 
    changedBy: string,
    reason?: string
  ): Promise<boolean> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const now = new Date();
      const id = crypto.randomUUID();

      await client.queryObject(`
        INSERT INTO grade_history (
          id, student_assignment_id, previous_score, new_score, 
          changed_by, reason, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )
      `, [
        id,
        studentAssignmentId,
        previousScore,
        newScore,
        changedBy,
        reason || null,
        now.toISOString()
      ]);

      return true;
    } catch (error) {
      console.error(`Error recording grade change for student assignment ${studentAssignmentId}:`, error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Get grade history for a student assignment
   */
  async getGradeHistory(studentAssignmentId: string): Promise<Array<{
    id: string;
    previousScore: number | null;
    newScore: number;
    changedBy: string;
    reason?: string;
    createdAt: Date;
  }>> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM grade_history 
        WHERE student_assignment_id = $1
        ORDER BY created_at DESC
      `, [studentAssignmentId]);

      return result.rows.map(row => ({
        id: row.id as string,
        previousScore: row.previous_score as number | null,
        newScore: row.new_score as number,
        changedBy: row.changed_by as string,
        reason: row.reason as string | undefined,
        createdAt: new Date(row.created_at as string),
      }));
    } catch (error) {
      console.error(`Error getting grade history for student assignment ${studentAssignmentId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find student assignments below score threshold
   */
  async findBelowScoreThreshold(threshold: number): Promise<StudentAssignment[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_assignments 
        WHERE score < $1 AND status = $2
        ORDER BY created_at DESC
      `, [threshold, StudentAssignmentStatus.COMPLETED]);

      const assignments: StudentAssignment[] = [];
      for (const row of result.rows) {
        const assignment = await this.findById(row.id as string);
        if (assignment) {
          assignments.push(assignment);
        }
      }

      return assignments;
    } catch (error) {
      console.error(`Error finding student assignments below score threshold ${threshold}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find adaptive assignments for a student
   */
  async findAdaptiveAssignments(studentId: string): Promise<StudentAssignment[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT sa.* FROM student_assignments sa
        JOIN assignments a ON sa.assignment_id = a.id
        WHERE sa.student_id = $1 AND a.type = 'adaptive'
        ORDER BY sa.created_at DESC
      `, [studentId]);

      const assignments: StudentAssignment[] = [];
      for (const row of result.rows) {
        const assignment = await this.findById(row.id as string);
        if (assignment) {
          assignments.push(assignment);
        }
      }

      return assignments;
    } catch (error) {
      console.error(`Error finding adaptive assignments for student ${studentId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Get student performance statistics by subject
   * Returns average score and completed assignments count per subject
   */
  async getStudentPerformanceBySubject(studentId: string): Promise<Array<{
    subject: string;
    averageScore: number;
    assignmentsCompleted: number;
  }>> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT 
          a.subject,
          AVG(sa.score) as average_score,
          COUNT(*) as assignments_completed
        FROM 
          student_assignments sa
        JOIN 
          assignments a ON sa.assignment_id = a.id
        WHERE 
          sa.student_id = $1
          AND sa.status = $2
          AND sa.score IS NOT NULL
        GROUP BY 
          a.subject
        ORDER BY 
          a.subject ASC
      `, [studentId, StudentAssignmentStatus.COMPLETED]);

      return result.rows.map(row => ({
        subject: row.subject as string,
        averageScore: Math.round(row.average_score as number),
        assignmentsCompleted: Number(row.assignments_completed),
      }));
    } catch (error) {
      console.error(`Error getting performance statistics for student ${studentId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Get student assignment statistics
   * Returns total assignments, completed assignments, and average score
   */
  async getStudentStatistics(studentId: string): Promise<{
    totalAssignments: number;
    completedAssignments: number;
    averageScore: number;
  }> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Get total assignments
      const totalResult = await client.queryObject<{ count: number }>(`
        SELECT COUNT(*) as count FROM student_assignments 
        WHERE student_id = $1
      `, [studentId]);
      
      // Get completed assignments and average score
      const completedResult = await client.queryObject<{ 
        count: number;
        avg_score: number | null;
      }>(`
        SELECT 
          COUNT(*) as count,
          AVG(score) as avg_score
        FROM student_assignments 
        WHERE student_id = $1 AND status = $2
      `, [studentId, StudentAssignmentStatus.COMPLETED]);

      return {
        totalAssignments: totalResult.rows[0].count,
        completedAssignments: completedResult.rows[0].count,
        averageScore: completedResult.rows[0].avg_score ? 
          Math.round(completedResult.rows[0].avg_score) : 0,
      };
    } catch (error) {
      console.error(`Error getting statistics for student ${studentId}:`, error);
      return {
        totalAssignments: 0,
        completedAssignments: 0,
        averageScore: 0,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
