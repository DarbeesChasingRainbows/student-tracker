import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { StudentAssignmentStatus } from "../../../domain/models/StudentAssignment.ts";
import { AssignmentType } from "../../../domain/models/Assignment.ts";

// Mock data for student assignments (in a real app, this would come from the database)
const mockAssignments = [
  {
    id: "1",
    title: "Math Fundamentals Quiz",
    type: AssignmentType.QUIZ,
    status: StudentAssignmentStatus.ASSIGNED,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "Science Homework - Chapter 3",
    type: AssignmentType.HOMEWORK,
    status: StudentAssignmentStatus.GRADED,
    score: 85,
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "English Literature Test",
    type: AssignmentType.TEST,
    status: StudentAssignmentStatus.IN_PROGRESS,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    title: "Adaptive: Math Fundamentals",
    type: AssignmentType.QUIZ,
    status: StudentAssignmentStatus.ASSIGNED,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isAdaptive: true,
  },
  {
    id: "5",
    title: "History Project",
    type: AssignmentType.HOMEWORK,
    status: StudentAssignmentStatus.ASSIGNED,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "6",
    title: "Geography Quiz",
    type: AssignmentType.QUIZ,
    status: StudentAssignmentStatus.GRADED,
    score: 92,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

interface AssignmentsPageData {
  username: string;
  avatarId: string;
  assignments: typeof mockAssignments;
}

export const handler: Handlers<AssignmentsPageData> = {
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
    
    // In a real app, we would fetch the student's assignments from the database
    return ctx.render({
      username,
      avatarId,
      assignments: mockAssignments,
    });
  },
};

export default function AssignmentsPage({ data }: PageProps<AssignmentsPageData>) {
  const { username, assignments } = data;
  
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
        <title>Your Assignments</title>
      </Head>
      
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-gray-800">Your Assignments</h1>
          <a 
            href="/student/dashboard?username=${encodeURIComponent(username)}"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        {assignments.length === 0 ? (
          <p class="text-gray-600">You don't have any assignments yet.</p>
        ) : (
          <div class="space-y-8">
            {/* Assigned assignments */}
            {assignedAssignments.length > 0 && (
              <div>
                <h3 class="text-xl font-medium text-gray-800 mb-4">Assigned</h3>
                <div class="space-y-4">
                  {assignedAssignments.map(assignment => (
                    <div key={assignment.id} class="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div class="flex items-center justify-between">
                        <div>
                          <div class="flex items-center">
                            <h4 class="font-medium text-gray-800">
                              {assignment.title}
                              {assignment.isAdaptive && (
                                <span class="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                  Adaptive
                                </span>
                              )}
                            </h4>
                          </div>
                          <div class="mt-1 flex items-center space-x-2">
                            <span class={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(assignment.type)}`}>
                              {assignment.type}
                            </span>
                            <span class={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                              {assignment.status}
                            </span>
                            <span class="text-xs text-gray-500">
                              Due: {formatDate(assignment.dueDate)}
                            </span>
                          </div>
                        </div>
                        <a 
                          href={`/student/assignment/${assignment.id}?username=${encodeURIComponent(username)}`}
                          class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Start
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* In progress assignments */}
            {inProgressAssignments.length > 0 && (
              <div>
                <h3 class="text-xl font-medium text-gray-800 mb-4">In Progress</h3>
                <div class="space-y-4">
                  {inProgressAssignments.map(assignment => (
                    <div key={assignment.id} class="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div class="flex items-center justify-between">
                        <div>
                          <h4 class="font-medium text-gray-800">{assignment.title}</h4>
                          <div class="mt-1 flex items-center space-x-2">
                            <span class={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(assignment.type)}`}>
                              {assignment.type}
                            </span>
                            <span class={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                              {assignment.status}
                            </span>
                            <span class="text-xs text-gray-500">
                              Due: {formatDate(assignment.dueDate)}
                            </span>
                          </div>
                        </div>
                        <a 
                          href={`/student/assignment/${assignment.id}?username=${encodeURIComponent(username)}`}
                          class="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Continue
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Completed assignments */}
            {completedAssignments.length > 0 && (
              <div>
                <h3 class="text-xl font-medium text-gray-800 mb-4">Completed</h3>
                <div class="space-y-4">
                  {completedAssignments.map(assignment => (
                    <div key={assignment.id} class="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div class="flex items-center justify-between">
                        <div>
                          <h4 class="font-medium text-gray-800">{assignment.title}</h4>
                          <div class="mt-1 flex items-center space-x-2">
                            <span class={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(assignment.type)}`}>
                              {assignment.type}
                            </span>
                            <span class={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                              {assignment.status}
                            </span>
                            {assignment.score !== undefined && (
                              <span class="text-xs font-medium text-gray-700">
                                Score: {assignment.score}%
                              </span>
                            )}
                          </div>
                        </div>
                        <a 
                          href={`/student/assignment/${assignment.id}?username=${encodeURIComponent(username)}`}
                          class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Review
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
