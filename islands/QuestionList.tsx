import { useState } from "preact/hooks";
import { Question, QuestionType } from "../domain/models/Question.ts";
import { DifficultyLevel } from "../domain/models/Assignment.ts";

interface QuestionListProps {
  questions: Partial<Question>[];
}

export default function QuestionList({ questions }: QuestionListProps) {
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  
  // Function to handle delete button click
  const handleDeleteClick = (questionId: string) => {
    setQuestionToDelete(questionId);
    setShowDeleteModal(true);
  };
  
  // Function to cancel delete
  const handleCancelDelete = () => {
    setQuestionToDelete(null);
    setShowDeleteModal(false);
  };
  
  // Function to confirm delete
  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    
    try {
      const response = await fetch(`/admin/questions?id=${questionToDelete}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Redirect to refresh the page
        globalThis.location.href = '/admin/questions';
      } else {
        console.error('Failed to delete question');
        // You could show an error message here
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    } finally {
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    }
  };

  // Helper function to get type color
  const getTypeColor = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return "bg-purple-100 text-purple-800";
      case QuestionType.TRUE_FALSE:
        return "bg-green-100 text-green-800";
      case QuestionType.SHORT_ANSWER:
        return "bg-blue-100 text-blue-800";
      case QuestionType.ESSAY:
        return "bg-yellow-100 text-yellow-800";
      case QuestionType.MATCHING:
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get difficulty color
  const getDifficultyColor = (level: DifficultyLevel) => {
    switch (level) {
      case DifficultyLevel.EASY:
        return "bg-green-100 text-green-800";
      case DifficultyLevel.MEDIUM:
        return "bg-yellow-100 text-yellow-800";
      case DifficultyLevel.HARD:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get group color (using a hash function for consistency)
  const getGroupColor = (group: string) => {
    // Simple hash function to get a consistent color for each group
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-yellow-100 text-yellow-800",
      "bg-red-100 text-red-800",
      "bg-indigo-100 text-indigo-800",
      "bg-purple-100 text-purple-800",
      "bg-pink-100 text-pink-800",
    ];
    
    let hash = 0;
    for (let i = 0; i < group.length; i++) {
      hash = ((hash << 5) - hash) + group.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    hash = Math.abs(hash);
    return colors[hash % colors.length];
  };
  
  return (
    <>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Difficulty
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {questions.map(question => (
              <tr key={question.id} class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-normal">
                  <div class="text-sm font-medium text-gray-900">{question.prompt}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(question.type!)}`}>
                    {question.type}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(question.difficultyLevel as DifficultyLevel)}`}>
                    {question.difficultyLevel}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {question.group && (
                    <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getGroupColor(question.group)}`}>
                      {question.group}
                    </span>
                  )}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-wrap gap-1">
                    {question.tags?.map(tag => (
                      <span key={tag} class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {question.createdAt ? new Date(question.createdAt).toLocaleDateString() : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href={`/admin/questions/${question.id}`} class="text-indigo-600 hover:text-indigo-900 mr-3">
                    Edit
                  </a>
                  <button 
                    type="button"
                    class="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteClick(question.id!)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                    Delete Question
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      Are you sure you want to delete this question? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button 
                type="button"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
              <button 
                type="button"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
