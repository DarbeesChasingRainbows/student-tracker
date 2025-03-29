import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { z } from "zod";
import { AssignmentType, DifficultyLevel } from "../../../domain/models/Assignment.ts";
import { QuestionType } from "../../../domain/models/Question.ts";

// Assignment creation form schema
const AssignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.nativeEnum(AssignmentType, {
    errorMap: () => ({ message: "Please select a valid assignment type" }),
  }),
  difficultyLevel: z.nativeEnum(DifficultyLevel, {
    errorMap: () => ({ message: "Please select a valid difficulty level" }),
  }),
  dueDate: z.string().min(1, "Due date is required"),
  allowRetakes: z.boolean().optional(),
  maxRetakes: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  retakeThreshold: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  adaptiveEnabled: z.boolean().optional(),
  adaptiveThreshold: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  confettiEnabled: z.boolean().optional(),
});

type AssignmentForm = z.infer<typeof AssignmentSchema>;

// Mock data for students
const mockStudents = [
  { id: "1", name: "Alice Johnson" },
  { id: "2", name: "Bob Smith" },
  { id: "3", name: "Charlie Brown" },
  { id: "4", name: "Diana Miller" },
  { id: "5", name: "Ethan Davis" },
  { id: "6", name: "Fiona Wilson" },
];

// Custom question type for the mock data to include OPEN_ENDED
enum ExtendedQuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_false",
  SHORT_ANSWER = "short_answer",
  ESSAY = "essay",
  MATCHING = "matching",
  OPEN_ENDED = "open_ended" // Added this type for backward compatibility
}

// Mock data for questions
const mockQuestions = [
  { 
    id: "1", 
    text: "What is 2 + 2?", 
    type: QuestionType.MULTIPLE_CHOICE,
    difficultyLevel: DifficultyLevel.EASY,
    tags: ["math", "addition"],
    group: "Mathematics",
  },
  { 
    id: "2", 
    text: "What is the capital of France?", 
    type: QuestionType.MULTIPLE_CHOICE,
    difficultyLevel: DifficultyLevel.EASY,
    tags: ["geography", "europe"],
    group: "Geography",
  },
  { 
    id: "3", 
    text: "Explain the water cycle.", 
    type: ExtendedQuestionType.OPEN_ENDED, // Using the extended type
    difficultyLevel: DifficultyLevel.MEDIUM,
    tags: ["science", "environment"],
    group: "Science",
  },
  { 
    id: "4", 
    text: "Solve for x: 2x + 5 = 13", 
    type: QuestionType.SHORT_ANSWER,
    difficultyLevel: DifficultyLevel.MEDIUM,
    tags: ["math", "algebra"],
    group: "Mathematics",
  },
  { 
    id: "5", 
    text: "What is the main theme of 'To Kill a Mockingbird'?", 
    type: QuestionType.ESSAY,
    difficultyLevel: DifficultyLevel.HARD,
    tags: ["literature", "analysis"],
    group: "Literature",
  },
];

// Extract all unique groups from questions
const allGroups = Array.from(
  new Set(mockQuestions.map(q => q.group))
).sort();

// Extract all unique tags from questions
const allTags = Array.from(
  new Set(mockQuestions.flatMap(q => q.tags))
).sort();

interface NewAssignmentData {
  formErrors?: Record<string, string>;
  formValues?: Partial<AssignmentForm>;
  students: typeof mockStudents;
  questions: typeof mockQuestions;
  allGroups: typeof allGroups;
  allTags: typeof allTags;
  filters?: {
    group?: string;
    tag?: string;
    difficultyLevel?: DifficultyLevel;
    type?: QuestionType | ExtendedQuestionType;
  };
}

export const handler: Handlers<NewAssignmentData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || "";
    
    if (!username) {
      // Redirect back to login if no username
      return new Response("", {
        status: 303,
        headers: { Location: "/admin" },
      });
    }
    
    // Get filter parameters
    const group = url.searchParams.get("group") || undefined;
    const tag = url.searchParams.get("tag") || undefined;
    const difficultyLevel = url.searchParams.get("difficulty") as DifficultyLevel | undefined;
    const type = url.searchParams.get("type") as QuestionType | ExtendedQuestionType | undefined;
    
    // Filter questions based on parameters
    let filteredQuestions = [...mockQuestions];
    
    if (group) {
      filteredQuestions = filteredQuestions.filter(q => q.group === group);
    }
    
    if (tag) {
      filteredQuestions = filteredQuestions.filter(q => q.tags.includes(tag));
    }
    
    if (difficultyLevel) {
      filteredQuestions = filteredQuestions.filter(q => q.difficultyLevel === difficultyLevel);
    }
    
    if (type) {
      filteredQuestions = filteredQuestions.filter(q => q.type === type);
    }
    
    return ctx.render({
      students: mockStudents,
      questions: filteredQuestions,
      allGroups,
      allTags,
      filters: {
        group,
        tag,
        difficultyLevel,
        type,
      },
    });
  },
  
  async POST(req, ctx) {
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || "";
    
    if (!username) {
      // Redirect back to login if no username
      return new Response("", {
        status: 303,
        headers: { Location: "/admin" },
      });
    }
    
    const formData = await req.formData();
    const rawFormData = Object.fromEntries(formData.entries());
    
    // Handle form submission
    try {
      const parsedForm = AssignmentSchema.parse({
        title: formData.get("title"),
        description: formData.get("description"),
        type: formData.get("type"),
        difficultyLevel: formData.get("difficultyLevel"),
        dueDate: formData.get("dueDate"),
        allowRetakes: formData.get("allowRetakes") === "on",
        maxRetakes: formData.get("maxRetakes"),
        retakeThreshold: formData.get("retakeThreshold"),
        adaptiveEnabled: formData.get("adaptiveEnabled") === "on",
        adaptiveThreshold: formData.get("adaptiveThreshold"),
        confettiEnabled: formData.get("confettiEnabled") === "on",
      });
      
      // In a real app, we would save the assignment to the database
      console.log("Assignment created:", parsedForm);
      
      // Redirect to assignments list
      return new Response("", {
        status: 303,
        headers: { Location: `/admin/assignments?username=${username}` },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formErrors: Record<string, string> = {};
        
        for (const issue of error.issues) {
          formErrors[issue.path[0]] = issue.message;
        }
        
        // Convert form values to the expected types for the form
        const formValues = {
          title: rawFormData.title as string,
          description: rawFormData.description as string,
          type: rawFormData.type as AssignmentType | undefined,
          difficultyLevel: rawFormData.difficultyLevel as DifficultyLevel | undefined,
          dueDate: rawFormData.dueDate as string,
          allowRetakes: rawFormData.allowRetakes === "on",
          maxRetakes: rawFormData.maxRetakes ? parseInt(rawFormData.maxRetakes as string) : undefined,
          retakeThreshold: rawFormData.retakeThreshold ? parseInt(rawFormData.retakeThreshold as string) : undefined,
          adaptiveEnabled: rawFormData.adaptiveEnabled === "on",
          adaptiveThreshold: rawFormData.adaptiveThreshold ? parseInt(rawFormData.adaptiveThreshold as string) : undefined,
          confettiEnabled: rawFormData.confettiEnabled === "on",
        };
        
        return ctx.render({
          formErrors,
          formValues,
          students: mockStudents,
          questions: mockQuestions,
          allGroups,
          allTags,
        });
      }
      
      throw error;
    }
  },
};

export default function NewAssignment({ data }: PageProps<NewAssignmentData>) {
  const { 
    formErrors = {}, 
    formValues = {}, 
    students, 
    questions, 
    allGroups = [], 
    allTags = [],
    filters = {} 
  } = data;
  
  // Get all available question types for the dropdown
  const questionTypes = [
    ...Object.values(QuestionType),
    ExtendedQuestionType.OPEN_ENDED // Add the extended type
  ];
  
  // Get type badge color
  const getTypeColor = (type: QuestionType | ExtendedQuestionType) => {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return "bg-blue-100 text-blue-800";
      case QuestionType.TRUE_FALSE:
        return "bg-green-100 text-green-800";
      case QuestionType.SHORT_ANSWER:
        return "bg-yellow-100 text-yellow-800";
      case QuestionType.ESSAY:
        return "bg-purple-100 text-purple-800";
      case QuestionType.MATCHING:
        return "bg-pink-100 text-pink-800";
      case ExtendedQuestionType.OPEN_ENDED:
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div>
      <Head>
        <title>Create New Assignment</title>
      </Head>
      
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Create New Assignment</h1>
        <p class="text-gray-600">Design a new assignment for your students</p>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment form */}
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-6">Assignment Details</h2>
            
            <form method="post" class="space-y-6">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formValues.title || ""}
                  class={`w-full px-3 py-2 border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  placeholder="Enter assignment title"
                />
                {formErrors.title && (
                  <p class="mt-1 text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>
              
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formValues.description || ""}
                  class={`w-full px-3 py-2 border ${formErrors.description ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  placeholder="Enter assignment description"
                ></textarea>
                {formErrors.description && (
                  <p class="mt-1 text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="type" class="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    class={`w-full px-3 py-2 border ${formErrors.type ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="">Select Type</option>
                    {Object.values(AssignmentType).map(type => (
                      <option 
                        key={type} 
                        value={type}
                        selected={formValues.type === type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                  {formErrors.type && (
                    <p class="mt-1 text-sm text-red-500">{formErrors.type}</p>
                  )}
                </div>
                
                <div>
                  <label for="difficultyLevel" class="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    id="difficultyLevel"
                    name="difficultyLevel"
                    class={`w-full px-3 py-2 border ${formErrors.difficultyLevel ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="">Select Difficulty</option>
                    {Object.values(DifficultyLevel).map(level => (
                      <option 
                        key={level} 
                        value={level}
                        selected={formValues.difficultyLevel === level}
                      >
                        {level}
                      </option>
                    ))}
                  </select>
                  {formErrors.difficultyLevel && (
                    <p class="mt-1 text-sm text-red-500">{formErrors.difficultyLevel}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label for="dueDate" class="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formValues.dueDate || ""}
                  class={`w-full px-3 py-2 border ${formErrors.dueDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
                {formErrors.dueDate && (
                  <p class="mt-1 text-sm text-red-500">{formErrors.dueDate}</p>
                )}
              </div>
              
              <div class="border-t border-gray-200 pt-4">
                <h3 class="text-lg font-medium text-gray-800 mb-3">Advanced Settings</h3>
                
                <div class="space-y-4">
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="allowRetakes"
                      name="allowRetakes"
                      checked={formValues.allowRetakes}
                      class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label for="allowRetakes" class="ml-2 block text-sm text-gray-700">
                      Allow Retakes
                    </label>
                  </div>
                  
                  {formValues.allowRetakes && (
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                      <div>
                        <label for="maxRetakes" class="block text-sm font-medium text-gray-700 mb-1">
                          Max Retakes
                        </label>
                        <input
                          type="number"
                          id="maxRetakes"
                          name="maxRetakes"
                          min="1"
                          max="10"
                          value={formValues.maxRetakes || ""}
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label for="retakeThreshold" class="block text-sm font-medium text-gray-700 mb-1">
                          Retake Threshold (%)
                        </label>
                        <input
                          type="number"
                          id="retakeThreshold"
                          name="retakeThreshold"
                          min="0"
                          max="100"
                          value={formValues.retakeThreshold || ""}
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="adaptiveEnabled"
                      name="adaptiveEnabled"
                      checked={formValues.adaptiveEnabled}
                      class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label for="adaptiveEnabled" class="ml-2 block text-sm text-gray-700">
                      Enable Adaptive Learning
                    </label>
                  </div>
                  
                  {formValues.adaptiveEnabled && (
                    <div class="ml-6">
                      <label for="adaptiveThreshold" class="block text-sm font-medium text-gray-700 mb-1">
                        Adaptive Threshold (%)
                      </label>
                      <input
                        type="number"
                        id="adaptiveThreshold"
                        name="adaptiveThreshold"
                        min="0"
                        max="100"
                        value={formValues.adaptiveThreshold || ""}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                  
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="confettiEnabled"
                      name="confettiEnabled"
                      checked={formValues.confettiEnabled}
                      class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label for="confettiEnabled" class="ml-2 block text-sm text-gray-700">
                      Enable Confetti on Completion
                    </label>
                  </div>
                </div>
              </div>
              
              <div class="flex justify-end space-x-3">
                <a 
                  href={`/admin/dashboard?username=admin`}
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </a>
                <button 
                  type="submit"
                  class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Question selection */}
        <div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-6">Question Bank</h2>
            
            <form method="get" class="mb-4">
              <input type="hidden" name="username" value="admin" />
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label for="group-filter" class="block text-sm font-medium text-gray-700 mb-1">
                    Group
                  </label>
                  <select
                    id="group-filter"
                    name="group"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Groups</option>
                    {allGroups.map(group => (
                      <option key={group} value={group} selected={filters.group === group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label for="tag-filter" class="block text-sm font-medium text-gray-700 mb-1">
                    Tag
                  </label>
                  <select
                    id="tag-filter"
                    name="tag"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Tags</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag} selected={filters.tag === tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label for="difficulty-filter" class="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    id="difficulty-filter"
                    name="difficulty"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Difficulties</option>
                    {Object.values(DifficultyLevel).map(level => (
                      <option key={level} value={level} selected={filters.difficultyLevel === level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label for="type-filter" class="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    id="type-filter"
                    name="type"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Types</option>
                    {questionTypes.map(type => (
                      <option key={type} value={type} selected={filters.type === type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div class="mt-4">
                <button 
                  type="submit"
                  class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Apply Filters
                </button>
              </div>
            </form>
            
            <div class="space-y-3 max-h-[600px] overflow-y-auto">
              {questions.map(question => (
                <div key={question.id} class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                  <div class="flex justify-between items-start mb-2">
                    <span class={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(question.type)}`}>
                      {question.type}
                    </span>
                    <span class="text-xs text-gray-500">{question.difficultyLevel}</span>
                  </div>
                  <p class="text-sm text-gray-800 mb-2">{question.text}</p>
                  <div class="flex flex-wrap gap-1">
                    {question.tags.map(tag => (
                      <span key={tag} class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div class="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 class="text-xl font-bold text-gray-800 mb-6">Assign To</h2>
            
            <div class="space-y-2">
              {students.map(student => (
                <div key={student.id} class="flex items-center">
                  <input
                    type="checkbox"
                    id={`student-${student.id}`}
                    name="students[]"
                    value={student.id}
                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label for={`student-${student.id}`} class="ml-2 block text-sm text-gray-700">
                    {student.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
