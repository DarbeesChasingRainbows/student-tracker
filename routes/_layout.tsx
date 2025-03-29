import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";

export default function Layout({ Component }: PageProps) {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <div class="flex flex-col min-h-screen">
        <header class="bg-blue-600 text-white shadow-md">
          <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <a href="/" class="text-xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Student Tracker</span>
            </a>
            <nav>
              <ul class="flex space-x-6">
                <li><a href="/" class="hover:underline">Home</a></li>
                <li><a href="/admin" class="hover:underline">Admin Portal</a></li>
                <li><a href="/student" class="hover:underline">Student Portal</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main class="flex-grow container mx-auto px-4 py-8">
          <Component />
        </main>
        <footer class="bg-gray-800 text-white py-6">
          <div class="container mx-auto px-4">
            <p class="text-center">&copy; {new Date().getFullYear()} Student Tracker. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
