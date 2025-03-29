import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { AssignmentType } from "../../../domain/models/Assignment.ts";

// Mock data for student progress
const mockProgressData = {
  overallScore: 82,
  recentScores: [85, 72, 90, 78, 82, 88],
  completedAssignments: 12,
  totalAssignments: 18,
  assignmentsByType: [
    { type: AssignmentType.QUIZ, completed: 5, total: 8, averageScore: 84 },
    { type: AssignmentType.HOMEWORK, completed: 4, total: 6, averageScore: 79 },
    { type: AssignmentType.TEST, completed: 3, total: 4, averageScore: 85 },
  ],
  subjectPerformance: [
    { subject: "Math", averageScore: 88, assignments: 4 },
    { subject: "Science", averageScore: 76, assignments: 3 },
    { subject: "English", averageScore: 85, assignments: 3 },
    { subject: "History", averageScore: 79, assignments: 2 },
  ],
  weakAreas: [
    { tag: "algebra", count: 5, averageScore: 68 },
    { tag: "grammar", count: 3, averageScore: 72 },
    { tag: "cells", count: 2, averageScore: 75 },
  ],
  strongAreas: [
    { tag: "geometry", count: 3, averageScore: 92 },
    { tag: "vocabulary", count: 4, averageScore: 90 },
    { tag: "planets", count: 2, averageScore: 95 },
  ],
  recentActivity: [
    { 
      id: "act1",
      type: "completed",
      title: "Science Quiz - Chapter 4",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      score: 85,
    },
    { 
      id: "act2",
      type: "started",
      title: "Math Homework - Algebra",
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    { 
      id: "act3",
      type: "completed",
      title: "English Test - Literature",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      score: 78,
    },
  ],
};

interface ProgressData {
  username: string;
  avatarId: string;
  progress: typeof mockProgressData;
}

export const handler: Handlers<ProgressData> = {
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
    
    // In a real app, we would fetch the student's progress data from the database
    return ctx.render({
      username,
      avatarId,
      progress: mockProgressData,
    });
  },
};

export default function ProgressPage({ data }: PageProps<ProgressData>) {
  const { username, progress } = data;
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <div>
      <Head>
        <title>Your Progress</title>
      </Head>
      
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Your Progress</h1>
            <p class="text-gray-600">
              Track your learning journey and see where you can improve
            </p>
          </div>
          <a 
            href={`/student/dashboard?username=${encodeURIComponent(username)}`}
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall progress card */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Overall Progress</h2>
          <div class="flex flex-col items-center">
            <div class="relative w-32 h-32 mb-4">
              <svg class="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  stroke-width="3"
                  stroke-dasharray="100, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3B82F6"
                  stroke-width="3"
                  stroke-dasharray={`${progress.overallScore}, 100`}
                />
                <text x="18" y="20.5" font-size="10" text-anchor="middle" fill="#1F2937">
                  {progress.overallScore}%
                </text>
              </svg>
            </div>
            <div class="text-center">
              <p class="text-gray-600">
                {progress.completedAssignments} of {progress.totalAssignments} assignments completed
              </p>
              <p class="text-sm text-gray-500 mt-1">
                {Math.round((progress.completedAssignments / progress.totalAssignments) * 100)}% completion rate
              </p>
            </div>
          </div>
        </div>
        
        {/* Recent scores */}
        <div class="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Recent Scores</h2>
          <div class="h-40 flex items-end justify-between">
            {progress.recentScores.map((score, index) => (
              <div key={index} class="flex flex-col items-center">
                <div class="text-xs text-gray-600 mb-1">{score}%</div>
                <div 
                  class="w-8 bg-blue-500 rounded-t"
                  style={{ height: `${(score / 100) * 120}px` }}
                ></div>
                <div class="text-xs text-gray-600 mt-1">#{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Assignment types */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Assignment Types</h2>
          <div class="space-y-4">
            {progress.assignmentsByType.map(item => (
              <div key={item.type}>
                <div class="flex justify-between mb-1">
                  <span class="text-sm font-medium text-gray-700">
                    {item.type} ({item.completed}/{item.total})
                  </span>
                  <span class="text-sm font-medium text-gray-700">
                    {item.averageScore}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    class={`h-2.5 rounded-full ${
                      item.type === AssignmentType.QUIZ
                        ? "bg-pink-500"
                        : item.type === AssignmentType.HOMEWORK
                          ? "bg-indigo-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${(item.completed / item.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Subject performance */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Subject Performance</h2>
          <div class="space-y-4">
            {progress.subjectPerformance.map(subject => (
              <div key={subject.subject}>
                <div class="flex justify-between mb-1">
                  <span class="text-sm font-medium text-gray-700">
                    {subject.subject} ({subject.assignments} assignments)
                  </span>
                  <span class="text-sm font-medium text-gray-700">
                    {subject.averageScore}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    class="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${subject.averageScore}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Areas to improve */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Areas to Improve</h2>
          {progress.weakAreas.length === 0 ? (
            <p class="text-gray-600">No weak areas identified yet.</p>
          ) : (
            <div class="space-y-4">
              {progress.weakAreas.map(area => (
                <div key={area.tag}>
                  <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">
                      {area.tag} ({area.count} questions)
                    </span>
                    <span class="text-sm font-medium text-gray-700">
                      {area.averageScore}%
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      class="bg-red-500 h-2.5 rounded-full" 
                      style={{ width: `${area.averageScore}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div class="mt-4">
            <a 
              href={`/student/practice?username=${encodeURIComponent(username)}`}
              class="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center transition-colors"
            >
              Practice Weak Areas
            </a>
          </div>
        </div>
        
        {/* Strong areas */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Strong Areas</h2>
          {progress.strongAreas.length === 0 ? (
            <p class="text-gray-600">No strong areas identified yet.</p>
          ) : (
            <div class="space-y-4">
              {progress.strongAreas.map(area => (
                <div key={area.tag}>
                  <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">
                      {area.tag} ({area.count} questions)
                    </span>
                    <span class="text-sm font-medium text-gray-700">
                      {area.averageScore}%
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      class="bg-green-500 h-2.5 rounded-full" 
                      style={{ width: `${area.averageScore}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Recent activity */}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        {progress.recentActivity.length === 0 ? (
          <p class="text-gray-600">No recent activity.</p>
        ) : (
          <div class="space-y-4">
            {progress.recentActivity.map(activity => (
              <div key={activity.id} class="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 class="font-medium text-gray-800">{activity.title}</h3>
                  <div class="flex items-center mt-1">
                    <span class={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      activity.type === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {activity.type === "completed" ? "Completed" : "Started"}
                    </span>
                    <span class="text-xs text-gray-500 ml-2">
                      {formatDate(activity.date)}
                    </span>
                    {activity.score !== undefined && (
                      <span class="text-xs font-medium text-gray-700 ml-2">
                        Score: {activity.score}%
                      </span>
                    )}
                  </div>
                </div>
                <a 
                  href={`/student/assignment/${activity.id}?username=${encodeURIComponent(username)}`}
                  class="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded transition-colors"
                >
                  {activity.type === "completed" ? "Review" : "Continue"}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
