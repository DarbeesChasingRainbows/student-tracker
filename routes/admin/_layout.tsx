import { PageProps } from "$fresh/server.ts";
import { Head as _Head } from "$fresh/runtime.ts";

export default function AdminLayout({ Component, url }: PageProps) {
  // Determine which nav item is active based on the current URL
  const currentPath = url.pathname;
  const isActive = (path: string) => {
    return currentPath.startsWith(path) ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100";
  };

  return (
    <div class="flex min-h-screen">
      {/* Sidebar Navigation */}
      <div class="w-64 bg-white border-r border-gray-200 shadow-sm">
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-xl font-bold text-purple-700">Admin Portal</h2>
        </div>
        <nav class="p-4">
          <ul class="space-y-2">
            <li>
              <a 
                href="/admin/dashboard" 
                class={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/dashboard')}`}
              >
                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </a>
            </li>
            <li>
              <a 
                href="/admin/assignments/new" 
                class={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/assignments/new')}`}
              >
                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                New Assignment
              </a>
            </li>
            <li>
              <a 
                href="/admin/questions" 
                class={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/questions')}`}
              >
                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Question Bank
              </a>
            </li>
            <li>
              <a 
                href="/admin/students" 
                class={`flex items-center px-4 py-2 rounded-md ${isActive('/admin/students')}`}
              >
                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Students
              </a>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <div class="flex-1 overflow-auto">
        <Component />
      </div>
    </div>
  );
}
