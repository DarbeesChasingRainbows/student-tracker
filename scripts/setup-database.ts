#!/usr/bin/env -S deno run -A
/**
 * Database Setup Script
 * 
 * This script creates the PostgreSQL database and tables for the student tracker application.
 * Run this script before running the seed-database.ts script.
 */

import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// PostgreSQL connection string for the default postgres database
const connectionString = "postgres://postgres:postgres@localhost:5432/postgres";
const pool = new Pool(connectionString, 1);

// Database name to create
const dbName = "student_tracker_dev";

/**
 * Create the database if it doesn't exist
 */
async function setupDatabase() {
  console.log("Setting up database...");
  
  const client = await pool.connect();
  
  try {
    // Check if database exists
    const result = await client.queryObject<{ exists: boolean }>(
      `SELECT EXISTS(
        SELECT 1 FROM pg_database WHERE datname = $1
      )`,
      [dbName]
    );
    
    const dbExists = result.rows[0].exists;
    
    if (dbExists) {
      console.log(`Database '${dbName}' already exists.`);
    } else {
      // Create database
      console.log(`Creating database '${dbName}'...`);
      await client.queryObject(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created successfully.`);
    }
    
  } catch (error) {
    console.error("Error setting up database:", error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

/**
 * Create the tables in the database
 */
async function createTables() {
  console.log("Creating tables in the database...");
  
  // Connect to the student_tracker_dev database
  const appDbPool = new Pool(`postgres://postgres:postgres@localhost:5432/${dbName}`, 1);
  const client = await appDbPool.connect();
  
  try {
    // Begin transaction
    await client.queryObject("BEGIN");
    
    // Create guardians table
    console.log("Creating guardians table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS guardians (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Create students table
    console.log("Creating students table...");
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
    
    // Create student_guardian relationship table (many-to-many)
    console.log("Creating student_guardian relationship table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS student_guardians (
        id UUID PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
        relationship_type TEXT NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(student_id, guardian_id)
      )
    `);
    
    // Create question tags table
    console.log("Creating question_tags table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS question_tags (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Create base questions table
    console.log("Creating questions table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY,
        prompt TEXT NOT NULL,
        type TEXT NOT NULL,
        difficulty_level TEXT NOT NULL,
        explanation TEXT,
        group_name TEXT,
        created_by UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Create question_tags_map table for many-to-many relationship
    console.log("Creating question_tags_map table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS question_tags_map (
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES question_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (question_id, tag_id)
      )
    `);
    
    // Create multiple choice options table
    console.log("Creating multiple_choice_options table...");
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
    
    // Create true_false_answers table
    console.log("Creating true_false_answers table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS true_false_answers (
        question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
        correct_answer BOOLEAN NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Create short_answer_answers table
    console.log("Creating short_answer_answers table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS short_answer_answers (
        id UUID PRIMARY KEY,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        correct_answer TEXT NOT NULL,
        case_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Create essay_questions table
    console.log("Creating essay_questions table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS essay_questions (
        question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
        rubric TEXT,
        word_limit INTEGER,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Create matching_pairs table
    console.log("Creating matching_pairs table...");
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
    
    // Create assignments table
    console.log("Creating assignments table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS assignments (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        question_ids JSONB NOT NULL,
        created_by TEXT NOT NULL,
        due_date TIMESTAMP WITH TIME ZONE,
        settings JSONB NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Create student_assignments table
    console.log("Creating student_assignments table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS student_assignments (
        id UUID PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        score NUMERIC,
        started_at TIMESTAMP WITH TIME ZONE,
        submitted_at TIMESTAMP WITH TIME ZONE,
        graded_at TIMESTAMP WITH TIME ZONE,
        attempts INTEGER NOT NULL DEFAULT 0,
        feedback TEXT,
        is_adaptive BOOLEAN NOT NULL DEFAULT FALSE,
        original_assignment_id UUID,
        due_date TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Create base student_answers table
    console.log("Creating student_answers table...");
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
    
    // Create multiple_choice_answers table
    console.log("Creating multiple_choice_answers table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS multiple_choice_answers (
        answer_id UUID PRIMARY KEY REFERENCES student_answers(id) ON DELETE CASCADE,
        selected_option_id UUID NOT NULL REFERENCES multiple_choice_options(id) ON DELETE CASCADE
      )
    `);
    
    // Create true_false_student_answers table
    console.log("Creating true_false_student_answers table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS true_false_student_answers (
        answer_id UUID PRIMARY KEY REFERENCES student_answers(id) ON DELETE CASCADE,
        answer BOOLEAN NOT NULL
      )
    `);
    
    // Create short_answer_student_answers table
    console.log("Creating short_answer_student_answers table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS short_answer_student_answers (
        answer_id UUID PRIMARY KEY REFERENCES student_answers(id) ON DELETE CASCADE,
        answer TEXT NOT NULL
      )
    `);
    
    // Create essay_student_answers table
    console.log("Creating essay_student_answers table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS essay_student_answers (
        answer_id UUID PRIMARY KEY REFERENCES student_answers(id) ON DELETE CASCADE,
        answer TEXT NOT NULL,
        word_count INTEGER,
        feedback TEXT,
        rubric_scores JSONB
      )
    `);
    
    // Create matching_student_answers table
    console.log("Creating matching_student_answers table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS matching_student_answers (
        id UUID PRIMARY KEY,
        answer_id UUID NOT NULL REFERENCES student_answers(id) ON DELETE CASCADE,
        left_id UUID NOT NULL,
        right_id UUID NOT NULL
      )
    `);
    
    // Create adaptive_learning_data table for tracking spaced repetition
    console.log("Creating adaptive_learning_data table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS adaptive_learning_data (
        id UUID PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        ease_factor NUMERIC NOT NULL DEFAULT 2.5,
        interval_days INTEGER NOT NULL DEFAULT 1,
        repetitions INTEGER NOT NULL DEFAULT 0,
        next_review_date TIMESTAMP WITH TIME ZONE,
        last_review_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(student_id, question_id)
      )
    `);
    
    // Create learning_analytics table for tracking student performance
    console.log("Creating learning_analytics table...");
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS learning_analytics (
        id UUID PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        subject TEXT,
        topic TEXT,
        proficiency_level NUMERIC NOT NULL DEFAULT 0,
        strengths JSONB,
        weaknesses JSONB,
        recommendations JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    
    // Commit transaction
    await client.queryObject("COMMIT");
    console.log("Tables created successfully.");
    
  } catch (error) {
    // Rollback transaction on error
    await client.queryObject("ROLLBACK");
    console.error("Error creating tables:", error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
    await appDbPool.end();
  }
}

// Run the setup function
await setupDatabase();

// Create tables
await createTables();

// Close the connection pool
await pool.end();

console.log("Database setup complete. You can now run the seed-database.ts script.");
