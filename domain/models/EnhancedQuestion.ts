import { DifficultyLevel } from "./Assignment.ts";
import { Question } from "./Question.ts";

// Enhanced question types with multimedia support
export enum QuestionType {
    MULTIPLE_CHOICE = "multiple_choice",
    TRUE_FALSE = "true_false",
    SHORT_ANSWER = "short_answer",
    ESSAY = "essay",
    MATCHING = "matching",
    FILL_IN_BLANK = "fill_in_blank",  // New type
    MULTIMEDIA = "multimedia"         // New type for images/audio
  }
  
  // Enhanced question model
  export interface EnhancedQuestion extends Question {
    mediaUrl?: string;         // Optional URL to image/audio
    mediaType?: string;        // "image", "audio", etc.
    timeLimit?: number;        // Time limit in seconds
    pointValue?: number;       // Points for gamification
    difficultyLevel: DifficultyLevel;
    tags: string[];            // For categorization and retrieval
    spacedRepetitionData?: {   // For Anki-like functionality
      initialInterval: number,
      reviewDates: Date[]
    }
  }