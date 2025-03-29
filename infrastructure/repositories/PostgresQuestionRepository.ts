import { 
  Question, 
  QuestionSchema, 
  QuestionType,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  EssayQuestion,
  MatchingQuestion
} from "../../domain/models/Question.ts";
import { QuestionRepository } from "../../ports/repositories/QuestionRepository.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

/**
 * PostgreSQL implementation of QuestionRepository
 * Stores question data in a PostgreSQL database
 */
export class PostgresQuestionRepository implements QuestionRepository {
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
   * Find a question by ID
   */
  async findById(id: string): Promise<Question | null> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // First, get the base question data
      const questionResult = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM questions WHERE id = $1
      `, [id]);

      if (questionResult.rows.length === 0) {
        return null;
      }

      const questionRow = questionResult.rows[0];
      const questionType = questionRow.type as QuestionType;

      // Get question tags
      const tagsResult = await client.queryObject<{ tag_id: string, name: string }>(`
        SELECT qtm.tag_id, qt.name 
        FROM question_tags_map qtm
        JOIN question_tags qt ON qtm.tag_id = qt.id
        WHERE qtm.question_id = $1
      `, [id]);
      
      const tagNames = tagsResult.rows.map(row => row.name);

      // Based on question type, get specific data
      let specificData: Record<string, unknown> = {};
      
      switch (questionType) {
        case QuestionType.MULTIPLE_CHOICE: {
          const optionsResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM multiple_choice_options WHERE question_id = $1
          `, [id]);
          
          specificData = {
            options: optionsResult.rows.map(row => ({
              id: row.id,
              text: row.text,
              isCorrect: row.is_correct,
            })),
          };
          break;
        }
        
        case QuestionType.TRUE_FALSE: {
          const tfResult = await client.queryObject<{ correct_answer: boolean }>(`
            SELECT correct_answer FROM true_false_answers WHERE question_id = $1
          `, [id]);
          
          if (tfResult.rows.length > 0) {
            specificData = {
              correctAnswer: tfResult.rows[0].correct_answer,
            };
          }
          break;
        }
        
        case QuestionType.SHORT_ANSWER: {
          const saResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM short_answer_answers WHERE question_id = $1
          `, [id]);
          
          specificData = {
            correctAnswers: saResult.rows.map(row => row.correct_answer as string),
            caseSensitive: saResult.rows.length > 0 ? saResult.rows[0].case_sensitive : false,
          };
          break;
        }
        
        case QuestionType.ESSAY: {
          const essayResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM essay_questions WHERE question_id = $1
          `, [id]);
          
          if (essayResult.rows.length > 0) {
            specificData = {
              rubric: essayResult.rows[0].rubric,
              wordLimit: essayResult.rows[0].word_limit,
            };
          }
          break;
        }
        
        case QuestionType.MATCHING: {
          const pairsResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM matching_pairs WHERE question_id = $1
          `, [id]);
          
          specificData = {
            pairs: pairsResult.rows.map(row => ({
              id: row.id,
              left: row.left_text,
              right: row.right_text,
            })),
          };
          break;
        }
      }

      // Combine base question data with specific data
      const questionData = {
        id: questionRow.id as string,
        prompt: questionRow.prompt as string,
        type: questionType,
        difficultyLevel: questionRow.difficulty_level as string,
        explanation: questionRow.explanation === null ? undefined : (questionRow.explanation as string),
        tags: tagNames,
        createdBy: questionRow.created_by as string,
        createdAt: new Date(questionRow.created_at as string),
        updatedAt: new Date(questionRow.updated_at as string),
        ...specificData,
      };

      // Validate with schema
      const result = QuestionSchema.safeParse(questionData);
      if (!result.success) {
        console.error("Invalid question data from database:", result.error);
        throw new Error("Invalid question data from database");
      }

      return result.data;
    } catch (error) {
      console.error(`Error finding question with ID ${id}:`, error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Save a question
   */
  async save(questionData: Omit<Question, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Question> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      const now = new Date();
      const id = questionData.id || crypto.randomUUID();

      // Check if question exists
      let exists = false;
      if (questionData.id) {
        const existingResult = await client.queryObject<{ count: number }>(`
          SELECT COUNT(*) as count FROM questions WHERE id = $1
        `, [questionData.id]);
        exists = existingResult.rows[0].count > 0;
      }

      // Save base question data
      if (exists) {
        await client.queryObject(`
          UPDATE questions SET
            prompt = $1,
            type = $2,
            difficulty_level = $3,
            explanation = $4,
            updated_at = $5
          WHERE id = $6
        `, [
          questionData.prompt,
          questionData.type,
          questionData.difficultyLevel,
          questionData.explanation || null,
          now.toISOString(),
          id
        ]);
      } else {
        await client.queryObject(`
          INSERT INTO questions (
            id, prompt, type, difficulty_level, explanation, created_by, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          )
        `, [
          id,
          questionData.prompt,
          questionData.type,
          questionData.difficultyLevel,
          questionData.explanation || null,
          questionData.createdBy,
          now.toISOString(),
          now.toISOString()
        ]);
      }

      // Handle tags - first delete existing mappings
      await client.queryObject(`
        DELETE FROM question_tags_map WHERE question_id = $1
      `, [id]);

      // Then insert new tag mappings
      if (questionData.tags && questionData.tags.length > 0) {
        // First, ensure tags exist in the question_tags table
        for (const tagName of questionData.tags) {
          // Check if the tag is already a UUID
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tagName);
          
          if (isUuid) {
            // If it's already a UUID, use it directly
            await client.queryObject(`
              INSERT INTO question_tags_map (question_id, tag_id)
              VALUES ($1, $2)
            `, [id, tagName]);
          } else {
            // If it's a tag name, find or create the tag
            // First check if the tag already exists
            const existingTag = await client.queryObject<{ id: string }>(`
              SELECT id FROM question_tags WHERE name = $1
            `, [tagName]);
            
            let tagId: string;
            
            if (existingTag.rows.length > 0) {
              // Use existing tag ID
              tagId = existingTag.rows[0].id;
            } else {
              // Create a new tag
              tagId = crypto.randomUUID();
              await client.queryObject(`
                INSERT INTO question_tags (id, name, created_at, updated_at)
                VALUES ($1, $2, $3, $4)
              `, [tagId, tagName, now.toISOString(), now.toISOString()]);
            }
            
            // Now insert the mapping
            await client.queryObject(`
              INSERT INTO question_tags_map (question_id, tag_id)
              VALUES ($1, $2)
            `, [id, tagId]);
          }
        }
      }

      // Handle type-specific data
      switch (questionData.type) {
        case QuestionType.MULTIPLE_CHOICE: {
          const mcQuestion = questionData as MultipleChoiceQuestion;
          
          // Delete existing options
          await client.queryObject(`
            DELETE FROM multiple_choice_options WHERE question_id = $1
          `, [id]);
          
          // Insert new options
          for (const option of mcQuestion.options) {
            const optionId = option.id || crypto.randomUUID();
            await client.queryObject(`
              INSERT INTO multiple_choice_options (id, question_id, text, is_correct, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [optionId, id, option.text, option.isCorrect, now.toISOString(), now.toISOString()]);
          }
          break;
        }
        
        case QuestionType.TRUE_FALSE: {
          const tfQuestion = questionData as TrueFalseQuestion;
          
          // Delete existing answer
          await client.queryObject(`
            DELETE FROM true_false_answers WHERE question_id = $1
          `, [id]);
          
          // Insert new answer
          await client.queryObject(`
            INSERT INTO true_false_answers (question_id, correct_answer, created_at, updated_at)
            VALUES ($1, $2, $3, $4)
          `, [id, tfQuestion.correctAnswer, now.toISOString(), now.toISOString()]);
          break;
        }
        
        case QuestionType.SHORT_ANSWER: {
          const saQuestion = questionData as ShortAnswerQuestion;
          
          // Delete existing answers
          await client.queryObject(`
            DELETE FROM short_answer_answers WHERE question_id = $1
          `, [id]);
          
          // Insert new answers
          for (const answer of saQuestion.correctAnswers) {
            await client.queryObject(`
              INSERT INTO short_answer_answers (id, question_id, correct_answer, case_sensitive, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [crypto.randomUUID(), id, answer, saQuestion.caseSensitive || false, now.toISOString(), now.toISOString()]);
          }
          break;
        }
        
        case QuestionType.ESSAY: {
          const essayQuestion = questionData as EssayQuestion;
          
          // Delete existing essay data
          await client.queryObject(`
            DELETE FROM essay_questions WHERE question_id = $1
          `, [id]);
          
          // Insert new essay data
          await client.queryObject(`
            INSERT INTO essay_questions (question_id, rubric, word_limit, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
          `, [id, essayQuestion.rubric || null, essayQuestion.wordLimit || null, now.toISOString(), now.toISOString()]);
          break;
        }
        
        case QuestionType.MATCHING: {
          const matchingQuestion = questionData as MatchingQuestion;
          
          // Delete existing pairs
          await client.queryObject(`
            DELETE FROM matching_pairs WHERE question_id = $1
          `, [id]);
          
          // Insert new pairs
          for (const pair of matchingQuestion.pairs) {
            const pairId = pair.id || crypto.randomUUID();
            await client.queryObject(`
              INSERT INTO matching_pairs (id, question_id, left_text, right_text, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [pairId, id, pair.left, pair.right, now.toISOString(), now.toISOString()]);
          }
          break;
        }
      }

      // Commit transaction
      await client.queryObject("COMMIT");

      // Return the saved question
      return await this.findById(id) as Question;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error("Error saving question:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a question
   */
  async delete(id: string): Promise<boolean> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // Begin transaction
      await client.queryObject("BEGIN");

      // First check if the question exists
      const checkResult = await client.queryObject<{ count: number }>(`
        SELECT COUNT(*) as count FROM questions WHERE id = $1
      `, [id]);
      
      const exists = checkResult.rows[0].count > 0;
      
      if (!exists) {
        await client.queryObject("COMMIT");
        return false;
      }

      // Delete the question (cascade will handle related data)
      await client.queryObject(`
        DELETE FROM questions WHERE id = $1
      `, [id]);

      // Commit transaction
      await client.queryObject("COMMIT");

      return true;
    } catch (error) {
      // Rollback transaction on error
      await client.queryObject("ROLLBACK");
      console.error(`Error deleting question ${id}:`, error);
      throw error; // Rethrow to allow proper error handling upstream
    } finally {
      client.release();
    }
  }

  /**
   * Find all questions
   */
  async findAll(): Promise<Question[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM questions ORDER BY created_at DESC
      `);

      const questions: Question[] = [];
      for (const row of result.rows) {
        const question = await this.rowToQuestion(row);
        if (question) {
          questions.push(question);
        }
      }

      return questions;
    } catch (error) {
      console.error("Error finding all questions:", error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find questions by tag
   */
  async findByTag(tagName: string): Promise<Question[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      // First find the tag ID from the name
      const tagResult = await client.queryObject<{ id: string }>(`
        SELECT id FROM question_tags WHERE name = $1
      `, [tagName]);

      if (tagResult.rows.length === 0) {
        return []; // Tag not found
      }

      const tagId = tagResult.rows[0].id;

      // Then find questions with this tag
      const result = await client.queryObject<{ question_id: string }>(`
        SELECT q.* FROM questions q
        JOIN question_tags_map tm ON q.id = tm.question_id
        WHERE tm.tag_id = $1
        ORDER BY q.created_at DESC
      `, [tagId]);

      const questions: Question[] = [];
      for (const row of result.rows) {
        const question = await this.rowToQuestion(row);
        if (question) {
          questions.push(question);
        }
      }

      return questions;
    } catch (error) {
      console.error(`Error finding questions with tag ${tagName}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find questions by difficulty level
   */
  async findByDifficultyLevel(difficultyLevel: string): Promise<Question[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM questions WHERE difficulty_level = $1 ORDER BY created_at DESC
      `, [difficultyLevel]);

      const questions: Question[] = [];
      for (const row of result.rows) {
        const question = await this.findById(row.id as string);
        if (question) {
          questions.push(question);
        }
      }

      return questions;
    } catch (error) {
      console.error(`Error finding questions with difficulty level ${difficultyLevel}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find questions by creator ID
   */
  async findByCreator(creatorId: string): Promise<Question[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM questions WHERE created_by = $1 ORDER BY created_at DESC
      `, [creatorId]);

      const questions: Question[] = [];
      for (const row of result.rows) {
        const question = await this.rowToQuestion(row);
        if (question) {
          questions.push(question);
        }
      }

      return questions;
    } catch (error) {
      console.error(`Error finding questions for creator ${creatorId}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find questions by type
   */
  async findByType(type: QuestionType): Promise<Question[]> {
    await this.initialize();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT * FROM questions WHERE type = $1 ORDER BY created_at DESC
      `, [type]);

      const questions: Question[] = [];
      for (const row of result.rows) {
        const question = await this.rowToQuestion(row);
        if (question) {
          questions.push(question);
        }
      }

      return questions;
    } catch (error) {
      console.error(`Error finding questions of type ${type}:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Find questions by tags
   */
  async findByTags(tagNames: string[]): Promise<Question[]> {
    await this.initialize();

    if (tagNames.length === 0) {
      return [];
    }

    const client = await this.pool.connect();
    try {
      // First find the tag IDs from the names
      const placeholders = tagNames.map((_, i) => `$${i + 1}`).join(', ');
      const tagResult = await client.queryObject<{ id: string }>(`
        SELECT id FROM question_tags WHERE name IN (${placeholders})
      `, [...tagNames]);

      if (tagResult.rows.length === 0) {
        return []; // No tags found
      }

      const tagIds = tagResult.rows.map(row => row.id);
      
      // Then find questions with these tags
      const tagIdPlaceholders = tagIds.map((_, i) => `$${i + 1}`).join(', ');
      const result = await client.queryObject<Record<string, unknown>>(`
        SELECT DISTINCT q.* FROM questions q
        JOIN question_tags_map tm ON q.id = tm.question_id
        WHERE tm.tag_id IN (${tagIdPlaceholders})
        ORDER BY q.created_at DESC
      `, [...tagIds]);

      const questions: Question[] = [];
      for (const row of result.rows) {
        const question = await this.rowToQuestion(row);
        if (question) {
          questions.push(question);
        }
      }

      return questions;
    } catch (error) {
      console.error(`Error finding questions with tags [${tagNames.join(', ')}]:`, error);
      return [];
    } finally {
      client.release();
    }
  }

  private async rowToQuestion(row: Record<string, unknown>): Promise<Question | null> {
    const questionType = row.type as QuestionType;

    // Get question tags
    const client = await this.pool.connect();
    try {
      const tagsResult = await client.queryObject<{ tag_id: string, name: string }>(`
        SELECT qtm.tag_id, qt.name 
        FROM question_tags_map qtm
        JOIN question_tags qt ON qtm.tag_id = qt.id
        WHERE qtm.question_id = $1
      `, [row.id]);
      
      const tagNames = tagsResult.rows.map(row => row.name);

      // Based on question type, get specific data
      let specificData: Record<string, unknown> = {};
      
      switch (questionType) {
        case QuestionType.MULTIPLE_CHOICE: {
          const optionsResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM multiple_choice_options WHERE question_id = $1
          `, [row.id]);
          
          specificData = {
            options: optionsResult.rows.map(row => ({
              id: row.id,
              text: row.text,
              isCorrect: row.is_correct,
            })),
          };
          break;
        }
        
        case QuestionType.TRUE_FALSE: {
          const tfResult = await client.queryObject<{ correct_answer: boolean }>(`
            SELECT correct_answer FROM true_false_answers WHERE question_id = $1
          `, [row.id]);
          
          if (tfResult.rows.length > 0) {
            specificData = {
              correctAnswer: tfResult.rows[0].correct_answer,
            };
          }
          break;
        }
        
        case QuestionType.SHORT_ANSWER: {
          const saResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM short_answer_answers WHERE question_id = $1
          `, [row.id]);
          
          specificData = {
            correctAnswers: saResult.rows.map(row => row.correct_answer as string),
            caseSensitive: saResult.rows.length > 0 ? saResult.rows[0].case_sensitive : false,
          };
          break;
        }
        
        case QuestionType.ESSAY: {
          const essayResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM essay_questions WHERE question_id = $1
          `, [row.id]);
          
          if (essayResult.rows.length > 0) {
            specificData = {
              rubric: essayResult.rows[0].rubric,
              wordLimit: essayResult.rows[0].word_limit,
            };
          }
          break;
        }
        
        case QuestionType.MATCHING: {
          const pairsResult = await client.queryObject<Record<string, unknown>>(`
            SELECT * FROM matching_pairs WHERE question_id = $1
          `, [row.id]);
          
          specificData = {
            pairs: pairsResult.rows.map(row => ({
              id: row.id,
              left: row.left_text,
              right: row.right_text,
            })),
          };
          break;
        }
      }

      // Combine base question data with specific data
      const questionData = {
        id: row.id as string,
        prompt: row.prompt as string,
        type: questionType,
        difficultyLevel: row.difficulty_level as string,
        explanation: row.explanation === null ? undefined : (row.explanation as string),
        tags: tagNames,
        createdBy: row.created_by as string,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        ...specificData,
      };

      // Validate with schema
      const result = QuestionSchema.safeParse(questionData);
      if (!result.success) {
        console.error("Invalid question data from database:", result.error);
        throw new Error("Invalid question data from database");
      }

      return result.data;
    } catch (error) {
      console.error(`Error finding question with ID ${row.id}:`, error);
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
