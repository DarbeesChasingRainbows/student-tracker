import { Student, StudentSchema } from "../../domain/models/Student.ts";
import { StudentRepository } from "../../ports/repositories/StudentRepository.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

/**
 * PostgreSQL implementation of StudentRepository
 * Stores student data in a PostgreSQL database
 */
export class PostgresStudentRepository implements StudentRepository {
  private pool: Pool;
  private initialized = false;

  constructor(connectionString: string) {
    this.pool = new Pool(connectionString, 5);
  }

  /**
   * Initialize the repository by creating necessary tables
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      // Create students table if it doesn't exist
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS students (
          id UUID PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          email TEXT,
          grade TEXT NOT NULL,
          pin TEXT,
          avatar_id TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `);

      // Create indices for performance optimization
      await client.queryObject(`
        CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
      `);

      // Commit transaction
      await client.queryObject("COMMIT");

      this.initialized = true;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error("Error initializing PostgreSQL repository:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Convert database row to Student entity
   */
  private rowToStudent(row: Record<string, unknown>): Student {
    try {
      // Convert snake_case column names to camelCase for our entity
      const studentData = {
        id: row.id as string,
        firstName: row.first_name as string,
        lastName: row.last_name as string,
        name: row.name as string,
        username: row.username as string,
        email: row.email as string | null,
        grade: row.grade as string,
        pin: row.pin as string | null,
        avatarId: row.avatar_id as string,
        notes: row.notes as string | null,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        assignmentsCompleted: 0,
        averageScore: 0,
        lastActive: new Date(),
      };
      
      // Validate and return the student entity
      return StudentSchema.parse(studentData);
    } catch (error) {
      console.error("Invalid student data from database:", error);
      throw new Error("Invalid student data from database");
    }
  }

  /**
   * Find a student by ID
   */
  async findById(id: string): Promise<Student | null> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM students WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return this.rowToStudent(row);
    } catch (error) {
      console.error(`Error finding student with ID ${id}:`, error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Find a student by username
   */
  async findByUsername(username: string): Promise<Student | null> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM students WHERE username = $1
      `, [username]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return this.rowToStudent(row);
    } catch (error) {
      console.error(`Error finding student with username ${username}:`, error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Save a new student or update an existing one
   */
  async save(studentData: Omit<Student, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Student> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Start transaction
      await client.queryObject("BEGIN");

      const now = new Date();
      let student: Student;

      if (studentData.id) {
        // Check if student exists
        const existingResult = await client.queryObject<{ count: number }>(`
          SELECT COUNT(*) as count FROM students WHERE id = $1
        `, [studentData.id]);

        const exists = existingResult.rows[0].count > 0;

        if (exists) {
          // Update existing student
          const result = await client.queryObject<Record<string, unknown>>(`
            UPDATE students SET
              first_name = $1,
              last_name = $2,
              name = $3,
              username = $4,
              email = $5,
              grade = $6,
              pin = $7,
              avatar_id = $8,
              notes = $9,
              updated_at = $10
            WHERE id = $11
            RETURNING *
          `, [
            studentData.firstName,
            studentData.lastName,
            studentData.name,
            studentData.username,
            studentData.email || null,
            studentData.grade,
            studentData.pin || null,
            studentData.avatarId,
            studentData.notes || null,
            now.toISOString(),
            studentData.id
          ]);

          student = this.rowToStudent(result.rows[0]);
        } else {
          // Create new student with provided ID
          const result = await client.queryObject<Record<string, unknown>>(`
            INSERT INTO students (
              id, first_name, last_name, name, username, email, grade, pin, 
              avatar_id, notes, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            )
            RETURNING *
          `, [
            studentData.id,
            studentData.firstName,
            studentData.lastName,
            studentData.name,
            studentData.username,
            studentData.email || null,
            studentData.grade,
            studentData.pin || null,
            studentData.avatarId,
            studentData.notes || null,
            now.toISOString(),
            now.toISOString()
          ]);

          student = this.rowToStudent(result.rows[0]);
        }
      } else {
        // Create new student with generated UUID
        const id = crypto.randomUUID();
        const result = await client.queryObject<Record<string, unknown>>(`
          INSERT INTO students (
            id, first_name, last_name, name, username, email, grade, pin, 
            avatar_id, notes, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
          RETURNING *
        `, [
          id,
          studentData.firstName,
          studentData.lastName,
          studentData.name,
          studentData.username,
          studentData.email || null,
          studentData.grade,
          studentData.pin || null,
          studentData.avatarId,
          studentData.notes || null,
          now.toISOString(),
          now.toISOString()
        ]);

        student = this.rowToStudent(result.rows[0]);
      }

      // Commit transaction
      await client.queryObject("COMMIT");

      return student;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error("Error saving student:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a student by ID
   */
  async delete(id: string): Promise<boolean> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Start transaction
      await client.queryObject("BEGIN");

      const result = await client.queryObject<{ count: number }>(`
        DELETE FROM students WHERE id = $1 RETURNING COUNT(*) as count
      `, [id]);

      const deleted = result.rows[0].count > 0;

      // Commit transaction
      await client.queryObject("COMMIT");

      return deleted;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error(`Error deleting student ${id}:`, error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * List all students
   */
  async findAll(): Promise<Student[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM students ORDER BY created_at DESC
      `);

      return result.rows.map(row => this.rowToStudent(row));
    } catch (error) {
      console.error("Error finding all students:", error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Authenticate a student using username and PIN
   */
  async authenticate(username: string, pin?: string): Promise<Student | null> {
    await this.initialize();

    const student = await this.findByUsername(username);
    
    if (!student) {
      return null;
    }

    // If student has PIN, it must match
    if (student.pin && pin !== student.pin) {
      return null;
    }

    return student;
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
