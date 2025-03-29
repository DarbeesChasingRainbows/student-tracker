import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { AssignmentType, DifficultyLevel } from "../../../domain/models/Assignment.ts";
import { QuestionType } from "../../../domain/models/Question.ts";
import { StudentAssignmentStatus } from "../../../domain/models/StudentAssignment.ts";
import { z } from "zod";

// In-memory store for evaluated assignments (in a real app, this would be a database)
// This is a temporary solution for the demo
const evaluatedAssignmentsStore = new Map<string, any>();

// Mock data for an assignment
const mockAssignment = {
  id: "1",
  title: "Math Fundamentals Quiz",
  description: "Test your understanding of basic math concepts.",
  type: AssignmentType.QUIZ,
  difficultyLevel: DifficultyLevel.MEDIUM,
  status: StudentAssignmentStatus.IN_PROGRESS,
  dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  score: 0,
  submittedAt: null as Date | null,
  questions: [
    {
      id: "q1",
      prompt: "What is 7 × 8?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        { id: "opt1", text: "54", isCorrect: false },
        { id: "opt2", text: "56", isCorrect: true },
        { id: "opt3", text: "64", isCorrect: false },
        { id: "opt4", text: "72", isCorrect: false },
      ],
      studentAnswer: null as string | null,
    },
    {
      id: "q2",
      prompt: "Solve for x: 3x + 5 = 20",
      type: QuestionType.SHORT_ANSWER,
      correctAnswers: ["5"],
      studentAnswer: null as string | null,
    },
    {
      id: "q3",
      prompt: "What is the area of a rectangle with length 8 units and width 5 units?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: [
        { id: "opt1", text: "13 square units", isCorrect: false },
        { id: "opt2", text: "26 square units", isCorrect: false },
        { id: "opt3", text: "40 square units", isCorrect: true },
        { id: "opt4", text: "80 square units", isCorrect: false },
      ],
      studentAnswer: null as string | null,
    },
    {
      id: "q4",
      prompt: "Explain the concept of prime numbers and give three examples.",
      type: QuestionType.ESSAY,
      wordLimit: 100,
      studentAnswer: null as string | null,
    },
  ],
};

// Validation schema for answers
const AnswersSchema = z.record(z.string());

interface AssignmentData {
  username: string;
  avatarId: string;
  assignment: typeof mockAssignment;
  errors?: Record<string, string>;
  answers?: Record<string, string>;
  isRetake?: boolean;
}

export const handler: Handlers<AssignmentData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const _username = url.searchParams.get("username") || "";
    const _avatarId = url.searchParams.get("avatarId") || "avatar1";
    const _assignmentId = ctx.params.id;
    const isRetake = url.searchParams.get("retake") === "true";
    
    if (!_username) {
      // Redirect back to login if no username
      return new Response("", {
        status: 303,
        headers: { Location: "/student" },
      });
    }
    
    // In a real app, we would fetch the assignment from the database
    // For demo purposes, we'll use mock data
    
    // If this is a retake, we should reset any previous answers
    const assignment = { ...mockAssignment };
    if (isRetake) {
      assignment.questions = assignment.questions.map(q => ({
        ...q,
        studentAnswer: null
      }));
      assignment.status = StudentAssignmentStatus.IN_PROGRESS;
    }
    
    return ctx.render({
      username: _username,
      avatarId: _avatarId,
      assignment: assignment,
      isRetake: isRetake
    });
  },
  
  async POST(req, ctx) {
    const url = new URL(req.url);
    const _username = url.searchParams.get("username") || "";
    const _avatarId = url.searchParams.get("avatarId") || "avatar1";
    const assignmentId = ctx.params.id;
    const isRetake = url.searchParams.get("retake") === "true";
    
    if (!_username) {
      // Redirect back to login if no username
      return new Response("", {
        status: 303,
        headers: { Location: "/student" },
      });
    }
    
    // Parse form data
    const formData = await req.formData();
    const answers: Record<string, string> = {};
    
    // Extract answers from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("answer_")) {
        const questionId = key.replace("answer_", "");
        answers[questionId] = value.toString();
      }
    }
    
    // Validate answers
    const result = AnswersSchema.safeParse(answers);
    
    if (!result.success) {
      // Return validation errors
      const errors: Record<string, string> = {};
      
      result.error.issues.forEach(issue => {
        const questionId = issue.path[0].toString();
        errors[questionId] = issue.message;
      });
      
      // Add custom validation for empty answers
      mockAssignment.questions.forEach(question => {
        if (!answers[question.id] || answers[question.id].trim() === "") {
          errors[question.id] = "Please provide an answer";
        }
      });
      
      return ctx.render({
        username: _username,
        avatarId: _avatarId,
        assignment: mockAssignment,
        errors,
        answers,
        isRetake
      });
    }
    
    // In a real app, we would save the answers to the database
    // and calculate the score
    
    // For demo purposes, let's evaluate the answers and calculate a score
    const evaluatedAssignment = evaluateAssignment(mockAssignment, answers);
    
    // Store the evaluated assignment in our temporary store
    // Create a unique key based on username and assignment ID
    const storeKey = `${_username}_${assignmentId}`;
    evaluatedAssignmentsStore.set(storeKey, evaluatedAssignment);
    
    // Redirect to results page
    const redirectUrl = `/student/assignment/${assignmentId}/results?username=${encodeURIComponent(_username)}&avatarId=${encodeURIComponent(_avatarId)}&submissionKey=${encodeURIComponent(storeKey)}`;
    
    return new Response("", {
      status: 303,
      headers: { Location: redirectUrl },
    });
  },
};

// Helper function to evaluate an assignment
function evaluateAssignment(assignment: typeof mockAssignment, answers: Record<string, string>) {
  let correctCount = 0;
  const totalQuestions = assignment.questions.length;
  
  // Create a copy of the assignment to update
  const _evaluatedAssignment = { ...assignment };
  
  // Evaluate each question
  _evaluatedAssignment.questions = assignment.questions.map(question => {
    const answer = answers[question.id];
    let isCorrect = false;
    
    // Evaluate based on question type
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      // Find the selected option
      const selectedOption = question.options?.find(opt => opt.id === answer);
      isCorrect = selectedOption?.isCorrect || false;
    } else if (question.type === QuestionType.SHORT_ANSWER) {
      // Check if answer matches any of the correct answers (case insensitive)
      isCorrect = question.correctAnswers?.some(
        correctAns => correctAns.toLowerCase() === answer.toLowerCase()
      ) || false;
    } else if (question.type === QuestionType.ESSAY) {
      // For essays, we would need a more sophisticated evaluation
      // For demo purposes, let's assume it's correct if it's not empty
      isCorrect = answer.trim().length > 0;
    }
    
    if (isCorrect) {
      correctCount++;
    }
    
    // Return with proper type handling
    return {
      ...question,
      studentAnswer: answer as string, // Type assertion to string
      isCorrect
    };
  }) as typeof mockAssignment.questions; // Type assertion for the entire array
  
  // Calculate score as a percentage
  const score = Math.round((correctCount / totalQuestions) * 100);
  
  // Update assignment status and score
  _evaluatedAssignment.status = StudentAssignmentStatus.GRADED;
  _evaluatedAssignment.score = score;
  _evaluatedAssignment.submittedAt = new Date();
  
  // In a real application, we would store this in a database
  // For this demo, we'll just return it
  return _evaluatedAssignment;
}

export default function Assignment({ data }: PageProps<AssignmentData>) {
  const { username: _username, avatarId: _avatarId, assignment, errors = {}, answers = {}, isRetake = false } = data;
  // Variables prefixed with underscore to indicate they're not used directly in this component
  // but are used for routing in form submissions
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  return (
    <div class="max-w-4xl mx-auto">
      <Head>
        <title>{assignment.title}</title>
      </Head>
      
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">{assignment.title}</h1>
        <p class="text-gray-600">{assignment.description}</p>
        <div class="mt-2 flex items-center text-sm text-gray-500">
          <span class="mr-4">Due: {formatDate(assignment.dueDate)}</span>
          <span class={`px-2 py-1 rounded-full text-xs font-medium ${
            assignment.difficultyLevel === DifficultyLevel.EASY
              ? "bg-green-100 text-green-800"
              : assignment.difficultyLevel === DifficultyLevel.MEDIUM
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}>
            {assignment.difficultyLevel}
          </span>
          {isRetake && (
            <span class="ml-4 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Retake
            </span>
          )}
        </div>
      </div>
      
      <form method="POST" class="space-y-8">
        {assignment.questions.map((question, index) => (
          <div key={question.id} class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-start mb-4">
              <h3 class="text-lg font-medium text-gray-900">
                Question {index + 1}: {question.prompt}
              </h3>
              <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                question.type === QuestionType.MULTIPLE_CHOICE
                  ? "bg-blue-100 text-blue-800"
                  : question.type === QuestionType.SHORT_ANSWER
                    ? "bg-green-100 text-green-800"
                    : "bg-purple-100 text-purple-800"
              }`}>
                {question.type}
              </span>
            </div>
            
            {/* Multiple choice question */}
            {question.type === QuestionType.MULTIPLE_CHOICE && (
              <div class="space-y-2">
                {question.options?.map(option => (
                  <label key={option.id} class="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`answer_${question.id}`}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      class="h-5 w-5 text-purple-600 focus:ring-purple-500"
                    />
                    <span class="text-gray-900">{option.text}</span>
                  </label>
                ))}
                {errors[question.id] && (
                  <p class="mt-2 text-sm text-red-600">{errors[question.id]}</p>
                )}
              </div>
            )}
            
            {/* Short answer question */}
            {question.type === QuestionType.SHORT_ANSWER && (
              <div>
                <input
                  type="text"
                  name={`answer_${question.id}`}
                  value={answers[question.id] || ""}
                  placeholder="Your answer"
                  class={`mt-1 block w-full px-3 py-2 border ${
                    errors[question.id] ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                />
                {errors[question.id] && (
                  <p class="mt-2 text-sm text-red-600">{errors[question.id]}</p>
                )}
              </div>
            )}
            
            {/* Essay question */}
            {question.type === QuestionType.ESSAY && (
              <div>
                <textarea
                  name={`answer_${question.id}`}
                  value={answers[question.id] || ""}
                  placeholder="Your answer"
                  rows={5}
                  class={`mt-1 block w-full px-3 py-2 border ${
                    errors[question.id] ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500`}
                ></textarea>
                {question.wordLimit && (
                  <p class="mt-1 text-sm text-gray-500">
                    Word limit: {question.wordLimit} words
                  </p>
                )}
                {errors[question.id] && (
                  <p class="mt-2 text-sm text-red-600">{errors[question.id]}</p>
                )}
              </div>
            )}
          </div>
        ))}
        
        <div class="flex justify-between">
          <a
            href={`/student/dashboard?username=${encodeURIComponent(_username)}&avatarId=${encodeURIComponent(_avatarId)}`}
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </a>
          
          <button
            type="submit"
            class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md shadow-sm transition-colors"
          >
            Submit Assignment
          </button>
        </div>
      </form>
    </div>
  );
}

export { evaluatedAssignmentsStore };
