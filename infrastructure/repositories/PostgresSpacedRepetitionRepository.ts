// PostgresSpacedRepetitionRepository.ts
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { SpacedRepetitionItem, SpacedRepetitionRepository } from "../../ports/repositories/SpacedRepetitionRepository.ts";

export class PostgresSpacedRepetitionRepository implements SpacedRepetitionRepository {
  private pool: Pool;
  
  constructor(connectionString: string) {
    this.pool = new Pool(connectionString, 5);
  }
  
  async getItem(studentId: string, questionId: string): Promise<SpacedRepetitionItem | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.queryObject<Record<string, unknown>>(
        `SELECT * FROM spaced_repetition_items 
         WHERE student_id = $1 AND question_id = $2`,
        [studentId, questionId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      
      return {
        studentId: row.student_id as string,
        questionId: row.question_id as string,
        easeFactor: row.ease_factor as number,
        interval: row.interval_days as number,
        repetitions: row.repetitions as number,
        nextReviewDate: new Date(row.next_review_date as string),
        lastReviewDate: row.last_review_date ? new Date(row.last_review_date as string) : null
      };
    } finally {
      client.release();
    }
  }
  
  async saveItem(item: SpacedRepetitionItem): Promise<SpacedRepetitionItem> {
    const client = await this.pool.connect();
    
    try {
      const now = new Date();
      
      // Check if item exists
      const existingItem = await this.getItem(item.studentId, item.questionId);
      
      if (existingItem) {
        // Update existing item
        await client.queryObject(
          `UPDATE spaced_repetition_items SET
           ease_factor = $1,
           interval_days = $2,
           repetitions = $3,
           next_review_date = $4,
           last_review_date = $5,
           updated_at = $6
           WHERE student_id = $7 AND question_id = $8`,
          [
            item.easeFactor,
            item.interval,
            item.repetitions,
            item.nextReviewDate.toISOString(),
            item.lastReviewDate ? item.lastReviewDate.toISOString() : null,
            now.toISOString(),
            item.studentId,
            item.questionId
          ]
        );
      } else {
        // Create new item
        await client.queryObject(
          `INSERT INTO spaced_repetition_items
           (student_id, question_id, ease_factor, interval_days, repetitions, next_review_date, last_review_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            item.studentId,
            item.questionId,
            item.easeFactor,
            item.interval,
            item.repetitions,
            item.nextReviewDate.toISOString(),
            item.lastReviewDate ? item.lastReviewDate.toISOString() : null,
            now.toISOString(),
            now.toISOString()
          ]
        );
      }
      
      return item;
    } finally {
      client.release();
    }
  }
  
  async getDueItems(studentId: string, beforeDate: Date, limit?: number): Promise<SpacedRepetitionItem[]> {
    const client = await this.pool.connect();
    
    try {
      const limitClause = limit ? `LIMIT ${limit}` : '';
      
      const result = await client.queryObject<Record<string, unknown>>(
        `SELECT * FROM spaced_repetition_items 
         WHERE student_id = $1 AND next_review_date <= $2
         ORDER BY next_review_date ASC
         ${limitClause}`,
        [studentId, beforeDate.toISOString()]
      );
      
      return result.rows.map(row => ({
        studentId: row.student_id as string,
        questionId: row.question_id as string,
        easeFactor: row.ease_factor as number,
        interval: row.interval_days as number,
        repetitions: row.repetitions as number,
        nextReviewDate: new Date(row.next_review_date as string),
        lastReviewDate: row.last_review_date ? new Date(row.last_review_date as string) : null
      }));
    } finally {
      client.release();
    }
  }
  
  async getStudentQuestionIds(studentId: string): Promise<string[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.queryObject<{ question_id: string }>(
        `SELECT question_id FROM spaced_repetition_items 
         WHERE student_id = $1`,
        [studentId]
      );
      
      return result.rows.map(row => row.question_id);
    } finally {
      client.release();
    }
  }
  
  async getRecentlyIncorrectItems(studentId: string, limit?: number): Promise<string[]> {
    const client = await this.pool.connect();
    
    try {
      const limitClause = limit ? `LIMIT ${limit}` : '';
      
      // Get items with low repetition count (indicating they were recently reset due to incorrect answers)
      const result = await client.queryObject<{ question_id: string }>(
        `SELECT question_id FROM spaced_repetition_items 
         WHERE student_id = $1 AND repetitions <= 1 AND last_review_date IS NOT NULL
         ORDER BY last_review_date DESC
         ${limitClause}`,
        [studentId]
      );
      
      return result.rows.map(row => row.question_id);
    } finally {
      client.release();
    }
  }
  
  async getAllItems(studentId: string): Promise<SpacedRepetitionItem[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.queryObject<Record<string, unknown>>(
        `SELECT * FROM spaced_repetition_items 
         WHERE student_id = $1
         ORDER BY next_review_date ASC`,
        [studentId]
      );
      
      return result.rows.map(row => ({
        studentId: row.student_id as string,
        questionId: row.question_id as string,
        easeFactor: row.ease_factor as number,
        interval: row.interval_days as number,
        repetitions: row.repetitions as number,
        nextReviewDate: new Date(row.next_review_date as string),
        lastReviewDate: row.last_review_date ? new Date(row.last_review_date as string) : null
      }));
    } finally {
      client.release();
    }
  }
  
  async deleteItem(studentId: string, questionId: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.queryObject(
        `DELETE FROM spaced_repetition_items 
         WHERE student_id = $1 AND question_id = $2
         RETURNING *`,
        [studentId, questionId]
      );
      
      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }
  
  async createTable(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS spaced_repetition_items (
          id SERIAL PRIMARY KEY,
          student_id TEXT NOT NULL,
          question_id TEXT NOT NULL,
          ease_factor NUMERIC(10, 2) NOT NULL,
          interval_days INTEGER NOT NULL,
          repetitions INTEGER NOT NULL,
          next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
          last_review_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
          UNIQUE(student_id, question_id)
        )
      `);
      
      // Create an index for improved query performance
      await client.queryObject(`
        CREATE INDEX IF NOT EXISTS idx_spaced_repetition_student_date
        ON spaced_repetition_items(student_id, next_review_date)
      `);
    } finally {
      client.release();
    }
  }
  
  async close(): Promise<void> {
    await this.pool.end();
  }
}