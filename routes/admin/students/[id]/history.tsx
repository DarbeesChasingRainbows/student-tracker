import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Student } from "../../../../domain/models/Student.ts";
import { StudentAssignment, StudentAssignmentStatus } from "../../../../domain/models/StudentAssignment.ts";
import { getRepositories } from "../../../../infrastructure/repositories/index.ts";

interface StudentHistoryData {
  student: Student;
  assignments: Array<StudentAssignment & { 
    title: string; 
    type: string;
    dueDate?: Date;
    completedAt?: Date | null;
  }>;
  performance: Array<{
    subject: string;
    averageScore: number;
    assignmentsCompleted: number;
  }>;
  statistics: {
    totalAssignments: number;
    completedAssignments: number;
    averageScore: number;
  };
}

export const handler: Handlers<StudentHistoryData> = {
  async GET(_req, ctx) {
    const { id } = ctx.params;
    
    try {
      const { 
        studentRepository, 
        studentAssignmentRepository,
        assignmentRepository
      } = getRepositories();
      
      // Get student data from database
      const student = await studentRepository.findById(id);
      
      if (!student) {
        // Student not found, redirect to students list
        return new Response("", {
          status: 303,
          headers: { Location: "/admin/students" },
        });
      }
      
      // Get student assignments
      const studentAssignments = await studentAssignmentRepository.findByStudentId(id);
      
      // Get assignment details for each student assignment
      const assignmentsWithDetails = await Promise.all(
        studentAssignments.map(async (sa) => {
          const assignment = await assignmentRepository.findById(sa.assignmentId);
          return {
            ...sa,
            title: assignment?.title || "Unknown Assignment",
            type: assignment?.type || "Unknown Type",
          };
        })
      );
      
      // Calculate statistics
      const totalAssignments = assignmentsWithDetails.length;
      const completedAssignments = assignmentsWithDetails.filter(a => a.status === StudentAssignmentStatus.COMPLETED).length;
      const averageScore = assignmentsWithDetails
        .filter(a => a.score !== null)
        .reduce((sum, a) => sum + (a.score || 0), 0) / 
        assignmentsWithDetails.filter(a => a.score !== null).length || 0;
      
      // Group assignments by type (since subject is not available in the model)
      const performance = assignmentsWithDetails.reduce((acc, assignment) => {
        const type = assignment.type;
        const existing = acc.find(p => p.subject === type) || {
          subject: type,
          averageScore: 0,
          assignmentsCompleted: 0
        };
        
        const completed = assignment.status === StudentAssignmentStatus.COMPLETED;
        if (completed) {
          existing.assignmentsCompleted++;
          existing.averageScore = (existing.averageScore + (assignment.score || 0)) / 2;
        }
        
        if (!acc.find(p => p.subject === type)) {
          acc.push(existing);
        }
        return acc;
      }, [] as Array<{
        subject: string;
        averageScore: number;
        assignmentsCompleted: number;
      }>);
      
      return ctx.render({
        student,
        assignments: assignmentsWithDetails,
        performance,
        statistics: {
          totalAssignments,
          completedAssignments,
          averageScore: Math.round(averageScore * 100) / 100,
        }
      });
    } catch (error) {
      console.error("Error fetching student history:", error);
      throw error;
    }
  },
};

export default function StudentHistory({ data }: PageProps<StudentHistoryData>) {
  const { student, assignments, performance, statistics } = data;
  
  // Format date for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };
  
  // Format score for display
  const formatScore = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "Not graded";
    return `${score}%`;
  };

  return (
    <div class="max-w-6xl mx-auto p-4">
      <Head>
        <title>Student History: {student.name}</title>
      </Head>
      
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">{student.name}'s History</h1>
          <p class="text-gray-600">Grade: {student.grade}</p>
        </div>
        
        <div class="flex space-x-2">
          <a
            href="/admin/students"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back to Students
          </a>
          <a
            href={`/admin/students/${student.id}`}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            View Details
          </a>
        </div>
      </div>

      {/* Statistics Card */}
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Statistics</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <h3 class="text-2xl font-bold text-blue-600">{statistics.totalAssignments}</h3>
            <p class="text-gray-600">Total Assignments</p>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <h3 class="text-2xl font-bold text-green-600">{statistics.completedAssignments}</h3>
            <p class="text-gray-600">Completed</p>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <h3 class="text-2xl font-bold text-purple-600">{statistics.averageScore}%</h3>
            <p class="text-gray-600">Average Score</p>
          </div>
        </div>
      </div>

      {/* Performance by Type */}
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Performance by Type</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performance.map((perf, index) => (
            <div key={index} class="p-4 bg-gray-50 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-800">{perf.subject}</h3>
              <p class="text-gray-600">Average Score: {perf.averageScore}%</p>
              <p class="text-gray-600">Assignments Completed: {perf.assignmentsCompleted}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assignment History */}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Assignment History</h2>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignment
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <tr key={assignment.id} class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{assignment.title}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {assignment.type}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    assignment.status === StudentAssignmentStatus.COMPLETED 
                      ? "bg-green-100 text-green-800" 
                      : assignment.status === StudentAssignmentStatus.IN_PROGRESS 
                      ? "bg-yellow-100 text-yellow-800" 
                      : assignment.status === StudentAssignmentStatus.OVERDUE 
                      ? "bg-red-100 text-red-800" 
                      : "bg-gray-100 text-gray-800"}`}>
                    {assignment.status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    assignment.score !== null && assignment.score !== undefined 
                      ? assignment.score >= 90 ? "bg-green-100 text-green-800" :
                        assignment.score >= 70 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"}`}>
                    {formatScore(assignment.score)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {formatDate(assignment.dueDate)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {formatDate(assignment.completedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
