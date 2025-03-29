import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { AssignmentType, DifficultyLevel } from "../../../../domain/models/Assignment.ts";
import { QuestionType } from "../../../../domain/models/Question.ts";
import { StudentAssignmentStatus } from "../../../../domain/models/StudentAssignment.ts";
import { evaluatedAssignmentsStore } from "../[id].tsx";

// Mock data for a completed assignment - used as fallback if no submission is found
const mockCompletedAssignment = {
  id: "1",
  title: "Math Fundamentals Quiz",
  description: "Test your understanding of basic math concepts.",
  type: AssignmentType.QUIZ,
  difficultyLevel: DifficultyLevel.MEDIUM,
  status: StudentAssignmentStatus.GRADED,
  dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  submittedAt: new Date(),
  score: 75,
  isAdaptive: false,
  questions: [
    {
      id: "q1",
      text: "What is 7 × 8?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: ["54", "56", "64", "72"],
      correctAnswer: "56",
      studentAnswer: "56",
      isCorrect: true,
    },
    {
      id: "q2",
      text: "Solve for x: 3x + 5 = 20",
      type: QuestionType.SHORT_ANSWER,
      correctAnswer: "5",
      studentAnswer: "6",
      isCorrect: false,
    },
    {
      id: "q3",
      text: "What is the area of a rectangle with length 8 units and width 5 units?",
      type: QuestionType.MULTIPLE_CHOICE,
      options: ["13 square units", "26 square units", "40 square units", "80 square units"],
      correctAnswer: "40 square units",
      studentAnswer: "40 square units",
      isCorrect: true,
    },
    {
      id: "q4",
      text: "Explain the concept of prime numbers and give three examples.",
      type: QuestionType.ESSAY,
      correctAnswer: "A prime number is a natural number greater than 1 that is not a product of two smaller natural numbers. Examples: 2, 3, 5, 7, 11, etc.",
      studentAnswer: "Prime numbers are numbers that can only be divided by 1 and themselves. Examples: 2, 3, 5.",
      isCorrect: true,
    },
  ],
  allowRetakes: true,
  maxRetakes: 2,
  retakeThreshold: 80,
  adaptiveEnabled: true,
  adaptiveThreshold: 80,
  confettiEnabled: true,
  retakesRemaining: 2,
  adaptiveAssignmentId: "5",
  weakAreas: ["algebra", "equations"],
};

// Helper function to identify weak areas based on incorrect answers
function identifyWeakAreas(questions: typeof mockCompletedAssignment.questions) {
  const weakAreas = new Set<string>();
  
  // Map question topics based on content
  // In a real app, this would be stored in the database
  const questionTopics: Record<string, string[]> = {
    "q1": ["multiplication", "arithmetic"],
    "q2": ["algebra", "equations"],
    "q3": ["geometry", "area"],
    "q4": ["number theory", "prime numbers"],
  };
  
  // Add topics from incorrect questions to weak areas
  questions.forEach(question => {
    if (!question.isCorrect) {
      const topics = questionTopics[question.id];
      if (topics) {
        topics.forEach(topic => weakAreas.add(topic));
      }
    }
  });
  
  return Array.from(weakAreas);
}

// Helper function to generate adaptive assignment
function generateAdaptiveAssignment(assignment: typeof mockCompletedAssignment) {
  // In a real app, this would create a new assignment focusing on weak areas
  // For demo purposes, we'll just return a mock ID
  return "adaptive-" + assignment.id;
}

// Helper function to transform evaluated assignment to results format
function transformToResultsFormat(evaluatedAssignment: any) {
  // Create a base result object
  const resultAssignment = {
    ...evaluatedAssignment,
    isAdaptive: false,
    allowRetakes: true,
    maxRetakes: 2,
    retakeThreshold: 80,
    adaptiveEnabled: true,
    adaptiveThreshold: 80,
    confettiEnabled: true,
    retakesRemaining: 2,
    adaptiveAssignmentId: "5",
    weakAreas: [] as string[],
  };
  
  // Transform questions to results format
  resultAssignment.questions = evaluatedAssignment.questions.map((q: any) => {
    let correctAnswer = "";
    
    // Extract correct answer based on question type
    if (q.type === QuestionType.MULTIPLE_CHOICE) {
      const correctOption = q.options.find((opt: any) => opt.isCorrect);
      correctAnswer = correctOption ? correctOption.text : "";
    } else if (q.type === QuestionType.SHORT_ANSWER) {
      correctAnswer = q.correctAnswers ? q.correctAnswers[0] : "";
    } else if (q.type === QuestionType.ESSAY) {
      correctAnswer = "Essay response";
    }
    
    return {
      id: q.id,
      text: q.prompt,
      type: q.type,
      correctAnswer,
      studentAnswer: q.studentAnswer || "",
      isCorrect: q.isCorrect,
      options: q.options?.map((opt: any) => opt.text) || [],
    };
  });
  
  return resultAssignment;
}

interface AssignmentResultsData {
  username: string;
  avatarId: string;
  assignment: typeof mockCompletedAssignment;
}

export const handler: Handlers<AssignmentResultsData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || "";
    const avatarId = url.searchParams.get("avatarId") || "avatar1";
    const _assignmentId = ctx.params.id; // Prefixed with underscore as it's not directly used
    const submissionKey = url.searchParams.get("submissionKey");
    
    if (!username) {
      // Redirect back to login if no username
      return new Response("", {
        status: 303,
        headers: { Location: "/student" },
      });
    }
    
    // Try to get the evaluated assignment from our store
    let assignment;
    
    if (submissionKey && evaluatedAssignmentsStore.has(submissionKey)) {
      // Get the evaluated assignment from the store
      const evaluatedAssignment = evaluatedAssignmentsStore.get(submissionKey);
      
      // Transform it to the results format
      assignment = transformToResultsFormat(evaluatedAssignment);
      
      // Identify weak areas based on incorrect answers
      assignment.weakAreas = identifyWeakAreas(assignment.questions);
      
      // Generate adaptive assignment ID if needed
      if (assignment.score < assignment.adaptiveThreshold && assignment.adaptiveEnabled) {
        assignment.adaptiveAssignmentId = generateAdaptiveAssignment(assignment);
      }
    } else {
      // Fallback to mock data if no submission is found
      // In a real app, we would fetch the assignment results from the database
      assignment = { ...mockCompletedAssignment };
      
      // Identify weak areas based on incorrect answers
      assignment.weakAreas = identifyWeakAreas(assignment.questions);
    }
    
    return ctx.render({
      username,
      avatarId,
      assignment,
    });
  },
};

export default function AssignmentResults({ data }: PageProps<AssignmentResultsData>) {
  const { username, avatarId, assignment } = data;
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };
  
  // Calculate stats
  const totalQuestions = assignment.questions.length;
  const correctAnswers = assignment.questions.filter(q => q.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  
  // Determine if student passed based on threshold
  const passed = assignment.score >= assignment.adaptiveThreshold;
  
  // Determine if student qualifies for a retake
  const qualifiesForRetake = !passed && assignment.allowRetakes && assignment.retakesRemaining > 0;
  
  // Determine if student qualifies for an adaptive assignment
  const qualifiesForAdaptive = !passed && assignment.adaptiveEnabled;
  
  return (
    <div class="max-w-4xl mx-auto">
      <Head>
        <title>Assignment Results</title>
        {assignment.confettiEnabled && passed && (
          <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
        )}
      </Head>
      
      {assignment.confettiEnabled && passed && (
        <script id="confetti-script">
          {`
            window.onload = function() {
              if (typeof confetti === 'function') {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 }
                });
              }
            }
          `}
        </script>
      )}
      
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Assignment Results</h1>
        <p class="text-gray-600">
          {assignment.title} - Submitted on {formatDate(assignment.submittedAt)}
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Score card */}
        <div class={`bg-white rounded-lg shadow-md p-6 border-t-4 ${
          passed ? "border-green-500" : "border-yellow-500"
        }`}>
          <h2 class="text-xl font-bold text-gray-800 mb-2">Your Score</h2>
          <div class="flex items-end">
            <div class={`text-5xl font-bold ${
              passed ? "text-green-600" : "text-yellow-600"
            }`}>
              {assignment.score}%
            </div>
            <div class="text-gray-500 ml-2 mb-1">
              ({correctAnswers}/{totalQuestions} correct)
            </div>
          </div>
          
          <div class="mt-4">
            <div class="flex justify-between mb-1">
              <span class="text-sm font-medium text-gray-700">Performance</span>
              <span class="text-sm font-medium text-gray-700">
                {passed ? "Passed" : "Needs Improvement"}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                class={`h-2.5 rounded-full ${passed ? "bg-green-600" : "bg-yellow-600"}`} 
                style={{ width: `${assignment.score}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Question breakdown */}
        <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
          <h2 class="text-xl font-bold text-gray-800 mb-2">Question Breakdown</h2>
          <div class="space-y-3">
            <div class="flex items-center">
              <div class="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <div class="text-gray-700">Correct: {correctAnswers}</div>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <div class="text-gray-700">Incorrect: {incorrectAnswers}</div>
            </div>
          </div>
          
          <div class="mt-4">
            <div class="w-full bg-gray-200 rounded-full h-4">
              <div 
                class="bg-green-500 h-4 rounded-l-full" 
                style={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Areas to improve */}
        <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-500">
          <h2 class="text-xl font-bold text-gray-800 mb-2">Areas to Improve</h2>
          
          {assignment.weakAreas.length > 0 ? (
            <div class="space-y-2">
              <p class="text-gray-600 text-sm">Focus on these areas for improvement:</p>
              <div class="flex flex-wrap gap-2 mt-2">
                {assignment.weakAreas.map(area => (
                  <span 
                    key={area} 
                    class="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p class="text-gray-600">Great job! Keep up the good work.</p>
          )}
        </div>
      </div>
      
      {/* Next steps */}
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Next Steps</h2>
        
        {passed ? (
          <div class="flex items-center p-4 bg-green-50 rounded-lg">
            <div class="p-2 bg-green-100 rounded-full mr-4">
              <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 class="font-medium text-green-800">Congratulations!</h3>
              <p class="text-green-700">
                You've successfully completed this assignment. Continue to the next one or review your answers.
              </p>
            </div>
          </div>
        ) : (
          <div class="space-y-4">
            {qualifiesForRetake && (
              <div class="flex items-center p-4 bg-yellow-50 rounded-lg">
                <div class="p-2 bg-yellow-100 rounded-full mr-4">
                  <svg class="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-yellow-800">Retake Available</h3>
                  <p class="text-yellow-700">
                    You have {assignment.retakesRemaining} retake{assignment.retakesRemaining !== 1 ? 's' : ''} remaining for this assignment.
                  </p>
                </div>
                <a 
                  href={`/student/assignment/${assignment.id}?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}&retake=true`}
                  class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md transition-colors"
                >
                  Retake
                </a>
              </div>
            )}
            
            {qualifiesForAdaptive && (
              <div class="flex items-center p-4 bg-blue-50 rounded-lg">
                <div class="p-2 bg-blue-100 rounded-full mr-4">
                  <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-blue-800">Adaptive Assignment Available</h3>
                  <p class="text-blue-700">
                    We've created a personalized assignment focusing on your areas for improvement.
                  </p>
                </div>
                <a 
                  href={`/student/assignment/${assignment.adaptiveAssignmentId}?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}`}
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  Start
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Question review */}
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Question Review</h2>
        
        <div class="space-y-6">
          {assignment.questions.map((question, index) => (
            <div key={question.id} class={`p-4 border rounded-lg ${
              question.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
            }`}>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-gray-800">Question {index + 1}</h3>
                <span class={`px-2 py-0.5 rounded text-xs font-medium ${
                  question.isCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                }`}>
                  {question.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
              
              <p class="text-gray-700 mb-3">{question.text}</p>
              
              <div class="space-y-2">
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-gray-500">Your Answer:</span>
                  <span class={`text-sm ${question.isCorrect ? "text-green-700" : "text-red-700"}`}>
                    {question.studentAnswer}
                  </span>
                </div>
                
                {!question.isCorrect && (
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-500">Correct Answer:</span>
                    <span class="text-sm text-green-700">{question.correctAnswer}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div class="flex justify-between">
        <a 
          href={`/student/assignment/${assignment.id}?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}`}
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Review Assignment
        </a>
        
        <a 
          href={`/student/dashboard?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}`}
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
