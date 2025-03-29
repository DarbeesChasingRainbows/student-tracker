import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <div class="max-w-4xl mx-auto">
      <Head>
        <title>Student Tracker - Home</title>
      </Head>
      
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-blue-700 mb-4">Student Tracker</h1>
        <p class="text-xl text-gray-600">
          A comprehensive platform for tracking student progress and adaptive learning
        </p>
      </div>
      
      <div class="grid md:grid-cols-2 gap-8 mb-12">
        <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">For Students</h2>
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Complete assignments, quizzes, and tests
            </li>
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Track your progress over time
            </li>
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Receive adaptive assignments to improve weak areas
            </li>
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Enjoy gamification elements for motivation
            </li>
          </ul>
          <div class="mt-6">
            <a href="/student" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
              Student Portal
            </a>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-500">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">For Administrators</h2>
          <ul class="space-y-3 text-gray-700">
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Create and manage assignments, quizzes, and tests
            </li>
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Track student performance and identify areas for improvement
            </li>
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Configure gamification settings and retake policies
            </li>
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Generate reports on student progress
            </li>
          </ul>
          <div class="mt-6">
            <a href="/admin" class="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors">
              Admin Portal
            </a>
          </div>
        </div>
      </div>
      
      <div class="bg-blue-50 rounded-lg p-8 border border-blue-100">
        <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Based on Learning Science</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-white p-5 rounded-lg shadow-sm">
            <h3 class="font-bold text-lg text-blue-700 mb-2">Spaced Repetition</h3>
            <p class="text-gray-600">Optimizes learning by focusing on concepts that need more practice, based on the principles from "Make It Stick".</p>
          </div>
          <div class="bg-white p-5 rounded-lg shadow-sm">
            <h3 class="font-bold text-lg text-blue-700 mb-2">Adaptive Learning</h3>
            <p class="text-gray-600">Automatically generates new assignments focusing on areas where students need improvement.</p>
          </div>
          <div class="bg-white p-5 rounded-lg shadow-sm">
            <h3 class="font-bold text-lg text-blue-700 mb-2">Gamification</h3>
            <p class="text-gray-600">Motivates students with achievement celebrations and visual feedback on progress.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
