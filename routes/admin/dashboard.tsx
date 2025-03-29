import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { AssignmentType } from "../../domain/models/Assignment.ts";
import { StudentAssignmentStatus } from "../../domain/models/StudentAssignment.ts";
import { RepositoryFactory } from "../../infrastructure/repositories/RepositoryFactory.ts";
import { Assignment } from "../../domain/models/Assignment.ts";
import { Student } from "../../domain/models/Student.ts";

interface AdminDashboardData {
  username: string;
  stats: {
    totalStudents: number;
    totalAssignments: number;
    averageScore: number;
    completionRate: number;
  };
  recentAssignments: Assignment[];
  students: Student[];
  adaptiveAssignmentCount: number;
}

export const handler: Handlers<AdminDashboardData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || "";
    
    if (!username) {
      // Redirect back to login if no username
      return new Response("", {
        status: 303,
        headers: { Location: "/admin" },
      });
    }

    // Get repositories
    const studentRepo = RepositoryFactory.createStudentRepository();
    const assignmentRepo = RepositoryFactory.createAssignmentRepository();
    const studentAssignmentRepo = RepositoryFactory.createStudentAssignmentRepository();

    // Fetch data from database
    const students = await studentRepo.findAll();
    const assignments = await assignmentRepo.findAll();
    const studentAssignments = await studentAssignmentRepo.findAll();

    // Calculate statistics
    const stats = {
      totalStudents: students.length,
      totalAssignments: assignments.length,
      averageScore: 0,
      completionRate: 0
    };

    // Calculate average score and completion rate
    let totalScoreSum = 0;
    let completedAssignments = 0;
    const totalPossibleAssignments = students.length * assignments.length;

    // Process student assignments
    const studentStats: Record<string, { completed: number; scoreSum: number }> = {};
    const assignmentStats: Record<string, { completed: number; scoreSum: number }> = {};

    for (const sa of studentAssignments) {
      if (sa.status === StudentAssignmentStatus.COMPLETED || sa.status === StudentAssignmentStatus.GRADED) {
        completedAssignments++;
        
        // Update student stats
        if (!studentStats[sa.studentId]) {
          studentStats[sa.studentId] = { completed: 0, scoreSum: 0 };
        }
        studentStats[sa.studentId].completed++;

        // Update assignment stats
        if (!assignmentStats[sa.assignmentId]) {
          assignmentStats[sa.assignmentId] = { completed: 0, scoreSum: 0 };
        }
        assignmentStats[sa.assignmentId].completed++;

        // Get score from student assignment
        const score = sa.score || 0;
        totalScoreSum += score;
        studentStats[sa.studentId].scoreSum += score;
        assignmentStats[sa.assignmentId].scoreSum += score;
      }
    }

    // Calculate averages
    if (completedAssignments > 0) {
      stats.averageScore = Math.round(totalScoreSum / completedAssignments);
      stats.completionRate = Math.round((completedAssignments / totalPossibleAssignments) * 100);
    }

    // Update student data with stats
    const studentsWithStats = students.map(student => ({
      ...student,
      assignmentsCompleted: studentStats[student.id]?.completed || 0,
      averageScore: studentStats[student.id]?.scoreSum && studentStats[student.id].completed
        ? Math.round(studentStats[student.id].scoreSum / studentStats[student.id].completed)
        : 0
    }));

    // Update assignment data with stats
    const assignmentsWithStats = assignments.map(assignment => ({
      ...assignment,
      completedCount: assignmentStats[assignment.id]?.completed || 0,
      assignedStudents: studentAssignments.filter(sa => sa.assignmentId === assignment.id).length,
      averageScore: assignmentStats[assignment.id]?.scoreSum && assignmentStats[assignment.id].completed
        ? Math.round(assignmentStats[assignment.id].scoreSum / assignmentStats[assignment.id].completed)
        : 0
    }));

    // Sort assignments by creation date (newest first)
    const recentAssignments = assignmentsWithStats.sort(
      (a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime()
    ).slice(0, 5); // Show top 5 recent assignments

    // Count adaptive assignments
    const adaptiveAssignmentCount = assignments.filter(
      a => a.settings?.adaptiveLearningEnabled === true
    ).length;

    return ctx.render({
      username,
      stats,
      recentAssignments,
      students: studentsWithStats,
      adaptiveAssignmentCount
    });
  },
};

export default function AdminDashboard({ data }: PageProps<AdminDashboardData>) {
  const { username, stats, recentAssignments, students, adaptiveAssignmentCount } = data;
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Format time ago for display
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
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
        <title>Admin Dashboard</title>
      </Head>
      
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p class="text-gray-600">Welcome back, {username}</p>
        </div>
        
        <div class="flex space-x-3">
          <a 
            href="/admin/assignments/new" 
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded transition-colors flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Assignment
          </a>
          <a 
            href="/admin/students/new" 
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Student
          </a>
        </div>
      </div>
      
      {/* Stats overview */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Students</p>
              <h3 class="text-3xl font-bold text-gray-800">{stats.totalStudents}</h3>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <svg class="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Assignments</p>
              <h3 class="text-3xl font-bold text-gray-800">{stats.totalAssignments}</h3>
            </div>
            <div class="p-3 bg-purple-100 rounded-full">
              <svg class="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-600">
            Including {adaptiveAssignmentCount} adaptive assignments
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Average Score</p>
              <h3 class="text-3xl font-bold text-gray-800">{stats.averageScore}%</h3>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Completion Rate</p>
              <h3 class="text-3xl font-bold text-gray-800">{stats.completionRate}%</h3>
            </div>
            <div class="p-3 bg-yellow-100 rounded-full">
              <svg class="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent assignments */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-800">Recent Assignments</h2>
            <a 
              href="/admin/assignments" 
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </a>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Score
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                {recentAssignments.map(assignment => (
                  <tr key={assignment.id} class="hover:bg-gray-50">
                    <td class="px-4 py-3 whitespace-nowrap">
                      <a 
                        href={`/admin/assignments/${assignment.id}`}
                        class="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {assignment.title}
                      </a>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span class={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(assignment.type)}`}>
                        {assignment.type}
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(assignment.createdAt)}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            class="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(assignment.completedCount / assignment.assignedStudents) * 100}%` }}
                          ></div>
                        </div>
                        <span class="text-xs text-gray-500">
                          {assignment.completedCount}/{assignment.assignedStudents}
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span class={`font-medium ${
                        assignment.averageScore >= 80 ? 'text-green-600' : 
                        assignment.averageScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {assignment.averageScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Student activity */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-800">Student Activity</h2>
            <a 
              href="/admin/students" 
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </a>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Score
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                {students.map(student => (
                  <tr key={student.id} class="hover:bg-gray-50">
                    <td class="px-4 py-3 whitespace-nowrap">
                      <a 
                        href={`/admin/students/${student.id}`}
                        class="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {student.name}
                      </a>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                      {student.assignmentsCompleted} assignments
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span class={`font-medium ${
                        student.averageScore >= 80 ? 'text-green-600' : 
                        student.averageScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {student.averageScore}%
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(student.lastActive)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Quick actions */}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="/admin/reports/performance" 
            class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <div class="p-3 bg-blue-100 rounded-full mr-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 class="font-medium text-gray-800">Performance Reports</h3>
              <p class="text-sm text-gray-600">View detailed student performance data</p>
            </div>
          </a>
          
          <a 
            href="/admin/assignments/bulk-create" 
            class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <div class="p-3 bg-purple-100 rounded-full mr-4">
              <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 class="font-medium text-gray-800">Bulk Create Assignments</h3>
              <p class="text-sm text-gray-600">Create multiple assignments at once</p>
            </div>
          </a>
          
          <a 
            href="/admin/settings" 
            class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <div class="p-3 bg-gray-100 rounded-full mr-4">
              <svg class="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-medium text-gray-800">System Settings</h3>
              <p class="text-sm text-gray-600">Configure system preferences</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
