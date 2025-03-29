import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import config from "../../config/database.ts";

/**
 * Initialize the database with all required tables
 * This function should be called when the application starts
 */
export async function initializeDatabase(): Promise<void> {
  const pool = new Pool(config.postgres?.connectionString || "", 1);
  const client = await pool.connect();

  try {
    console.log("Initializing database...");
    
    // Start transaction
    await client.queryObject("BEGIN");

    // Create students and guardians tables
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

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        email TEXT,
        grade TEXT NOT NULL,
        pin TEXT,
        avatar_id TEXT,
        guardian_id UUID REFERENCES guardians(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    // Create questions and related tables
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

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS multiple_choice_options (
        id UUID PRIMARY KEY,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS true_false_answers (
        question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
        correct_answer BOOLEAN NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS short_answer_answers (
        id UUID PRIMARY KEY,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        correct_answer TEXT NOT NULL,
        case_sensitive BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS essay_questions (
        question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
        rubric TEXT,
        word_limit INTEGER,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS matching_pairs (
        id UUID PRIMARY KEY,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        left_text TEXT NOT NULL,
        right_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    // Create question tags tables
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS question_tags (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS question_tags_map (
        id UUID PRIMARY KEY,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES question_tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(question_id, tag_id)
      )
    `);

    // Create assignments and related tables
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS assignments (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        due_date TIMESTAMP WITH TIME ZONE,
        created_by UUID NOT NULL,
        settings JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS assignment_questions (
        id UUID PRIMARY KEY,
        assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        question_order INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(assignment_id, question_id)
      )
    `);

    // Create student assignments and related tables
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS student_assignments (
        id UUID PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        score NUMERIC,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        attempt_number INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(student_id, assignment_id, attempt_number)
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS grade_history (
        id UUID PRIMARY KEY,
        student_assignment_id UUID NOT NULL REFERENCES student_assignments(id) ON DELETE CASCADE,
        previous_score NUMERIC,
        new_score NUMERIC NOT NULL,
        reason TEXT,
        changed_by UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    // Create student answers and related tables
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS student_answers (
        id UUID PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        student_assignment_id UUID NOT NULL REFERENCES student_assignments(id) ON DELETE CASCADE,
        is_correct BOOLEAN,
        attempt_number INTEGER NOT NULL DEFAULT 1,
        question_type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS multiple_choice_answers (
        student_answer_id UUID PRIMARY KEY REFERENCES student_answers(id) ON DELETE CASCADE,
        selected_option_id UUID NOT NULL REFERENCES multiple_choice_options(id) ON DELETE CASCADE
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS true_false_student_answers (
        student_answer_id UUID PRIMARY KEY REFERENCES student_answers(id) ON DELETE CASCADE,
        answer BOOLEAN NOT NULL
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS short_answer_student_answers (
        student_answer_id UUID PRIMARY KEY REFERENCES student_answers(id) ON DELETE CASCADE,
        answer TEXT NOT NULL
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS essay_student_answers (
        student_answer_id UUID PRIMARY KEY REFERENCES student_answers(id) ON DELETE CASCADE,
        answer TEXT NOT NULL,
        feedback TEXT,
        score NUMERIC
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS matching_student_answers (
        student_answer_id UUID PRIMARY KEY REFERENCES student_answers(id) ON DELETE CASCADE
      )
    `);

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS matching_student_pairs (
        id UUID PRIMARY KEY,
        student_answer_id UUID NOT NULL REFERENCES matching_student_answers(id) ON DELETE CASCADE,
        left_id UUID NOT NULL,
        right_id UUID NOT NULL
      )
    `);

    // Create spaced repetition table
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS spaced_repetition_items (
        id UUID PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        ease_factor NUMERIC NOT NULL DEFAULT 2.5,
        interval_days INTEGER NOT NULL DEFAULT 1,
        next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
        review_count INTEGER NOT NULL DEFAULT 0,
        last_reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(student_id, question_id)
      )
    `);

    // Create indexes for performance
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

    console.log("Database initialization completed successfully");
  } catch (error) {
    // Rollback transaction on error
    await client.queryObject("ROLLBACK");
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Allow running this script directly
if (import.meta.main) {
  await initializeDatabase();
  Deno.exit(0);
}
