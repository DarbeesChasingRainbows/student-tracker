import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { Student } from "../../../domain/models/Student.ts";
import { StudentAssignment, StudentAssignmentStatus } from "../../../domain/models/StudentAssignment.ts";
import { getRepositories } from "../../../infrastructure/repositories/index.ts";
import { CqrsService } from "../../../application/cqrs/CqrsService.ts";
import { GetStudentByIdQuery } from "../../../application/cqrs/students/queries/GetStudentByIdQuery.ts";

// Initialize CQRS
import { CqrsRegistry } from "../../../application/cqrs/CqrsRegistry.ts";
// Ensure CQRS handlers are registered
CqrsRegistry.initialize();

// Mock data for when database connection fails
const mockStudentData = {
  "1": {
    id: "1",
    firstName: "Alice",
    lastName: "Johnson",
    name: "Alice Johnson",
    username: "alice_j",
    email: "alice.johnson@example.com",
    grade: "10th",
    avatarId: "avatar1",
    guardianName: "Robert Johnson",
    guardianEmail: "robert.johnson@example.com",
    guardianPhone: "(555) 123-4567",
    notes: "Alice is a highly motivated student who excels in mathematics and science.",
    createdAt: new Date(2023, 8, 1),
    updatedAt: new Date(2023, 8, 1),
  },
  "2": {
    id: "2",
    firstName: "Bob",
    lastName: "Smith",
    name: "Bob Smith",
    username: "bob_s",
    email: "bob.smith@example.com",
    grade: "9th",
    avatarId: "avatar2",
    guardianName: "Mary Smith",
    guardianEmail: "mary.smith@example.com",
    guardianPhone: "(555) 234-5678",
    notes: "Bob needs additional support with reading comprehension.",
    createdAt: new Date(2023, 8, 5),
    updatedAt: new Date(2023, 8, 5),
  }
};

// Mock data for student assignments
const mockStudentAssignments = {
  "1": [
    {
      id: "a1",
      title: "Math Fundamentals Quiz",
      type: "QUIZ",
      assignmentId: "assignment1",
      studentId: "1",
      status: StudentAssignmentStatus.COMPLETED,
      score: 95,
      submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      attempts: 1,
      isAdaptive: false,
      feedback: "Excellent work! You have a strong grasp of the fundamentals.",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      id: "a2",
      title: "Science Homework - Chapter 3",
      type: "HOMEWORK",
      assignmentId: "assignment2",
      studentId: "1",
      status: StudentAssignmentStatus.COMPLETED,
      score: 88,
      submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      gradedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      attempts: 1,
      isAdaptive: false,
      feedback: "Good job understanding the concepts. Review section 3.4 for better clarity.",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      id: "a3",
      title: "English Literature Test",
      type: "TEST",
      assignmentId: "assignment3",
      studentId: "1",
      status: StudentAssignmentStatus.ASSIGNED,
      score: null,
      submittedAt: undefined,
      startedAt: undefined,
      gradedAt: undefined,
      attempts: 0,
      isAdaptive: false,
      feedback: undefined,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      completedAt: null,
    }
  ]
};

// Mock data for student performance by subject
const mockStudentPerformance = {
  "1": [
    { subject: "Mathematics", averageScore: 94, assignmentsCompleted: 5 },
    { subject: "Science", averageScore: 88, assignmentsCompleted: 4 },
    { subject: "English", averageScore: 92, assignmentsCompleted: 6 },
    { subject: "History", averageScore: 90, assignmentsCompleted: 3 },
    { subject: "Physics", averageScore: 85, assignmentsCompleted: 2 },
  ],
  "2": [
    { subject: "Mathematics", averageScore: 78, assignmentsCompleted: 4 },
    { subject: "Science", averageScore: 75, assignmentsCompleted: 3 },
    { subject: "English", averageScore: 80, assignmentsCompleted: 5 },
    { subject: "History", averageScore: 82, assignmentsCompleted: 4 },
    { subject: "Physics", averageScore: 70, assignmentsCompleted: 2 },
  ]
};

// Mock data for student statistics
const mockStudentStatistics = {
  "1": {
    totalAssignments: 24,
    completedAssignments: 20,
    averageScore: 92,
  },
  "2": {
    totalAssignments: 22,
    completedAssignments: 18,
    averageScore: 78,
  }
};

interface StudentDetailData {
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
  lastActive?: Date;
}

export const handler: Handlers<StudentDetailData> = {
  async GET(_req, ctx) {
    const { id } = ctx.params;
    
    try {
      // Using CQRS to get student data
      const student = await CqrsService.executeQuery(new GetStudentByIdQuery(id));
      
      if (!student) {
        // Student not found, redirect to students list
        return new Response("", {
          status: 303,
          headers: { Location: "/admin/students" },
        });
      }
      
      // Get repositories for other data that doesn't have CQRS yet
      const { 
        studentAssignmentRepository,
        assignmentRepository
      } = getRepositories();
      
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
      
      // Get student performance by subject
      // Note: These methods would need to be added to the repository interface
      // For now, we'll use mock data
      const performance = mockStudentPerformance[id as keyof typeof mockStudentPerformance] || [];
      
      // Get student statistics
      // Note: These methods would need to be added to the repository interface
      // For now, we'll use mock data
      const statistics = mockStudentStatistics[id as keyof typeof mockStudentStatistics] || {
        totalAssignments: 0,
        completedAssignments: 0,
        averageScore: 0,
      };
      
      // Calculate last active date based on most recent assignment submission
      let lastActive: Date | undefined = undefined;
      for (const assignment of studentAssignments) {
        if (assignment.submittedAt && (!lastActive || assignment.submittedAt > lastActive)) {
          lastActive = assignment.submittedAt;
        }
      }
      
      return ctx.render({
        student,
        assignments: assignmentsWithDetails,
        performance,
        statistics,
        lastActive,
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
      
      // Fallback to mock data if database connection fails
      const student = mockStudentData[id as keyof typeof mockStudentData];
      
      if (!student) {
        // Student not found, redirect to students list
        return new Response("", {
          status: 303,
          headers: { Location: "/admin/students" },
        });
      }
      
      const assignments = mockStudentAssignments[id as keyof typeof mockStudentAssignments] || [];
      const performance = mockStudentPerformance[id as keyof typeof mockStudentPerformance] || [];
      const statistics = mockStudentStatistics[id as keyof typeof mockStudentStatistics] || {
        totalAssignments: 0,
        completedAssignments: 0,
        averageScore: 0,
      };
      
      return ctx.render({
        student,
        assignments,
        performance,
        statistics,
      });
    }
  }
};

export default function StudentDetail({ data }: PageProps<StudentDetailData>) {
  const { student, assignments, performance, statistics, lastActive } = data;
  
  // Format date for display
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };
  
  // Calculate days until due date
  const getDaysUntilDue = (dueDate: Date | undefined) => {
    if (!dueDate) return "No due date";
    
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    return `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: StudentAssignmentStatus) => {
    switch (status) {
      case StudentAssignmentStatus.ASSIGNED:
        return "badge badge-primary";
      case StudentAssignmentStatus.IN_PROGRESS:
        return "badge badge-warning";
      case StudentAssignmentStatus.SUBMITTED:
        return "badge badge-info";
      case StudentAssignmentStatus.COMPLETED:
        return "badge badge-success";
      case StudentAssignmentStatus.GRADED:
        return "badge badge-accent";
      default:
        return "badge";
    }
  };
  
  // Get assignment type badge class
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "QUIZ":
        return "badge badge-info";
      case "TEST":
        return "badge badge-error";
      case "HOMEWORK":
        return "badge badge-warning";
      default:
        return "badge";
    }
  };
  
  return (
    <>
      <Head>
        <title>Student Details | Admin Dashboard</title>
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Student Details</h1>
          <div className="flex space-x-2">
            <a href="/admin/students" className="btn btn-outline">
              Back to Students
            </a>
            <a href={`/admin/students/${student.id}/edit`} className="btn btn-primary">
              Edit Student
            </a>
          </div>
        </div>
        
        {/* Student Profile Card */}
        <div className="bg-base-100 shadow-xl rounded-box p-6 mb-8">
          <div className="flex flex-col md:flex-row">
            <div className="avatar mb-4 md:mb-0 md:mr-6">
              <div className="w-24 h-24 rounded-full">
                <img src={`/avatars/${student.avatarId}.png`} alt={`${student.firstName}'s avatar`} />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{student.firstName} {student.lastName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p><span className="font-semibold">Username:</span> {student.username}</p>
                  <p><span className="font-semibold">Email:</span> {student.email || "Not provided"}</p>
                  <p><span className="font-semibold">Grade:</span> {student.grade}</p>
                  <p><span className="font-semibold">Last Active:</span> {lastActive ? formatDate(lastActive) : "Never"}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Guardian:</span> {student.guardianName || "Not provided"}</p>
                  <p><span className="font-semibold">Guardian Email:</span> {student.guardianEmail || "Not provided"}</p>
                  <p><span className="font-semibold">Guardian Phone:</span> {student.guardianPhone || "Not provided"}</p>
                </div>
              </div>
              {student.notes && (
                <div className="mt-4">
                  <h3 className="font-semibold">Notes:</h3>
                  <p className="mt-1">{student.notes}</p>
                </div>
              )}
            </div>
            <div className="stats shadow mt-4 md:mt-0">
              <div className="stat">
                <div className="stat-title">Assignments</div>
                <div className="stat-value">{statistics.completedAssignments}/{statistics.totalAssignments}</div>
                <div className="stat-desc">Completed</div>
              </div>
              <div className="stat">
                <div className="stat-title">Average Score</div>
                <div className="stat-value">{statistics.averageScore}%</div>
                <div className="stat-desc">Across all assignments</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance by Subject */}
        <div className="bg-base-100 shadow-xl rounded-box p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Performance by Subject</h2>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Average Score</th>
                  <th>Assignments Completed</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((subject, index) => (
                  <tr key={index}>
                    <td>{subject.subject}</td>
                    <td>{subject.averageScore}%</td>
                    <td>{subject.assignmentsCompleted}</td>
                    <td>
                      <progress 
                        className={`progress ${subject.averageScore >= 90 ? 'progress-success' : 
                          subject.averageScore >= 80 ? 'progress-info' : 
                          subject.averageScore >= 70 ? 'progress-warning' : 'progress-error'}`} 
                        value={subject.averageScore} 
                        max="100"
                      ></progress>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Assignments */}
        <div className="bg-base-100 shadow-xl rounded-box p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Assignments</h2>
            <a href={`/admin/students/${student.id}/assignments/new`} className="btn btn-sm btn-primary">
              Assign New
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Due Date</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">No assignments found</td>
                  </tr>
                ) : (
                  assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.title}</td>
                      <td>
                        <span className={getTypeBadgeClass(assignment.type)}>
                          {assignment.type}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(assignment.status)}>
                          {assignment.status}
                        </span>
                      </td>
                      <td>{assignment.score !== null ? `${assignment.score}%` : "Not graded"}</td>
                      <td>
                        <div>{formatDate(assignment.dueDate)}</div>
                        <div className="text-xs">
                          {assignment.dueDate && getDaysUntilDue(assignment.dueDate)}
                        </div>
                      </td>
                      <td>{formatDate(assignment.submittedAt)}</td>
                      <td>
                        <div className="flex space-x-2">
                          <a 
                            href={`/admin/students/${student.id}/assignments/${assignment.id}`} 
                            className="btn btn-xs btn-outline"
                          >
                            View
                          </a>
                          {assignment.status === StudentAssignmentStatus.SUBMITTED && (
                            <a 
                              href={`/admin/students/${student.id}/assignments/${assignment.id}/grade`} 
                              className="btn btn-xs btn-accent"
                            >
                              Grade
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
