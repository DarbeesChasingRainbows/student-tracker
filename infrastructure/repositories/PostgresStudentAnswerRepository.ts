import { 
  StudentAnswer, 
  StudentAnswerSchema,
  MultipleChoiceAnswer,
  TrueFalseAnswer,
  ShortAnswerResponse,
  EssayResponse,
  MatchingResponse
} from "../../domain/models/StudentAnswer.ts";
import { QuestionType } from "../../domain/models/Question.ts";
import { StudentAnswerRepository } from "../../ports/repositories/StudentAnswerRepository.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

/**
 * PostgreSQL implementation of StudentAnswerRepository
 * Stores student answer data in a PostgreSQL database
 */
export class PostgresStudentAnswerRepository implements StudentAnswerRepository {
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
   * Find a student answer by ID
   */
  async findById(id: string): Promise<StudentAnswer | null> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Get base student answer data
      const answerResult = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_answers WHERE id = $1
      `, [id]);

      if (answerResult.rows.length === 0) {
        return null;
      }

      const answerRow = answerResult.rows[0];
      const questionType = answerRow.question_type as QuestionType;

      // Get type-specific data
      let specificData: Record<string, unknown> = {};
      
      switch (questionType) {
        case QuestionType.MULTIPLE_CHOICE: {
          const mcResult = await client.queryObject<{ selected_option_id: string }>(`
            SELECT selected_option_id FROM multiple_choice_answers WHERE student_answer_id = $1
          `, [id]);
          
          if (mcResult.rows.length > 0) {
            specificData = {
              selectedOptionId: mcResult.rows[0].selected_option_id,
            };
          }
          break;
        }
        
        case QuestionType.TRUE_FALSE: {
          const tfResult = await client.queryObject<{ answer: boolean }>(`
            SELECT answer FROM true_false_student_answers WHERE student_answer_id = $1
          `, [id]);
          
          if (tfResult.rows.length > 0) {
            specificData = {
              answer: tfResult.rows[0].answer,
            };
          }
          break;
        }
        
        case QuestionType.SHORT_ANSWER: {
          const saResult = await client.queryObject<{ answer: string }>(`
            SELECT answer FROM short_answer_student_answers WHERE student_answer_id = $1
          `, [id]);
          
          if (saResult.rows.length > 0) {
            specificData = {
              answer: saResult.rows[0].answer,
            };
          }
          break;
        }
        
        case QuestionType.ESSAY: {
          const essayResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM essay_student_answers WHERE student_answer_id = $1
          `, [id]);
          
          if (essayResult.rows.length > 0) {
            specificData = {
              answer: essayResult.rows[0].answer as string,
              feedback: essayResult.rows[0].feedback as string | undefined,
              score: essayResult.rows[0].score as number | undefined,
            };
          }
          break;
        }
        
        case QuestionType.MATCHING: {
          const matchingResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM matching_student_pairs WHERE student_answer_id = $1
          `, [id]);
          
          specificData = {
            matches: matchingResult.rows.map(row => ({
              leftId: row.left_id as string,
              rightId: row.right_id as string,
            })),
          };
          break;
        }
      }

      // Combine base answer data with specific data
      const answerData = {
        id: answerRow.id as string,
        studentId: answerRow.student_id as string,
        questionId: answerRow.question_id as string,
        studentAssignmentId: answerRow.student_assignment_id as string,
        isCorrect: answerRow.is_correct as boolean | undefined,
        attemptNumber: answerRow.attempt_number as number,
        questionType,
        createdAt: new Date(answerRow.created_at as string),
        updatedAt: new Date(answerRow.updated_at as string),
        ...specificData,
      };

      // Validate with schema
      const result = StudentAnswerSchema.safeParse(answerData);
      if (!result.success) {
        console.error("Invalid student answer data from database:", result.error);
        throw new Error("Invalid student answer data from database");
      }

      return result.data;
    } catch (error) {
      console.error(`Error finding student answer with ID ${id}:`, error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Save a student answer
   */
  async save(answerData: Omit<StudentAnswer, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<StudentAnswer> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      const now = new Date();
      const id = answerData.id || crypto.randomUUID();

      // Check if answer exists
      let exists = false;
      if (answerData.id) {
        const existingResult = await client.queryObject<{ count: number }>(`
          SELECT COUNT(*) as count FROM student_answers WHERE id = $1
        `, [answerData.id]);
        exists = existingResult.rows[0].count > 0;
      }

      // Save base answer data
      if (exists) {
        await client.queryObject(`
          UPDATE student_answers SET
            is_correct = $1,
            attempt_number = $2,
            updated_at = $3
          WHERE id = $4
        `, [
          answerData.isCorrect === undefined ? null : answerData.isCorrect,
          answerData.attemptNumber,
          now.toISOString(),
          id
        ]);
      } else {
        await client.queryObject(`
          INSERT INTO student_answers (
            id, student_id, question_id, student_assignment_id, 
            is_correct, attempt_number, question_type, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
        `, [
          id,
          answerData.studentId,
          answerData.questionId,
          answerData.studentAssignmentId,
          answerData.isCorrect === undefined ? null : answerData.isCorrect,
          answerData.attemptNumber,
          answerData.questionType,
          now.toISOString(),
          now.toISOString()
        ]);
      }

      // Handle type-specific data
      switch (answerData.questionType) {
        case QuestionType.MULTIPLE_CHOICE: {
          const mcAnswer = answerData as MultipleChoiceAnswer;
          
          if (exists) {
            // Update existing answer
            await client.queryObject(`
              UPDATE multiple_choice_answers SET
                selected_option_id = $1
              WHERE student_answer_id = $2
            `, [mcAnswer.selectedOptionId, id]);
          } else {
            // Insert new answer
            await client.queryObject(`
              INSERT INTO multiple_choice_answers (student_answer_id, selected_option_id)
              VALUES ($1, $2)
            `, [id, mcAnswer.selectedOptionId]);
          }
          break;
        }
        
        case QuestionType.TRUE_FALSE: {
          const tfAnswer = answerData as TrueFalseAnswer;
          
          if (exists) {
            // Update existing answer
            await client.queryObject(`
              UPDATE true_false_student_answers SET
                answer = $1
              WHERE student_answer_id = $2
            `, [tfAnswer.answer, id]);
          } else {
            // Insert new answer
            await client.queryObject(`
              INSERT INTO true_false_student_answers (student_answer_id, answer)
              VALUES ($1, $2)
            `, [id, tfAnswer.answer]);
          }
          break;
        }
        
        case QuestionType.SHORT_ANSWER: {
          const saAnswer = answerData as ShortAnswerResponse;
          
          if (exists) {
            // Update existing answer
            await client.queryObject(`
              UPDATE short_answer_student_answers SET
                answer = $1
              WHERE student_answer_id = $2
            `, [saAnswer.answer, id]);
          } else {
            // Insert new answer
            await client.queryObject(`
              INSERT INTO short_answer_student_answers (student_answer_id, answer)
              VALUES ($1, $2)
            `, [id, saAnswer.answer]);
          }
          break;
        }
        
        case QuestionType.ESSAY: {
          const essayAnswer = answerData as EssayResponse;
          
          if (exists) {
            // Update existing answer
            await client.queryObject(`
              UPDATE essay_student_answers SET
                answer = $1,
                feedback = $2,
                score = $3
              WHERE student_answer_id = $4
            `, [
              essayAnswer.answer,
              essayAnswer.feedback || null,
              essayAnswer.score || null,
              id
            ]);
          } else {
            // Insert new answer
            await client.queryObject(`
              INSERT INTO essay_student_answers (student_answer_id, answer, feedback, score)
              VALUES ($1, $2, $3, $4)
            `, [
              id,
              essayAnswer.answer,
              essayAnswer.feedback || null,
              essayAnswer.score || null
            ]);
          }
          break;
        }
        
        case QuestionType.MATCHING: {
          const matchingAnswer = answerData as MatchingResponse;
          
          if (exists) {
            // Delete existing matches
            await client.queryObject(`
              DELETE FROM matching_student_pairs WHERE student_answer_id = $1
            `, [id]);
          } else {
            // Insert matching answer record
            await client.queryObject(`
              INSERT INTO matching_student_answers (student_answer_id)
              VALUES ($1)
            `, [id]);
          }
          
          // Insert new matches
          for (const match of matchingAnswer.matches) {
            await client.queryObject(`
              INSERT INTO matching_student_pairs (id, student_answer_id, left_id, right_id)
              VALUES ($1, $2, $3, $4)
            `, [crypto.randomUUID(), id, match.leftId, match.rightId]);
          }
          break;
        }
      }

      // Commit transaction
      await client.queryObject("COMMIT");

      // Return the saved answer
      return await this.findById(id) as StudentAnswer;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error("Error saving student answer:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a student answer
   */
  async delete(id: string): Promise<boolean> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      // Delete the student answer (cascade will handle related data)
      const result = await client.queryObject<{ count: number }>(`
        DELETE FROM student_answers WHERE id = $1 RETURNING COUNT(*) as count
      `, [id]);

      // Commit transaction
      await client.queryObject("COMMIT");

      return result.rows[0].count > 0;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error(`Error deleting student answer ${id}:`, error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Find all answers for a student assignment
   */
  async findByStudentAssignmentId(studentAssignmentId: string): Promise<StudentAnswer[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_answers 
        WHERE student_assignment_id = $1
        ORDER BY created_at ASC
      `, [studentAssignmentId]);

      const answers: StudentAnswer[] = [];
      for (const row of result.rows) {
        const answer = await this.findById(row.id as string);
        if (answer) {
          answers.push(answer);
        }
      }

      return answers;
    } catch (error) {
      console.error(`Error finding answers for student assignment ${studentAssignmentId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find all answers for a specific question by a student
   */
  async findByStudentAndQuestionId(studentId: string, questionId: string): Promise<StudentAnswer[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_answers 
        WHERE student_id = $1 AND question_id = $2
        ORDER BY attempt_number ASC
      `, [studentId, questionId]);

      const answers: StudentAnswer[] = [];
      for (const row of result.rows) {
        const answer = await this.findById(row.id as string);
        if (answer) {
          answers.push(answer);
        }
      }

      return answers;
    } catch (error) {
      console.error(`Error finding answers for student ${studentId} and question ${questionId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find the latest answer for a specific question by a student
   */
  async findLatestByStudentAndQuestionId(studentId: string, questionId: string): Promise<StudentAnswer | null> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_answers 
        WHERE student_id = $1 AND question_id = $2
        ORDER BY attempt_number DESC
        LIMIT 1
      `, [studentId, questionId]);

      if (result.rows.length === 0) {
        return null;
      }

      return await this.findById(result.rows[0].id as string);
    } catch (error) {
      console.error(`Error finding latest answer for student ${studentId} and question ${questionId}:`, error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Add a question to the spaced repetition system for a student
   */
  async addToSpacedRepetition(
    studentId: string,
    questionId: string,
    easeFactor: number = 2.5,
    intervalDays: number = 1
  ): Promise<boolean> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const now = new Date();
      const id = crypto.randomUUID();
      const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

      // Check if item already exists
      const existingResult = await client.queryObject<{ count: number }>(`
        SELECT COUNT(*) as count FROM spaced_repetition_items 
        WHERE student_id = $1 AND question_id = $2
      `, [studentId, questionId]);

      if (existingResult.rows[0].count > 0) {
        // Update existing item
        await client.queryObject(`
          UPDATE spaced_repetition_items SET
            ease_factor = $1,
            interval_days = $2,
            next_review_date = $3,
            updated_at = $4
          WHERE student_id = $5 AND question_id = $6
        `, [
          easeFactor,
          intervalDays,
          nextReviewDate.toISOString(),
          now.toISOString(),
          studentId,
          questionId
        ]);
      } else {
        // Insert new item
        await client.queryObject(`
          INSERT INTO spaced_repetition_items (
            id, student_id, question_id, ease_factor, interval_days,
            next_review_date, review_count, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
        `, [
          id,
          studentId,
          questionId,
          easeFactor,
          intervalDays,
          nextReviewDate.toISOString(),
          0,
          now.toISOString(),
          now.toISOString()
        ]);
      }

      return true;
    } catch (error) {
      console.error(`Error adding question ${questionId} to spaced repetition for student ${studentId}:`, error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Update a spaced repetition item after review
   */
  async updateSpacedRepetitionItem(
    studentId: string,
    questionId: string,
    wasCorrect: boolean
  ): Promise<boolean> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Get current item data
      const itemResult = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM spaced_repetition_items 
        WHERE student_id = $1 AND question_id = $2
      `, [studentId, questionId]);

      if (itemResult.rows.length === 0) {
        return false;
      }

      const item = itemResult.rows[0];
      const now = new Date();
      
      // Calculate new values using SM-2 algorithm
      let easeFactor = item.ease_factor as number;
      let intervalDays = item.interval_days as number;
      const reviewCount = (item.review_count as number) + 1;
      
      // Adjust ease factor based on correctness
      if (wasCorrect) {
        // Increase ease factor if correct (max 2.5)
        easeFactor = Math.min(easeFactor + 0.1, 2.5);
        
        // Calculate new interval
        if (reviewCount === 1) {
          intervalDays = 1;
        } else if (reviewCount === 2) {
          intervalDays = 6;
        } else {
          intervalDays = Math.round(intervalDays * easeFactor);
        }
      } else {
        // Decrease ease factor if incorrect (min 1.3)
        easeFactor = Math.max(easeFactor - 0.2, 1.3);
        // Reset interval
        intervalDays = 1;
      }
      
      // Calculate next review date
      const nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

      // Update the item
      await client.queryObject(`
        UPDATE spaced_repetition_items SET
          ease_factor = $1,
          interval_days = $2,
          next_review_date = $3,
          review_count = $4,
          last_reviewed_at = $5,
          updated_at = $6
        WHERE student_id = $7 AND question_id = $8
      `, [
        easeFactor,
        intervalDays,
        nextReviewDate.toISOString(),
        reviewCount,
        now.toISOString(),
        now.toISOString(),
        studentId,
        questionId
      ]);

      return true;
    } catch (error) {
      console.error(`Error updating spaced repetition item for student ${studentId} and question ${questionId}:`, error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Get questions due for review for a student
   */
  async getQuestionsForReview(studentId: string, limit: number = 10): Promise<string[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const now = new Date();
      
      const result = await client.queryObject<{ question_id: string }>(`
        SELECT question_id FROM spaced_repetition_items 
        WHERE student_id = $1 AND next_review_date <= $2
        ORDER BY next_review_date ASC
        LIMIT $3
      `, [studentId, now.toISOString(), limit]);

      return result.rows.map(row => row.question_id);
    } catch (error) {
      console.error(`Error getting review questions for student ${studentId}:`, error);
      return [];
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

  /**
   * Find answers by student ID
   */
  async findByStudentId(studentId: string): Promise<StudentAnswer[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_answers 
        WHERE student_id = $1
        ORDER BY created_at DESC
      `, [studentId]);

      const answers: StudentAnswer[] = [];
      for (const row of result.rows) {
        const answer = await this.findById(row.id as string);
        if (answer) {
          answers.push(answer);
        }
      }

      return answers;
    } catch (error) {
      console.error(`Error finding answers for student ${studentId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find answers by question ID
   */
  async findByQuestionId(questionId: string): Promise<StudentAnswer[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_answers 
        WHERE question_id = $1
        ORDER BY created_at DESC
      `, [questionId]);

      const answers: StudentAnswer[] = [];
      for (const row of result.rows) {
        const answer = await this.findById(row.id as string);
        if (answer) {
          answers.push(answer);
        }
      }

      return answers;
    } catch (error) {
      console.error(`Error finding answers for question ${questionId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find incorrect answers by student ID
   */
  async findIncorrectByStudentId(studentId: string): Promise<StudentAnswer[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_answers 
        WHERE student_id = $1 AND is_correct = false
        ORDER BY created_at DESC
      `, [studentId]);

      const answers: StudentAnswer[] = [];
      for (const row of result.rows) {
        const answer = await this.findById(row.id as string);
        if (answer) {
          answers.push(answer);
        }
      }

      return answers;
    } catch (error) {
      console.error(`Error finding incorrect answers for student ${studentId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find answers by question type
   */
  async findByQuestionType(type: QuestionType): Promise<StudentAnswer[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_answers 
        WHERE question_type = $1
        ORDER BY created_at DESC
      `, [type]);

      const answers: StudentAnswer[] = [];
      for (const row of result.rows) {
        const answer = await this.findById(row.id as string);
        if (answer) {
          answers.push(answer);
        }
      }

      return answers;
    } catch (error) {
      console.error(`Error finding answers for question type ${type}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find answers by student ID and assignment ID
   */
  async findByStudentAndAssignmentId(studentId: string, assignmentId: string): Promise<StudentAnswer[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT sa.* FROM student_answers sa
        JOIN student_assignments sa2 ON sa.student_assignment_id = sa2.id
        WHERE sa.student_id = $1 AND sa2.assignment_id = $2
        ORDER BY sa.created_at ASC
      `, [studentId, assignmentId]);

      const answers: StudentAnswer[] = [];
      for (const row of result.rows) {
        const answer = await this.findById(row.id as string);
        if (answer) {
          answers.push(answer);
        }
      }

      return answers;
    } catch (error) {
      console.error(`Error finding answers for student ${studentId} and assignment ${assignmentId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Count correct answers by student ID
   */
  async countCorrectByStudentId(studentId: string): Promise<number> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<{ count: number }>(`
        SELECT COUNT(*) as count FROM student_answers 
        WHERE student_id = $1 AND is_correct = true
      `, [studentId]);

      return result.rows[0].count;
    } catch (error) {
      console.error(`Error counting correct answers for student ${studentId}:`, error);
      return 0;
    } finally {
      client.release();
    }
  }

  /**
   * Find answers by attempt number
   */
  async findByAttemptNumber(attemptNumber: number): Promise<StudentAnswer[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM student_answers 
        WHERE attempt_number = $1
        ORDER BY created_at DESC
      `, [attemptNumber]);

      const answers: StudentAnswer[] = [];
      for (const row of result.rows) {
        const answer = await this.findById(row.id as string);
        if (answer) {
          answers.push(answer);
        }
      }

      return answers;
    } catch (error) {
      console.error(`Error finding answers for attempt number ${attemptNumber}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find incorrect answers by tags
   */
  async findIncorrectByTags(studentId: string, tagIds: string[]): Promise<StudentAnswer[]> {
    await this.initialize();

    if (tagIds.length === 0) {
      return [];
    }

    const client = await this.pool.connect();
    try {
      // Create placeholders for the tag IDs
      const tagPlaceholders = tagIds.map((_, i) => `$${i + 3}`).join(', ');
      
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT DISTINCT sa.* FROM student_answers sa
        JOIN questions q ON sa.question_id = q.id
        JOIN question_tags_map qtm ON q.id = qtm.question_id
        WHERE sa.student_id = $1 
        AND sa.is_correct = false
        AND qtm.tag_id IN (${tagPlaceholders})
        ORDER BY sa.created_at DESC
      `, [studentId, false, ...tagIds]);

      const answers: StudentAnswer[] = [];
      for (const row of result.rows) {
        const answer = await this.findById(row.id as string);
        if (answer) {
          answers.push(answer);
        }
      }

      return answers;
    } catch (error) {
      console.error(`Error finding incorrect answers for student ${studentId} with tags:`, tagIds, error);
      return [];
    } finally {
      client.release();
    }
  }
}
