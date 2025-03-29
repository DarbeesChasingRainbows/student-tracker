import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { Student } from "../../../domain/models/Student.ts";
import { studentRepository } from "../../../infrastructure/repositories/index.ts";

interface StudentsPageData {
  students: Student[];
  success?: string;
  filters: {
    grade?: string;
    searchTerm?: string;
  };
}

export const handler: Handlers<StudentsPageData> = {
  async GET(req, ctx) {
    // Check for success message in URL
    const url = new URL(req.url);
    const success = url.searchParams.get("success") || undefined;
    
    // Extract filter parameters
    const grade = url.searchParams.get("grade") || undefined;
    const searchTerm = url.searchParams.get("searchTerm") || undefined;
    
    // Get all students from repository
    const students = await studentRepository.findAll();
    
    // Apply filters
    let filteredStudents = [...students];
    
    if (grade) {
      filteredStudents = filteredStudents.filter(student => student.grade === grade);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredStudents = filteredStudents.filter(student => 
        student.firstName.toLowerCase().includes(term) || 
        student.lastName.toLowerCase().includes(term) ||
        student.email?.toLowerCase().includes(term) || false
      );
    }
    
    return ctx.render({
      students: filteredStudents,
      success,
      filters: {
        grade,
        searchTerm,
      },
    });
  },
};

export default function StudentsPage({ data }: PageProps<StudentsPageData>) {
  const { students, success, filters } = data;
  
  return (
    <div class="max-w-6xl mx-auto p-4">
      <Head>
        <title>Manage Students</title>
      </Head>
      
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Students</h1>
          <p class="text-gray-600">Manage your student records</p>
        </div>
        
        <a
          href="/admin/students/new"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Student
        </a>
      </div>
      
      {success === "created" && (
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span class="block sm:inline">Student created successfully!</span>
          <a
            href="/admin/students"
            class="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>
      )}
      
      {/* Filters */}
      <div class="bg-white rounded-lg shadow-md p-4 mb-6">
        <form method="GET" class="flex flex-wrap gap-4">
          {/* Grade Filter */}
          <div class="w-full md:w-48">
            <label for="grade" class="block text-sm font-medium text-gray-700 mb-1">
              Grade
            </label>
            <select
              id="grade"
              name="grade"
              value={filters.grade}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              <option value="Pre-Kindergarten">Pre-Kindergarten</option>
              <option value="Kindergarten">Kindergarten</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="3rd">3rd</option>
              <option value="4th">4th</option>
              <option value="5th">5th</option>
              <option value="6th">6th</option>
              <option value="7th">7th</option>
              <option value="8th">8th</option>
              <option value="9th">9th</option>
              <option value="10th">10th</option>
              <option value="11th">11th</option>
              <option value="12th">12th</option>
            </select>
          </div>
          
          {/* Search */}
          <div class="w-full md:flex-1">
            <label for="searchTerm" class="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="searchTerm"
              name="searchTerm"
              value={filters.searchTerm}
              placeholder="Search by name or email..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter Button */}
          <div class="w-full md:w-auto self-end">
            <button type="submit" class="w-full md:w-auto px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors">
              Apply Filters
            </button>
          </div>
        </form>
      </div>
      
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        {students.length === 0 ? (
          <div class="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h2 class="mt-2 text-xl font-semibold text-gray-800">No students yet</h2>
            <p class="mt-1 text-gray-600">Get started by adding your first student</p>
            <a
              href="/admin/students/new"
              class="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Add Student
            </a>
          </div>
        ) : (
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guardian
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                        <span class="text-gray-500 font-medium">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div class="text-sm text-gray-500">
                          @{student.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {student.grade}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.email || "—"}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.guardianName || "—"}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/admin/students/${student.id}/history`} class="text-blue-600 hover:text-blue-900 mr-3">
                      History
                    </a>
                    <a href={`/admin/students/${student.id}`} class="text-blue-600 hover:text-blue-900 mr-3">
                      View
                    </a>
                    <a href={`/admin/students/${student.id}/edit`} class="text-indigo-600 hover:text-indigo-900 mr-3">
                      Edit
                    </a>
                    <a href={`/admin/students/${student.id}/delete`} class="text-red-600 hover:text-red-900">
                      Delete
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
