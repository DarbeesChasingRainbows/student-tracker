import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { StudentAssignmentStatus } from "../../domain/models/StudentAssignment.ts";
import { AssignmentType, DifficultyLevel } from "../../domain/models/Assignment.ts";
import { QuestionType } from "../../domain/models/Question.ts";
import AvatarImage from "../../islands/AvatarImage.tsx";
import { evaluatedAssignmentsStore as importedEvaluatedAssignmentsStore } from "./assignment/[id].tsx";

// Base mock data for student assignments
const baseMockAssignments = [
  {
    id: "1",
    title: "Math Fundamentals Quiz",
    type: AssignmentType.QUIZ,
    status: StudentAssignmentStatus.ASSIGNED,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    isAdaptive: false,
  },
  {
    id: "2",
    title: "Science Homework - Chapter 3",
    type: AssignmentType.HOMEWORK,
    status: StudentAssignmentStatus.GRADED,
    score: 85,
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isAdaptive: false,
  },
  {
    id: "3",
    title: "English Literature Test",
    type: AssignmentType.TEST,
    status: StudentAssignmentStatus.IN_PROGRESS,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    isAdaptive: false,
  },
  {
    id: "4",
    title: "Adaptive: Math Fundamentals",
    type: AssignmentType.QUIZ,
    status: StudentAssignmentStatus.ASSIGNED,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isAdaptive: true,
    parentAssignmentId: "1", // Reference to the original assignment
  },
];

// Mock data for student progress
const mockProgress = {
  averageScore: 82,
  completedAssignments: 8,
  totalAssignments: 12,
  weakAreas: [
    { tag: "algebra", count: 5 },
    { tag: "grammar", count: 3 },
  ],
};

// Define proper types for the evaluatedAssignmentsStore entries
interface EvaluatedAssignment {
  id: string;
  title: string;
  description: string;
  status: StudentAssignmentStatus;
  score: number;
  type?: AssignmentType;
  questions: Array<{
    id: string;
    prompt: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  submittedAt?: Date;
  weakAreas?: string[];
}

// Define type for adaptive assignments
interface AdaptiveAssignment {
  id: string;
  title: string;
  description: string;
  type: AssignmentType;
  difficultyLevel: DifficultyLevel;
  dueDate: Date;
  questions: Array<{
    id: string;
    prompt: string;
    type: QuestionType;
    options?: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
  status: StudentAssignmentStatus;
  originalAssignmentId: string;
  weakAreas: string[];
}

// Global store for tracking adaptive assignments
// In a real app, this would be in a database
// Use a different name to avoid conflicts with the imported store
export const evaluatedAssignmentsStore = importedEvaluatedAssignmentsStore;
export const adaptiveAssignmentsStore = new Map<string, AdaptiveAssignment>();

interface StudentDashboardData {
  username: string;
  avatarId: string;
  assignments: typeof baseMockAssignments;
  progress: typeof mockProgress;
}

export const handler: Handlers<StudentDashboardData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || "";
    const avatarId = url.searchParams.get("avatarId") || "avatar1";
    
    if (!username) {
      // Redirect back to login if no username
      return new Response("", {
        status: 303,
        headers: { Location: "/student" },
      });
    }
    
    // In a real app, we would fetch the student's assignments and progress from the database
    // For this demo, we'll update our mock data based on the evaluatedAssignmentsStore
    
    // Create a copy of the base assignments
    const assignments = [...baseMockAssignments];
    
    // Update assignments based on evaluatedAssignmentsStore
    for (const [key, evaluatedAssignment] of evaluatedAssignmentsStore.entries()) {
      // Check if this assignment belongs to this user
      if (key.startsWith(`${username}_`)) {
        const assignmentId = evaluatedAssignment.id;
        
        // Find the assignment in our list
        const index = assignments.findIndex(a => a.id === assignmentId);
        
        if (index !== -1) {
          // Update the assignment with the evaluated data
          assignments[index] = {
            ...assignments[index],
            status: evaluatedAssignment.status,
            score: evaluatedAssignment.score,
          };
          
          // Check if we need to create an adaptive assignment
          if (evaluatedAssignment.score < 80 && !assignments.some(a => a.isAdaptive && a.parentAssignmentId === assignmentId)) {
            // Create a new adaptive assignment
            const adaptiveAssignment = {
              id: `adaptive-${assignmentId}`,
              title: `Adaptive: ${evaluatedAssignment.title}`,
              type: evaluatedAssignment.type || AssignmentType.QUIZ,
              status: StudentAssignmentStatus.ASSIGNED,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              isAdaptive: true,
              parentAssignmentId: assignmentId,
              description: `Adaptive follow-up for ${evaluatedAssignment.title}`,
              difficultyLevel: DifficultyLevel.MEDIUM,
              originalAssignmentId: assignmentId,
              weakAreas: evaluatedAssignment.weakAreas || []
            };
            
            // Add to our assignments list
            assignments.push(adaptiveAssignment);
            
            // Store in our adaptive assignments store
            adaptiveAssignmentsStore.set(`${username}_${adaptiveAssignment.id}`, {
              ...adaptiveAssignment,
              questions: generateAdaptiveQuestions(evaluatedAssignment),
            });
          }
        }
      }
    }
    
    // Calculate updated progress
    const calculateProgress = (
      assignments: typeof baseMockAssignments,
      username: string
    ): { 
      completedCount: number; 
      totalCount: number; 
      percentage: number; 
      averageScore: number 
    } => {
      let completedCount = 0;
      let totalScore = 0;
      
      // Count completed assignments and calculate average score
      for (const [key, assignment] of evaluatedAssignmentsStore.entries()) {
        const [storedUsername] = key.split('_');
        
        if (storedUsername === username && 
            assignment.status === StudentAssignmentStatus.GRADED) {
          completedCount++;
          totalScore += assignment.score || 0; // Use 0 as fallback if score is undefined
        }
      }
      
      const totalCount = assignments.length;
      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      const averageScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;
      
      return { completedCount, totalCount, percentage, averageScore };
    };

    const progressData = calculateProgress(assignments, username);
    
    // Generate weak areas based on completed assignments
    const weakAreas = generateWeakAreas(username);
    
    // Updated progress
    const progress = {
      averageScore: progressData.averageScore,
      completedAssignments: progressData.completedCount,
      totalAssignments: progressData.totalCount,
      weakAreas,
    };
    
    return ctx.render({
      username,
      avatarId,
      assignments,
      progress,
    });
  },
};

// Helper function to generate adaptive questions based on the original assignment
function generateAdaptiveQuestions(evaluatedAssignment: EvaluatedAssignment): Array<{
  id: string;
  prompt: string;
  type: QuestionType;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}> {
  // In a real app, this would generate questions focusing on the areas
  // where the student struggled in the original assignment
  
  // For this demo, we'll just return a modified version of the original questions
  return evaluatedAssignment.questions.map((q) => {
    // If the question was answered incorrectly, include it in the adaptive assignment
    if (!q.isCorrect) {
      return {
        id: q.id,
        prompt: `Review: ${q.prompt}`, // Mark as a review question
        type: QuestionType.MULTIPLE_CHOICE, // Default to multiple choice
        options: [
          {
            id: "correct",
            text: q.correctAnswer,
            isCorrect: true
          },
          {
            id: "incorrect",
            text: q.studentAnswer,
            isCorrect: false
          },
          {
            id: "distractor1",
            text: "Distractor option 1",
            isCorrect: false
          },
          {
            id: "distractor2",
            text: "Distractor option 2",
            isCorrect: false
          }
        ]
      };
    } else {
      // For correctly answered questions, create a more challenging variant
      return {
        id: q.id,
        prompt: `Advanced: ${q.prompt}`,
        type: QuestionType.SHORT_ANSWER,
        options: undefined
      };
    }
  });
}

// Helper function to generate weak areas based on completed assignments
function generateWeakAreas(username: string): Array<{ tag: string; count: number }> {
  // In a real app, this would analyze the student's performance across all assignments
  
  // For this demo, we'll extract weak areas from the evaluatedAssignmentsStore
  const weakAreasMap = new Map<string, number>();
  
  for (const [key, evaluatedAssignment] of evaluatedAssignmentsStore.entries()) {
    // Check if this assignment belongs to this user
    if (key.startsWith(`${username}_`)) {
      // Extract weak areas if they exist
      if (evaluatedAssignment.weakAreas) {
        evaluatedAssignment.weakAreas.forEach((area: string) => {
          const count = weakAreasMap.get(area) || 0;
          weakAreasMap.set(area, count + 1);
        });
      }
    }
  }
  
  // Convert to array format
  return Array.from(weakAreasMap.entries()).map(([tag, count]) => ({ tag, count }));
}

export default function StudentDashboard({ data }: PageProps<StudentDashboardData>) {
  const { username, avatarId, assignments, progress } = data;
  
  // Get avatar image URL
  const avatarSrc = `/avatars/${avatarId}.png`;
  
  // Group assignments by status
  const assignedAssignments = assignments.filter(a => a.status === StudentAssignmentStatus.ASSIGNED);
  const inProgressAssignments = assignments.filter(a => a.status === StudentAssignmentStatus.IN_PROGRESS);
  const completedAssignments = assignments.filter(a => 
    a.status === StudentAssignmentStatus.GRADED || a.status === StudentAssignmentStatus.SUBMITTED
  );
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Get status badge color
  const getStatusColor = (status: StudentAssignmentStatus) => {
    switch (status) {
      case StudentAssignmentStatus.ASSIGNED:
        return "bg-blue-100 text-blue-800";
      case StudentAssignmentStatus.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800";
      case StudentAssignmentStatus.SUBMITTED:
        return "bg-purple-100 text-purple-800";
      case StudentAssignmentStatus.GRADED:
        return "bg-green-100 text-green-800";
      case StudentAssignmentStatus.REASSIGNED:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get assignment type badge
  const getTypeColor = (type: AssignmentType) => {
    switch (type) {
      case AssignmentType.HOMEWORK:
        return "bg-indigo-100 text-indigo-800";
      case AssignmentType.QUIZ:
        return "bg-pink-100 text-pink-800";
      case AssignmentType.TEST:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div>
      <Head>
        <title>Student Dashboard</title>
      </Head>
      
      <div class="mb-8 flex items-center justify-between">
        <div class="flex items-center">
          <div class="bg-gray-100 rounded-full w-16 h-16 overflow-hidden flex items-center justify-center mr-4">
            <AvatarImage src={avatarSrc} username={username} />
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Welcome, {username}!</h1>
            <p class="text-gray-600">Here's your learning dashboard</p>
          </div>
        </div>
        
        <div class="text-right">
          <div class="text-3xl font-bold text-blue-700">{progress.averageScore}%</div>
          <div class="text-sm text-gray-600">Average Score</div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progress summary */}
        <div class="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Your Progress</h2>
          
          <div class="mb-4">
            <div class="flex justify-between mb-1">
              <span class="text-sm font-medium text-gray-700">
                Completed: {progress.completedAssignments} of {progress.totalAssignments}
              </span>
              <span class="text-sm font-medium text-gray-700">
                {Math.round((progress.completedAssignments / progress.totalAssignments) * 100)}%
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                class="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(progress.completedAssignments / progress.totalAssignments) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <h3 class="font-medium text-gray-700 mb-2">Areas to Focus On:</h3>
          <div class="flex flex-wrap gap-2">
            {progress.weakAreas.map(area => (
              <span 
                key={area.tag} 
                class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
              >
                {area.tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* Quick actions */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div class="space-y-3">
            <a 
              href={`/student/assignments?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}`}
              class="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
            >
              View All Assignments
            </a>
            {assignedAssignments.length > 0 && (
              <a 
                href={`/student/assignment/${assignedAssignments[0].id}?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}`}
                class="block w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded text-center transition-colors"
              >
                Start Next Assignment
              </a>
            )}
            {completedAssignments.length > 0 && (
              <a 
                href={`/student/assignment/${completedAssignments[0].id}/results?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}`}
                class="block w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded text-center transition-colors"
              >
                Review Last Results
              </a>
            )}
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned assignments */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Assigned</h2>
          
          {assignedAssignments.length > 0 ? (
            <div class="space-y-4">
              {assignedAssignments.map(assignment => (
                <a 
                  key={assignment.id}
                  href={`/student/assignment/${assignment.id}?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}`}
                  class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <h3 class="font-medium text-gray-800">
                        {assignment.title}
                        {assignment.isAdaptive && (
                          <span class="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                            Adaptive
                          </span>
                        )}
                      </h3>
                      <p class="text-sm text-gray-600">Due: {formatDate(assignment.dueDate)}</p>
                    </div>
                    <div class="flex space-x-2">
                      <span class={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(assignment.type)}`}>
                        {assignment.type}
                      </span>
                      <span class={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div class="text-center py-8 text-gray-500">
              <p>No assigned assignments</p>
            </div>
          )}
        </div>
        
        {/* In progress and completed assignments */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">In Progress & Completed</h2>
          
          {inProgressAssignments.length > 0 || completedAssignments.length > 0 ? (
            <div class="space-y-4">
              {inProgressAssignments.map(assignment => (
                <a 
                  key={assignment.id}
                  href={`/student/assignment/${assignment.id}?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}`}
                  class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <h3 class="font-medium text-gray-800">
                        {assignment.title}
                        {assignment.isAdaptive && (
                          <span class="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                            Adaptive
                          </span>
                        )}
                      </h3>
                      <p class="text-sm text-gray-600">Due: {formatDate(assignment.dueDate)}</p>
                    </div>
                    <div class="flex space-x-2">
                      <span class={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(assignment.type)}`}>
                        {assignment.type}
                      </span>
                      <span class={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
              
              {completedAssignments.map(assignment => (
                <a 
                  key={assignment.id}
                  href={`/student/assignment/${assignment.id}/results?username=${encodeURIComponent(username)}&avatarId=${encodeURIComponent(avatarId)}`}
                  class="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <h3 class="text-lg font-medium text-gray-800 mb-1">
                        {assignment.title}
                        {assignment.isAdaptive && (
                          <span class="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                            Adaptive
                          </span>
                        )}
                      </h3>
                      <div class="flex items-center text-sm">
                        <span class="text-gray-600 mr-2">Score:</span>
                        <span class={`font-medium ${(assignment.score ?? 0) >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {assignment.score ?? 0}%
                        </span>
                      </div>
                    </div>
                    <div class="flex space-x-2">
                      <span class={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(assignment.type)}`}>
                        {assignment.type}
                      </span>
                      <span class={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div class="text-center py-8 text-gray-500">
              <p>No in-progress or completed assignments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
