import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { DifficultyLevel } from "../../../domain/models/Assignment.ts";
import { Question, QuestionType } from "../../../domain/models/Question.ts";
import { RepositoryFactory } from "../../../infrastructure/repositories/RepositoryFactory.ts";
import QuestionList from "../../../islands/QuestionList.tsx";

// Extract all unique tags from questions
const getUniqueTags = (questions: Partial<Question>[]) => {
  return Array.from(
    new Set(questions.flatMap(q => q.tags || []))
  ).sort();
};

// Extract all unique groups from questions
const getUniqueGroups = (questions: Partial<Question>[]) => {
  return Array.from(
    new Set(questions.map(q => q.group).filter(Boolean) as string[])
  ).sort();
};

interface QuestionsPageData {
  questions: Partial<Question>[];
  filters: {
    type?: QuestionType;
    difficultyLevel?: DifficultyLevel;
    tag?: string;
    group?: string;
    searchTerm?: string;
  };
  allTags: string[];
  allGroups: string[];
}

export const handler: Handlers<QuestionsPageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    
    // Extract filter parameters
    const type = url.searchParams.get("type") as QuestionType | null;
    const difficultyLevel = url.searchParams.get("difficulty") as DifficultyLevel | null;
    const tag = url.searchParams.get("tag") || undefined;
    const group = url.searchParams.get("group") || undefined;
    const searchTerm = url.searchParams.get("search") || undefined;
    
    // Get the question repository
    const questionRepo = RepositoryFactory.createQuestionRepository();
    
    // Fetch all questions from the database
    const allQuestions = await questionRepo.findAll();
    
    // Apply filters
    let filteredQuestions = [...allQuestions];
    
    if (type) {
      filteredQuestions = filteredQuestions.filter(q => q.type === type);
    }
    
    if (difficultyLevel) {
      filteredQuestions = filteredQuestions.filter(q => q.difficultyLevel === difficultyLevel);
    }
    
    if (tag) {
      filteredQuestions = filteredQuestions.filter(q => q.tags?.includes(tag));
    }
    
    if (group) {
      filteredQuestions = filteredQuestions.filter(q => q.group === group);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredQuestions = filteredQuestions.filter(q => 
        q.prompt?.toLowerCase().includes(searchLower) || 
        q.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Get unique tags and groups
    const allTags = getUniqueTags(allQuestions);
    const allGroups = getUniqueGroups(allQuestions);
    
    return ctx.render({
      questions: filteredQuestions,
      filters: {
        type: type as QuestionType | undefined,
        difficultyLevel: difficultyLevel as DifficultyLevel | undefined,
        tag,
        group,
        searchTerm,
      },
      allTags,
      allGroups,
    });
  },
  
  async DELETE(req, _ctx) {
    const url = new URL(req.url);
    const questionId = url.searchParams.get("id");
    
    if (!questionId) {
      return new Response("Question ID is required", { status: 400 });
    }
    
    try {
      // Get the question repository
      const questionRepo = RepositoryFactory.createQuestionRepository();
      
      // Delete the question
      await questionRepo.delete(questionId);
      
      // Redirect back to the questions list
      return new Response(null, {
        status: 303,
        headers: { Location: "/admin/questions" },
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      return new Response(`Error deleting question: ${error instanceof Error ? error.message : "Unknown error"}`, { 
        status: 500 
      });
    }
  }
};

export default function QuestionsPage({ data }: PageProps<QuestionsPageData>) {
  const { questions, filters, allTags, allGroups } = data;
  
  return (
    <div class="max-w-6xl mx-auto">
      <Head>
        <title>Question Bank</title>
      </Head>
      
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Question Bank</h1>
          <p class="text-gray-600">Manage your questions for assignments</p>
        </div>
        <a
          href="/admin/questions/new"
          class="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          New Question
        </a>
      </div>
      
      {/* Filters */}
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <form method="GET" class="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.searchTerm}
              placeholder="Search questions..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* Question Type */}
          <div>
            <label for="type" class="block text-sm font-medium text-gray-700 mb-1">
              Question Type
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Types</option>
              <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
              <option value={QuestionType.TRUE_FALSE}>True/False</option>
              <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
              <option value={QuestionType.ESSAY}>Essay</option>
              <option value={QuestionType.MATCHING}>Matching</option>
            </select>
          </div>
          
          {/* Difficulty Level */}
          <div>
            <label for="difficulty" class="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={filters.difficultyLevel}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Levels</option>
              <option value={DifficultyLevel.EASY}>Easy</option>
              <option value={DifficultyLevel.MEDIUM}>Medium</option>
              <option value={DifficultyLevel.HARD}>Hard</option>
            </select>
          </div>
          
          {/* Group */}
          <div>
            <label for="group" class="block text-sm font-medium text-gray-700 mb-1">
              Group
            </label>
            <select
              id="group"
              name="group"
              value={filters.group}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Groups</option>
              {allGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          
          {/* Tag */}
          <div>
            <label for="tag" class="block text-sm font-medium text-gray-700 mb-1">
              Tag
            </label>
            <select
              id="tag"
              name="tag"
              value={filters.tag}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          
          {/* Filter Buttons */}
          <div class="md:col-span-5 flex justify-end space-x-2">
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <a
              href="/admin/questions"
              class="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </a>
          </div>
        </form>
      </div>
      
      {/* Questions Table */}
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <QuestionList questions={questions} />
      </div>
    </div>
  );
}
