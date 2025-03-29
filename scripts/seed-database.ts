#!/usr/bin/env -S deno run -A
/**
 * Database Seeding Script
 * 
 * This script populates the PostgreSQL database with initial data for development and testing.
 * It creates sample students, guardians, assignments, and other necessary data.
 */

import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { AssignmentType, AssignmentStatus } from "../domain/models/Assignment.ts";
import { StudentAssignmentStatus } from "../domain/models/StudentAssignment.ts";
import { QuestionType, DifficultyLevel } from "../domain/models/Question.ts";

// Get database connection string from config
const connectionString = "postgres://postgres:postgres@localhost:5432/student_tracker_dev";
const pool = new Pool(connectionString, 5);

// Sample guardian data
const guardians = [
  {
    name: "Robert Johnson",
    email: "robert.johnson@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, USA",
    notes: "Prefers to be contacted via email"
  },
  {
    name: "Mary Smith",
    email: "mary.smith@example.com",
    phone: "(555) 234-5678",
    address: "456 Oak Ave, Anytown, USA",
    notes: "Available after 4pm for calls"
  },
  {
    name: "Patricia Davis",
    email: "patricia.davis@example.com",
    phone: "(555) 345-6789",
    address: "789 Pine St, Anytown, USA",
    notes: "Works from home, can be reached anytime"
  }
];

// Sample student data
const students = [
  {
    firstName: "Alice",
    lastName: "Johnson",
    name: "Alice Johnson",
    username: "alice_j",
    email: "alice.johnson@example.com",
    grade: "10th",
    avatarId: "avatar1",
    notes: "Alice is a highly motivated student who excels in mathematics and science."
  },
  {
    firstName: "Bob",
    lastName: "Smith",
    name: "Bob Smith",
    username: "bob_s",
    email: "bob.smith@example.com",
    grade: "9th",
    avatarId: "avatar2",
    notes: "Bob needs additional support with reading comprehension."
  },
  {
    firstName: "Charlie",
    lastName: "Davis",
    name: "Charlie Davis",
    username: "charlie_d",
    email: "charlie.davis@example.com",
    grade: "11th",
    avatarId: "avatar3",
    notes: "Charlie shows strong aptitude for creative writing and arts."
  }
];

// Sample question tags
const questionTags = [
  { name: "Algebra", description: "Basic and advanced algebraic concepts" },
  { name: "Grammar", description: "English grammar rules and usage" },
  { name: "Chemistry", description: "Chemical reactions and properties" }
];

// Sample questions
const questions = [
  {
    prompt: "Solve for x: 2x + 5 = 13",
    type: QuestionType.SHORT_ANSWER,
    difficultyLevel: DifficultyLevel.MEDIUM,
    explanation: "Subtract 5 from both sides, then divide by 2 to get x = 4",
    tags: ["Algebra"],
    correctAnswer: "4",
    caseSensitive: false
  },
  {
    prompt: "The chemical formula for water is H2O.",
    type: QuestionType.TRUE_FALSE,
    difficultyLevel: DifficultyLevel.EASY,
    explanation: "Water is indeed composed of two hydrogen atoms and one oxygen atom.",
    tags: ["Chemistry"],
    correctAnswer: true
  },
  {
    prompt: "Which of the following is a correct use of a semicolon?",
    type: QuestionType.MULTIPLE_CHOICE,
    difficultyLevel: DifficultyLevel.MEDIUM,
    explanation: "A semicolon is used to connect two independent clauses.",
    tags: ["Grammar"],
    options: [
      { text: "I went to the store; to buy milk.", isCorrect: false },
      { text: "I went to the store; I needed milk.", isCorrect: true },
      { text: "I went to the store; to buy milk.", isCorrect: false },
      { text: "I; went to the store to buy milk.", isCorrect: false }
    ]
  }
];

// Sample assignment data
const assignments = [
  {
    title: "Algebra Fundamentals",
    description: "Review of basic algebraic concepts including equations and inequalities.",
    type: AssignmentType.HOMEWORK,
    questionIds: [],
    createdBy: "admin",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    settings: {
      allowRetake: true,
      allowQuestionRetry: true,
      confettiThreshold: 80,
      confettiOnCorrectAnswer: false,
      adaptiveReassignThreshold: 70
    }
  },
  {
    title: "Literary Analysis Essay",
    description: "Write a 500-word analysis of the themes in 'To Kill a Mockingbird'.",
    type: AssignmentType.HOMEWORK,
    questionIds: [],
    createdBy: "admin",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    settings: {
      allowRetake: false,
      allowQuestionRetry: false,
      confettiThreshold: 90,
      confettiOnCorrectAnswer: false,
      adaptiveReassignThreshold: 80
    }
  }
];

// Sample student-guardian relationships
const studentGuardianRelationships = [
  { studentIndex: 0, guardianIndex: 0, relationshipType: "Parent", isPrimary: true },
  { studentIndex: 1, guardianIndex: 1, relationshipType: "Parent", isPrimary: true },
  { studentIndex: 2, guardianIndex: 2, relationshipType: "Parent", isPrimary: true }
];

/**
 * Seed the database with initial data
 */
async function seedDatabase() {
  console.log("Starting database seeding...");
  
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.queryObject("BEGIN");
    
    console.log("Clearing existing data...");
    
    // Clear existing data (if any) - in reverse order of dependencies
    await client.queryObject("DELETE FROM student_guardians");
    await client.queryObject("DELETE FROM adaptive_learning_data");
    await client.queryObject("DELETE FROM learning_analytics");
    await client.queryObject("DELETE FROM multiple_choice_answers");
    await client.queryObject("DELETE FROM true_false_student_answers");
    await client.queryObject("DELETE FROM short_answer_student_answers");
    await client.queryObject("DELETE FROM essay_student_answers");
    await client.queryObject("DELETE FROM matching_student_answers");
    await client.queryObject("DELETE FROM student_answers");
    await client.queryObject("DELETE FROM student_assignments");
    await client.queryObject("DELETE FROM multiple_choice_options");
    await client.queryObject("DELETE FROM true_false_answers");
    await client.queryObject("DELETE FROM short_answer_answers");
    await client.queryObject("DELETE FROM essay_questions");
    await client.queryObject("DELETE FROM matching_pairs");
    await client.queryObject("DELETE FROM questions");
    await client.queryObject("DELETE FROM question_tags");
    await client.queryObject("DELETE FROM assignments");
    await client.queryObject("DELETE FROM students");
    await client.queryObject("DELETE FROM guardians");
    
    console.log("Seeding guardians...");
    
    // Insert guardians
    const guardianIds: string[] = [];
    for (const guardian of guardians) {
      const result = await client.queryObject<{ id: string }>(
        `INSERT INTO guardians (
          id, name, email, phone, address, notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING id`,
        [
          crypto.randomUUID(),
          guardian.name,
          guardian.email,
          guardian.phone,
          guardian.address,
          guardian.notes,
          new Date(),
          new Date()
        ]
      );
      
      guardianIds.push(result.rows[0].id);
      console.log(`Added guardian: ${guardian.name}`);
    }
    
    console.log("Seeding students...");
    
    // Insert students
    const studentIds: string[] = [];
    for (const student of students) {
      const result = await client.queryObject<{ id: string }>(
        `INSERT INTO students (
          id, first_name, last_name, name, username, email, grade, avatar_id, 
          notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING id`,
        [
          crypto.randomUUID(),
          student.firstName,
          student.lastName,
          student.name,
          student.username,
          student.email,
          student.grade,
          student.avatarId,
          student.notes,
          new Date(),
          new Date()
        ]
      );
      
      studentIds.push(result.rows[0].id);
      console.log(`Added student: ${student.firstName} ${student.lastName}`);
    }
    
    console.log("Seeding student-guardian relationships...");
    
    // Insert student-guardian relationships
    for (const relationship of studentGuardianRelationships) {
      await client.queryObject(
        `INSERT INTO student_guardians (
          id, student_id, guardian_id, relationship_type, is_primary, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )`,
        [
          crypto.randomUUID(),
          studentIds[relationship.studentIndex],
          guardianIds[relationship.guardianIndex],
          relationship.relationshipType,
          relationship.isPrimary,
          new Date(),
          new Date()
        ]
      );
      
      console.log(`Added relationship: ${students[relationship.studentIndex].name} - ${guardians[relationship.guardianIndex].name}`);
    }
    
    console.log("Seeding question tags...");
    
    // Insert question tags
    const tagIds: string[] = [];
    for (const tag of questionTags) {
      const result = await client.queryObject<{ id: string }>(
        `INSERT INTO question_tags (
          id, name, description, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING id`,
        [
          crypto.randomUUID(),
          tag.name,
          tag.description,
          new Date(),
          new Date()
        ]
      );
      
      tagIds.push(result.rows[0].id);
      console.log(`Added question tag: ${tag.name}`);
    }
    
    console.log("Seeding questions...");
    
    // Insert questions
    const questionIds: string[] = [];
    for (const question of questions) {
      // Find tag IDs for this question
      const questionTagIds = question.tags.map(tagName => {
        const tagIndex = questionTags.findIndex(t => t.name === tagName);
        return tagIds[tagIndex];
      });
      
      const result = await client.queryObject<{ id: string }>(
        `INSERT INTO questions (
          id, prompt, type, difficulty_level, explanation, tags, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING id`,
        [
          crypto.randomUUID(),
          question.prompt,
          question.type,
          question.difficultyLevel,
          question.explanation,
          JSON.stringify(questionTagIds),
          studentIds[0], // Using first student as admin for simplicity
          new Date(),
          new Date()
        ]
      );
      
      const questionId = result.rows[0].id;
      questionIds.push(questionId);
      
      // Insert question-specific data based on type
      if (question.type === QuestionType.MULTIPLE_CHOICE && question.options) {
        for (const option of question.options) {
          await client.queryObject(
            `INSERT INTO multiple_choice_options (
              id, question_id, text, is_correct, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6
            )`,
            [
              crypto.randomUUID(),
              questionId,
              option.text,
              option.isCorrect,
              new Date(),
              new Date()
            ]
          );
        }
      } else if (question.type === QuestionType.TRUE_FALSE) {
        await client.queryObject(
          `INSERT INTO true_false_answers (
            question_id, correct_answer, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4
          )`,
          [
            questionId,
            question.correctAnswer,
            new Date(),
            new Date()
          ]
        );
      } else if (question.type === QuestionType.SHORT_ANSWER) {
        await client.queryObject(
          `INSERT INTO short_answer_answers (
            id, question_id, correct_answer, case_sensitive, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6
          )`,
          [
            crypto.randomUUID(),
            questionId,
            question.correctAnswer,
            question.caseSensitive || false,
            new Date(),
            new Date()
          ]
        );
      }
      
      console.log(`Added question: ${question.prompt.substring(0, 30)}...`);
    }
    
    console.log("Seeding assignments...");
    
    // Insert assignments with question IDs
    const assignmentIds: string[] = [];
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      
      // Assign questions to assignments
      const assignmentQuestionIds = questionIds.slice(i % questionIds.length, (i % questionIds.length) + 2);
      
      const result = await client.queryObject<{ id: string }>(
        `INSERT INTO assignments (
          id, title, description, type, question_ids, created_by, due_date, 
          settings, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING id`,
        [
          crypto.randomUUID(),
          assignment.title,
          assignment.description,
          assignment.type,
          JSON.stringify(assignmentQuestionIds),
          assignment.createdBy,
          assignment.dueDate,
          JSON.stringify(assignment.settings),
          AssignmentStatus.ASSIGNED,
          new Date(),
          new Date()
        ]
      );
      
      assignmentIds.push(result.rows[0].id);
      console.log(`Added assignment: ${assignment.title}`);
    }
    
    console.log("Assigning assignments to students...");
    
    // Assign assignments to students
    for (let i = 0; i < studentIds.length; i++) {
      // Assign different combinations of assignments to each student
      const assignmentsForStudent = i % 2 === 0 
        ? assignmentIds 
        : assignmentIds.slice(0, 1);
      
      for (const assignmentId of assignmentsForStudent) {
        // Randomize status
        const statuses = [
          StudentAssignmentStatus.ASSIGNED,
          StudentAssignmentStatus.IN_PROGRESS,
          StudentAssignmentStatus.COMPLETED,
          StudentAssignmentStatus.GRADED
        ];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Generate random score for completed assignments
        const score = status === StudentAssignmentStatus.COMPLETED || status === StudentAssignmentStatus.GRADED
          ? Math.floor(Math.random() * 30) + 70 // Score between 70-100
          : null;
        
        const _studentAssignmentResult = await client.queryObject<{ id: string }>(
          `INSERT INTO student_assignments (
            id, student_id, assignment_id, status, score, started_at, 
            submitted_at, graded_at, attempts, feedback, is_adaptive,
            due_date, completed_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          ) RETURNING id`,
          [
            crypto.randomUUID(),
            studentIds[i],
            assignmentId,
            status,
            score,
            status !== StudentAssignmentStatus.ASSIGNED ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
            status === StudentAssignmentStatus.COMPLETED || status === StudentAssignmentStatus.GRADED ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
            status === StudentAssignmentStatus.GRADED ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) : null,
            Math.floor(Math.random() * 3) + 1, // 1-3 attempts
            status === StudentAssignmentStatus.GRADED ? "Good work!" : null,
            false,
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 1 week
            status === StudentAssignmentStatus.COMPLETED || status === StudentAssignmentStatus.GRADED ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
            new Date(),
            new Date()
          ]
        );
        
        console.log(`Assigned ${assignments.find((_a, index) => index === assignmentIds.indexOf(assignmentId))?.title} to student ${i + 1}`);
      }
    }
    
    // Add learning analytics for each student
    console.log("Adding learning analytics data...");
    
    for (let i = 0; i < studentIds.length; i++) {
      await client.queryObject(
        `INSERT INTO learning_analytics (
          id, student_id, subject, topic, proficiency_level,
          strengths, weaknesses, recommendations, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )`,
        [
          crypto.randomUUID(),
          studentIds[i],
          "Mathematics",
          "Algebra",
          Math.floor(Math.random() * 40) + 60, // 60-100
          JSON.stringify(["Equation solving", "Linear functions"]),
          JSON.stringify(["Quadratic equations", "Word problems"]),
          JSON.stringify(["Practice more word problems", "Review quadratic formula"]),
          new Date(),
          new Date()
        ]
      );
    }
    
    // Commit transaction
    await client.queryObject("COMMIT");
    console.log("Database seeding completed successfully!");
    
  } catch (error) {
    // Rollback transaction on error
    await client.queryObject("ROLLBACK");
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

// Run the seeding function
await seedDatabase();

// Close the connection pool
await pool.end();
