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

      // Create guardians table if it doesn't exist
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS guardians (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `);

      // Create students table if it doesn't exist
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS students (
          id UUID PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          email TEXT,
          grade TEXT NOT NULL,
          pin TEXT,
          avatar_id TEXT NOT NULL,
          guardian_id UUID,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
          FOREIGN KEY (guardian_id) REFERENCES guardians(id)
        )
      `);

      // Create question_tags table for categorizing questions
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS question_tags (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `);

      // Create questions table - base table for all question types
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS questions (
          id UUID PRIMARY KEY,
          prompt TEXT NOT NULL,
          type TEXT NOT NULL,
          difficulty_level TEXT NOT NULL,
          explanation TEXT,
          created_by UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `);

      // Create question_tags_map for many-to-many relationship between questions and tags
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS question_tags_map (
          question_id UUID NOT NULL,
          tag_id UUID NOT NULL,
          PRIMARY KEY (question_id, tag_id),
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES question_tags(id) ON DELETE CASCADE
        )
      `);

      // Create multiple_choice_options table for multiple choice questions
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS multiple_choice_options (
          id UUID PRIMARY KEY,
          question_id UUID NOT NULL,
          text TEXT NOT NULL,
          is_correct BOOLEAN NOT NULL DEFAULT FALSE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
      `);

      // Create true_false_answers table for true/false questions
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS true_false_answers (
          question_id UUID PRIMARY KEY,
          correct_answer BOOLEAN NOT NULL,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
      `);

      // Create short_answer_answers table for short answer questions
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS short_answer_answers (
          id UUID PRIMARY KEY,
          question_id UUID NOT NULL,
          correct_answer TEXT NOT NULL,
          case_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
      `);

      // Create essay_questions table for essay questions
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS essay_questions (
          question_id UUID PRIMARY KEY,
          rubric TEXT,
          word_limit INTEGER,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
      `);

      // Create matching_pairs table for matching questions
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS matching_pairs (
          id UUID PRIMARY KEY,
          question_id UUID NOT NULL,
          left_text TEXT NOT NULL,
          right_text TEXT NOT NULL,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
      `);

      // Create assignments table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS assignments (
          id UUID PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          created_by UUID NOT NULL,
          status TEXT NOT NULL,
          due_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `);

      // Create assignment_settings table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS assignment_settings (
          assignment_id UUID PRIMARY KEY,
          allow_retake BOOLEAN NOT NULL DEFAULT FALSE,
          allow_question_retry BOOLEAN NOT NULL DEFAULT FALSE,
          confetti_threshold INTEGER NOT NULL DEFAULT 80,
          confetti_on_correct_answer BOOLEAN NOT NULL DEFAULT FALSE,
          adaptive_reassign_threshold INTEGER NOT NULL DEFAULT 80,
          FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
        )
      `);

      // Create assignment_questions table for many-to-many relationship
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS assignment_questions (
          assignment_id UUID NOT NULL,
          question_id UUID NOT NULL,
          question_order INTEGER NOT NULL,
          PRIMARY KEY (assignment_id, question_id),
          FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
      `);

      // Create student_assignments table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS student_assignments (
          id UUID PRIMARY KEY,
          student_id UUID NOT NULL,
          assignment_id UUID NOT NULL,
          status TEXT NOT NULL,
          score NUMERIC(5,2),
          started_at TIMESTAMP WITH TIME ZONE,
          submitted_at TIMESTAMP WITH TIME ZONE,
          graded_at TIMESTAMP WITH TIME ZONE,
          attempts INTEGER NOT NULL DEFAULT 0,
          feedback TEXT,
          is_adaptive BOOLEAN NOT NULL DEFAULT FALSE,
          original_assignment_id UUID,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
          FOREIGN KEY (original_assignment_id) REFERENCES student_assignments(id) ON DELETE SET NULL
        )
      `);

      // Create student_answers table - base table for all answer types
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS student_answers (
          id UUID PRIMARY KEY,
          student_id UUID NOT NULL,
          question_id UUID NOT NULL,
          student_assignment_id UUID NOT NULL,
          is_correct BOOLEAN,
          attempt_number INTEGER NOT NULL DEFAULT 1,
          question_type TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
          FOREIGN KEY (student_assignment_id) REFERENCES student_assignments(id) ON DELETE CASCADE
        )
      `);

      // Create multiple_choice_answers table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS multiple_choice_answers (
          student_answer_id UUID PRIMARY KEY,
          selected_option_id UUID NOT NULL,
          FOREIGN KEY (student_answer_id) REFERENCES student_answers(id) ON DELETE CASCADE,
          FOREIGN KEY (selected_option_id) REFERENCES multiple_choice_options(id) ON DELETE CASCADE
        )
      `);

      // Create true_false_answers table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS true_false_student_answers (
          student_answer_id UUID PRIMARY KEY,
          answer BOOLEAN NOT NULL,
          FOREIGN KEY (student_answer_id) REFERENCES student_answers(id) ON DELETE CASCADE
        )
      `);

      // Create short_answer_student_answers table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS short_answer_student_answers (
          student_answer_id UUID PRIMARY KEY,
          answer TEXT NOT NULL,
          FOREIGN KEY (student_answer_id) REFERENCES student_answers(id) ON DELETE CASCADE
        )
      `);

      // Create essay_student_answers table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS essay_student_answers (
          student_answer_id UUID PRIMARY KEY,
          answer TEXT NOT NULL,
          feedback TEXT,
          score NUMERIC(5,2),
          FOREIGN KEY (student_answer_id) REFERENCES student_answers(id) ON DELETE CASCADE
        )
      `);

      // Create matching_student_answers table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS matching_student_answers (
          student_answer_id UUID PRIMARY KEY,
          FOREIGN KEY (student_answer_id) REFERENCES student_answers(id) ON DELETE CASCADE
        )
      `);

      // Create matching_student_pairs table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS matching_student_pairs (
          id UUID PRIMARY KEY,
          student_answer_id UUID NOT NULL,
          left_id UUID NOT NULL,
          right_id UUID NOT NULL,
          FOREIGN KEY (student_answer_id) REFERENCES matching_student_answers(id) ON DELETE CASCADE,
          FOREIGN KEY (left_id) REFERENCES matching_pairs(id) ON DELETE CASCADE,
          FOREIGN KEY (right_id) REFERENCES matching_pairs(id) ON DELETE CASCADE
        )
      `);

      // Create grade_history table for tracking score changes
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS grade_history (
          id UUID PRIMARY KEY,
          student_assignment_id UUID NOT NULL,
          previous_score NUMERIC(5,2),
          new_score NUMERIC(5,2) NOT NULL,
          changed_by UUID NOT NULL,
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          FOREIGN KEY (student_assignment_id) REFERENCES student_assignments(id) ON DELETE CASCADE
        )
      `);

      // Create spaced_repetition_items table for tracking items for review
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS spaced_repetition_items (
          id UUID PRIMARY KEY,
          student_id UUID NOT NULL,
          question_id UUID NOT NULL,
          ease_factor NUMERIC(4,3) NOT NULL DEFAULT 2.5,
          interval_days INTEGER NOT NULL DEFAULT 1,
          next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
          review_count INTEGER NOT NULL DEFAULT 0,
          last_reviewed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
          UNIQUE(student_id, question_id)
        )
      `);

      // Create indices for performance optimization
      await client.queryObject(`
        CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id ON student_assignments(student_id);
        CREATE INDEX IF NOT EXISTS idx_student_assignments_assignment_id ON student_assignments(assignment_id);
        CREATE INDEX IF NOT EXISTS idx_student_answers_student_id ON student_answers(student_id);
        CREATE INDEX IF NOT EXISTS idx_student_answers_question_id ON student_answers(question_id);
        CREATE INDEX IF NOT EXISTS idx_student_answers_student_assignment_id ON student_answers(student_assignment_id);
        CREATE INDEX IF NOT EXISTS idx_assignment_questions_assignment_id ON assignment_questions(assignment_id);
        CREATE INDEX IF NOT EXISTS idx_assignment_questions_question_id ON assignment_questions(question_id);
        CREATE INDEX IF NOT EXISTS idx_question_tags_map_question_id ON question_tags_map(question_id);
        CREATE INDEX IF NOT EXISTS idx_question_tags_map_tag_id ON question_tags_map(tag_id);
        CREATE INDEX IF NOT EXISTS idx_spaced_repetition_items_student_id ON spaced_repetition_items(student_id);
        CREATE INDEX IF NOT EXISTS idx_spaced_repetition_items_next_review_date ON spaced_repetition_items(next_review_date);
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
  private rowToStudent(row: Record<string, unknown>, guardianRow?: Record<string, unknown> | null): Student {
    // Convert snake_case column names to camelCase for our entity
    const studentData = {
      id: row.id as string,
      firstName: row.first_name as string,
      lastName: row.last_name as string,
      name: `${row.first_name} ${row.last_name}`, // Derive name from first_name and last_name
      username: row.username as string,
      email: row.email as string | undefined,
      grade: row.grade as string,
      pin: row.pin as string | undefined,
      avatarId: row.avatar_id as string,
      guardianName: guardianRow?.name as string | undefined,
      guardianEmail: guardianRow?.email as string | undefined,
      guardianPhone: guardianRow?.phone as string | undefined,
      notes: row.notes as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };

    // Validate with schema
    const result = StudentSchema.safeParse(studentData);
    if (!result.success) {
      console.error("Invalid student data from database:", result.error);
      throw new Error("Invalid student data from database");
    }

    return result.data;
  }

  /**
   * Find a student by ID
   */
  async findById(id: string): Promise<Student | null> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT s.*, g.name as guardian_name, g.email as guardian_email, g.phone as guardian_phone
        FROM students s
        LEFT JOIN guardians g ON s.guardian_id = g.id
        WHERE s.id = $1
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
        SELECT s.*, g.name as guardian_name, g.email as guardian_email, g.phone as guardian_phone
        FROM students s
        LEFT JOIN guardians g ON s.guardian_id = g.id
        WHERE s.username = $1
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
      let guardianId: string | null = null;

      // Handle guardian data if provided
      if (studentData.guardianName) {
        // Check if a guardian with the same email already exists
        let guardianResult = undefined;
        
        if (studentData.guardianEmail) {
          guardianResult = await client.queryObject<Record<string, unknown>>(`
            SELECT id FROM guardians WHERE email = $1
          `, [studentData.guardianEmail]);
        }

        if (guardianResult && guardianResult.rows.length > 0) {
          // Use existing guardian
          guardianId = guardianResult.rows[0].id as string;
          
          // Update guardian information
          await client.queryObject(`
            UPDATE guardians SET
              name = $1,
              phone = $2,
              updated_at = $3
            WHERE id = $4
          `, [
            studentData.guardianName,
            studentData.guardianPhone || null,
            now.toISOString(),
            guardianId
          ]);
        } else {
          // Create new guardian
          const newGuardianId = crypto.randomUUID();
          await client.queryObject(`
            INSERT INTO guardians (
              id, name, email, phone, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6
            )
          `, [
            newGuardianId,
            studentData.guardianName,
            studentData.guardianEmail || null,
            studentData.guardianPhone || null,
            now.toISOString(),
            now.toISOString()
          ]);
          
          guardianId = newGuardianId;
        }
      }

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
              username = $3,
              email = $4,
              grade = $5,
              pin = $6,
              avatar_id = $7,
              guardian_id = $8,
              notes = $9,
              updated_at = $10
            WHERE id = $11
            RETURNING *
          `, [
            studentData.firstName,
            studentData.lastName,
            studentData.username,
            studentData.email || null,
            studentData.grade,
            studentData.pin || null,
            studentData.avatarId,
            guardianId,
            studentData.notes || null,
            now.toISOString(),
            studentData.id
          ]);

          // Get guardian information if there's a guardian_id
          let guardianRow = null;
          if (guardianId) {
            const guardianResult = await client.queryObject<Record<string, unknown>>(`
              SELECT * FROM guardians WHERE id = $1
            `, [guardianId]);
            
            if (guardianResult.rows.length > 0) {
              guardianRow = guardianResult.rows[0];
            }
          }

          student = this.rowToStudent(result.rows[0], guardianRow);
        } else {
          // Create new student with provided ID
          const result = await client.queryObject<Record<string, unknown>>(`
            INSERT INTO students (
              id, first_name, last_name, username, email, grade, pin, 
              avatar_id, guardian_id, notes, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            )
            RETURNING *
          `, [
            studentData.id,
            studentData.firstName,
            studentData.lastName,
            studentData.username,
            studentData.email || null,
            studentData.grade,
            studentData.pin || null,
            studentData.avatarId,
            guardianId,
            studentData.notes || null,
            now.toISOString(),
            now.toISOString()
          ]);

          // Get guardian information if there's a guardian_id
          let guardianRow = null;
          if (guardianId) {
            const guardianResult = await client.queryObject<Record<string, unknown>>(`
              SELECT * FROM guardians WHERE id = $1
            `, [guardianId]);
            
            if (guardianResult.rows.length > 0) {
              guardianRow = guardianResult.rows[0];
            }
          }

          student = this.rowToStudent(result.rows[0], guardianRow);
        }
      } else {
        // Create new student with generated UUID
        const id = crypto.randomUUID();
        const result = await client.queryObject<Record<string, unknown>>(`
          INSERT INTO students (
            id, first_name, last_name, username, email, grade, pin, 
            avatar_id, guardian_id, notes, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
          RETURNING *
        `, [
          id,
          studentData.firstName,
          studentData.lastName,
          studentData.username,
          studentData.email || null,
          studentData.grade,
          studentData.pin || null,
          studentData.avatarId,
          guardianId,
          studentData.notes || null,
          now.toISOString(),
          now.toISOString()
        ]);

        // Get guardian information if there's a guardian_id
        let guardianRow = null;
        if (guardianId) {
          const guardianResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM guardians WHERE id = $1
          `, [guardianId]);
          
          if (guardianResult.rows.length > 0) {
            guardianRow = guardianResult.rows[0];
          }
        }

        student = this.rowToStudent(result.rows[0], guardianRow);
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

      // First, check if this student has a guardian
      const studentResult = await client.queryObject<{ guardian_id: string | null }>(`
        SELECT guardian_id FROM students WHERE id = $1
      `, [id]);

      if (studentResult.rows.length === 0) {
        // Student not found
        await client.queryObject("ROLLBACK");
        return false;
      }

      const guardianId = studentResult.rows[0].guardian_id;

      // Delete the student
      const result = await client.queryObject<{ count: number }>(`
        DELETE FROM students WHERE id = $1 RETURNING COUNT(*) as count
      `, [id]);

      const deleted = result.rows[0].count > 0;

      // If student was deleted and had a guardian, check if guardian has other students
      if (deleted && guardianId) {
        const guardianStudentsResult = await client.queryObject<{ count: number }>(`
          SELECT COUNT(*) as count FROM students WHERE guardian_id = $1
        `, [guardianId]);

        const guardianHasOtherStudents = guardianStudentsResult.rows[0].count > 0;

        // If guardian has no other students, delete the guardian
        if (!guardianHasOtherStudents) {
          await client.queryObject(`
            DELETE FROM guardians WHERE id = $1
          `, [guardianId]);
        }
      }

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
        SELECT s.*, g.name as guardian_name, g.email as guardian_email, g.phone as guardian_phone
        FROM students s
        LEFT JOIN guardians g ON s.guardian_id = g.id
        ORDER BY s.created_at DESC
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
