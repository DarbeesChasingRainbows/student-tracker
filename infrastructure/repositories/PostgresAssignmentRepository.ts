import { 
  Assignment, 
  AssignmentSchema, 
  AssignmentType,
  AssignmentStatus
} from "../../domain/models/Assignment.ts";
import { AssignmentRepository } from "../../ports/repositories/AssignmentRepository.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

/**
 * PostgreSQL implementation of AssignmentRepository
 * Stores assignment data in a PostgreSQL database
 */
export class PostgresAssignmentRepository implements AssignmentRepository {
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
   * Convert a database row to an Assignment object
   */
  private rowToAssignment(row: Record<string, unknown>): Assignment {
    const assignmentData = {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      type: row.type as AssignmentType,
      status: row.status as AssignmentStatus,
      dueDate: row.due_date ? new Date(row.due_date as string) : undefined,
      createdBy: row.created_by as string,
      settings: row.settings ? JSON.parse(row.settings as string) : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };

    // Validate with schema
    const result = AssignmentSchema.safeParse(assignmentData);
    if (!result.success) {
      console.error("Invalid assignment data from database:", result.error);
      throw new Error("Invalid assignment data from database");
    }

    return result.data;
  }

  /**
   * Find an assignment by ID
   */
  async findById(id: string): Promise<Assignment | null> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Get assignment data
      const assignmentResult = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM assignments WHERE id = $1
      `, [id]);

      if (assignmentResult.rows.length === 0) {
        return null;
      }

      return this.rowToAssignment(assignmentResult.rows[0]);
    } catch (error) {
      console.error(`Error finding assignment with ID ${id}:`, error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Save an assignment
   */
  async save(assignmentData: Omit<Assignment, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Assignment> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      const now = new Date();
      const id = assignmentData.id || crypto.randomUUID();

      // Check if assignment exists
      let exists = false;
      if (assignmentData.id) {
        const existingResult = await client.queryObject<{ count: number }>(`
          SELECT COUNT(*) as count FROM assignments WHERE id = $1
        `, [assignmentData.id]);
        exists = existingResult.rows[0].count > 0;
      }

      // Save assignment data
      if (exists) {
        await client.queryObject(`
          UPDATE assignments SET
            title = $1,
            description = $2,
            type = $3,
            status = $4,
            due_date = $5,
            updated_at = $6
          WHERE id = $7
        `, [
          assignmentData.title,
          assignmentData.description || null,
          assignmentData.type,
          assignmentData.status || AssignmentStatus.DRAFT,
          assignmentData.dueDate?.toISOString() || null,
          now.toISOString(),
          id
        ]);
      } else {
        await client.queryObject(`
          INSERT INTO assignments (
            id, title, description, type, created_by, status, due_date, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
        `, [
          id,
          assignmentData.title,
          assignmentData.description || null,
          assignmentData.type,
          assignmentData.createdBy,
          assignmentData.status || AssignmentStatus.DRAFT,
          assignmentData.dueDate?.toISOString() || null,
          now.toISOString(),
          now.toISOString()
        ]);
      }

      // Commit transaction
      await client.queryObject("COMMIT");

      // Return the saved assignment
      return await this.findById(id) as Assignment;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error("Error saving assignment:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete an assignment
   */
  async delete(id: string): Promise<boolean> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      // Delete the assignment (cascade will handle related data)
      const result = await client.queryObject<{ count: number }>(`
        DELETE FROM assignments WHERE id = $1 RETURNING COUNT(*) as count
      `, [id]);

      // Commit transaction
      await client.queryObject("COMMIT");

      return result.rows[0].count > 0;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error(`Error deleting assignment ${id}:`, error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Find all assignments
   */
  async findAll(): Promise<Assignment[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM assignments ORDER BY created_at DESC
      `);

      return result.rows.map(row => this.rowToAssignment(row));
    } catch (error) {
      console.error("Error finding all assignments:", error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find assignments by creator
   */
  async findByCreator(creatorId: string): Promise<Assignment[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM assignments WHERE created_by = $1 ORDER BY created_at DESC
      `, [creatorId]);

      return result.rows.map(row => this.rowToAssignment(row));
    } catch (error) {
      console.error(`Error finding assignments by creator ${creatorId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find assignments by status
   */
  async findByStatus(status: AssignmentStatus): Promise<Assignment[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM assignments WHERE status = $1 ORDER BY created_at DESC
      `, [status]);

      return result.rows.map(row => this.rowToAssignment(row));
    } catch (error) {
      console.error(`Error finding assignments with status ${status}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find assignments by type
   */
  async findByType(type: AssignmentType): Promise<Assignment[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM assignments
        WHERE type = $1
        ORDER BY created_at DESC
      `, [type]);

      return result.rows.map(row => this.rowToAssignment(row));
    } catch (error) {
      console.error(`Error finding assignments of type ${type}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Update assignment status
   */
  async updateStatus(id: string, status: AssignmentStatus): Promise<Assignment | null> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      // Update assignment status
      const now = new Date();
      const result = await client.queryObject<Record<string, unknown>>(`
        UPDATE assignments
        SET status = $1, updated_at = $2
        WHERE id = $3
        RETURNING *
      `, [status, now.toISOString(), id]);

      // Commit transaction
      await client.queryObject("COMMIT");

      if (result.rows.length === 0) {
        return null;
      }

      return this.rowToAssignment(result.rows[0]);
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error(`Error updating status for assignment ${id}:`, error);
      return null;
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
