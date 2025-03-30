import { Assignment } from "./Assignment.ts";

export interface EnhancedAssignment extends Assignment {
    confettiThreshold: number;        // Percentage score that triggers confetti
    allowRetakes: boolean;            // Allow students to retake assignments
    maxRetakes?: number;              // Maximum number of retakes allowed
    adaptiveLearningEnabled: boolean; // Generate follow-up assignments based on performance
    timeLimit?: number;               // Optional time limit for the entire assignment
    visibleToStudents: boolean;       // Control visibility to students
    instructions: string;             // Detailed instructions for students
    categories: string[];             // For organization and filtering
  }