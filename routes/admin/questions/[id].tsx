import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { z } from "zod";
import { DifficultyLevel } from "../../../domain/models/Assignment.ts";
import { Question, QuestionType, createQuestion } from "../../../domain/models/Question.ts";
import { RepositoryFactory } from "../../../infrastructure/repositories/RepositoryFactory.ts";

// Admin UUID for question creation
const ADMIN_UUID = "00000000-0000-0000-0000-000000000000";

// Question edit form schema
const QuestionSchema = z.object({
  text: z.string().min(3, "Question text must be at least 3 characters"),
  type: z.nativeEnum(QuestionType, {
    errorMap: () => ({ message: "Please select a valid question type" }),
  }),
  difficultyLevel: z.nativeEnum(DifficultyLevel, {
    errorMap: () => ({ message: "Please select a valid difficulty level" }),
  }),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  tags: z.string().min(1, "At least one tag is required"),
  options: z.array(z.string()).optional(),
  explanation: z.string().optional(),
});

type QuestionForm = z.infer<typeof QuestionSchema>;

interface EditQuestionData {
  formErrors?: Record<string, string>;
  formValues?: Partial<QuestionForm>;
  success?: boolean;
  question?: Question;
}

export const handler: Handlers<EditQuestionData> = {
  async GET(req, ctx) {
    const { id } = ctx.params;
    
    try {
      // Get the question repository
      const questionRepo = RepositoryFactory.createQuestionRepository();
      
      // Fetch the question by ID
      const question = await questionRepo.findById(id);
      
      if (!question) {
        return new Response("Question not found", { status: 404 });
      }
      
      // Convert tags array to comma-separated string
      const tagsString = question.tags?.join(", ") || "";
      
      // Prepare form values based on question type
      let correctAnswer = "";
      let options: string[] = [];
      
      switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
          // @ts-ignore - We know this is a multiple choice question
          options = question.options?.map(opt => opt.text) || [];
          // @ts-ignore - Find the correct option index
          const correctIndex = question.options?.findIndex(opt => opt.isCorrect);
          correctAnswer = correctIndex !== undefined && correctIndex >= 0 ? correctIndex.toString() : "";
          break;
          
        case QuestionType.TRUE_FALSE:
          // @ts-ignore - We know this is a true/false question
          correctAnswer = question.correctAnswer ? "true" : "false";
          break;
          
        case QuestionType.SHORT_ANSWER:
          // @ts-ignore - We know this is a short answer question
          correctAnswer = question.correctAnswers?.[0] || "";
          break;
          
        default:
          // For other question types, no special handling needed
          break;
      }
      
      // Return form with question data
      return ctx.render({
        question,
        formValues: {
          text: question.prompt,
          type: question.type,
          difficultyLevel: question.difficultyLevel as DifficultyLevel,
          correctAnswer,
          tags: tagsString,
          options: options.length > 0 ? options : ["", "", "", ""],
          explanation: question.explanation || "",
        },
      });
    } catch (error) {
      console.error("Error fetching question:", error);
      return new Response("Error fetching question", { status: 500 });
    }
  },
  
  async POST(req, ctx) {
    const { id } = ctx.params;
    const formData = await req.formData();
    
    // Extract form values
    const text = formData.get("text")?.toString() || "";
    const type = formData.get("type")?.toString() as QuestionType | undefined;
    const difficultyLevel = formData.get("difficultyLevel")?.toString() as DifficultyLevel | undefined;
    const correctAnswer = formData.get("correctAnswer")?.toString() || "";
    const tags = formData.get("tags")?.toString() || "";
    const explanation = formData.get("explanation")?.toString() || "";
    
    // Get options for multiple choice questions
    const options: string[] = [];
    if (type === QuestionType.MULTIPLE_CHOICE) {
      const optionCount = 4; // Default number of options
      for (let i = 0; i < optionCount; i++) {
        const option = formData.get(`option${i}`)?.toString() || "";
        options.push(option);
      }
    }
    
    // Create form values object
    const formValues = {
      text,
      type,
      difficultyLevel,
      correctAnswer,
      tags,
      options,
      explanation,
    };
    
    // Validate form data
    const result = QuestionSchema.safeParse(formValues);
    
    if (!result.success) {
      // Return validation errors
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      
      // Add validation for options if it's a multiple choice question
      if (type === QuestionType.MULTIPLE_CHOICE) {
        const emptyOptions = options.filter(opt => !opt.trim()).length;
        if (emptyOptions > 0) {
          errors.options = "All options must be filled out";
        }
      }
      
      return ctx.render({
        formErrors: errors,
        formValues,
      });
    }
    
    try {
      // Get the question repository
      const questionRepo = RepositoryFactory.createQuestionRepository();
      
      // Get the existing question
      const existingQuestion = await questionRepo.findById(id);
      
      if (!existingQuestion) {
        return new Response("Question not found", { status: 404 });
      }
      
      // Parse tags into an array
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      // Create the updated question object
      const questionData = {
        ...existingQuestion,
        prompt: text,
        type: type as QuestionType,
        difficultyLevel: difficultyLevel as DifficultyLevel,
        tags: tagArray,
        explanation: explanation || undefined,
        updatedAt: new Date(),
      };
      
      // Process options and correct answers based on question type
      if (type === QuestionType.MULTIPLE_CHOICE) {
        // For multiple choice, convert options to the required format
        const formattedOptions = options.map((optionText, index) => ({
          id: existingQuestion.options?.[index]?.id || crypto.randomUUID(),
          text: optionText,
          isCorrect: index.toString() === correctAnswer
        }));
        
        // @ts-ignore - We know this is a multiple choice question
        questionData.options = formattedOptions;
      } else if (type === QuestionType.TRUE_FALSE) {
        // @ts-ignore - We know this is a true/false question
        questionData.correctAnswer = correctAnswer === "true";
      } else if (type === QuestionType.SHORT_ANSWER) {
        // @ts-ignore - We know this is a short answer question
        questionData.correctAnswers = [correctAnswer];
      }
      
      // Save the updated question to the database
      await questionRepo.save(questionData as any); // Type assertion to bypass TypeScript error
      
      // Redirect to the questions list
      return new Response("", {
        status: 303,
        headers: { Location: "/admin/questions" },
      });
    } catch (error: unknown) {
      console.error("Error updating question:", error);
      
      // Return with error
      return ctx.render({
        formErrors: {
          _form: `Failed to update question: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
        formValues,
      });
    }
  },
};

export default function EditQuestion({ data }: PageProps<EditQuestionData>) {
  const { formErrors = {}, formValues = {}, success = false, question } = data;
  
  // Handle question type change
  const showOptions = formValues.type === QuestionType.MULTIPLE_CHOICE;
  const showTrueFalse = formValues.type === QuestionType.TRUE_FALSE;
  const showCorrectAnswer = formValues.type !== undefined && 
                           formValues.type !== QuestionType.MULTIPLE_CHOICE && 
                           formValues.type !== QuestionType.TRUE_FALSE;
  
  return (
    <div>
      <Head>
        <title>Edit Question</title>
      </Head>
      
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Edit Question</h1>
        <p class="text-gray-600">Update an existing question</p>
      </div>
      
      {success && (
        <div class="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Question updated successfully!
        </div>
      )}
      
      {formErrors._form && (
        <div class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {formErrors._form}
        </div>
      )}
      
      <form method="POST" class="space-y-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="space-y-4">
            {/* Question text */}
            <div>
              <label for="text" class="block text-sm font-medium text-gray-700 mb-1">
                Question Text <span class="text-red-500">*</span>
              </label>
              <textarea
                id="text"
                name="text"
                rows={3}
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.text ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                value={formValues.text}
                required
              ></textarea>
              {formErrors.text && (
                <p class="mt-1 text-sm text-red-600">{formErrors.text}</p>
              )}
            </div>
            
            {/* Question type */}
            <div>
              <label for="type" class="block text-sm font-medium text-gray-700 mb-1">
                Question Type <span class="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formValues.type}
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.type ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                required
              >
                <option value="">Select Question Type</option>
                <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                <option value={QuestionType.TRUE_FALSE}>True/False</option>
                <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
                <option value={QuestionType.ESSAY}>Essay</option>
                <option value={QuestionType.MATCHING}>Matching</option>
              </select>
              {formErrors.type && (
                <p class="mt-1 text-sm text-red-600">{formErrors.type}</p>
              )}
            </div>
            
            {/* Difficulty level */}
            <div>
              <label for="difficultyLevel" class="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level <span class="text-red-500">*</span>
              </label>
              <select
                id="difficultyLevel"
                name="difficultyLevel"
                value={formValues.difficultyLevel}
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.difficultyLevel ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                required
              >
                <option value="">Select Difficulty Level</option>
                <option value={DifficultyLevel.EASY}>Easy</option>
                <option value={DifficultyLevel.MEDIUM}>Medium</option>
                <option value={DifficultyLevel.HARD}>Hard</option>
              </select>
              {formErrors.difficultyLevel && (
                <p class="mt-1 text-sm text-red-600">{formErrors.difficultyLevel}</p>
              )}
            </div>
            
            {/* Tags */}
            <div>
              <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
                Tags <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formValues.tags}
                placeholder="Separate tags with commas (e.g. math, algebra, equations)"
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.tags ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                required
              />
              {formErrors.tags && (
                <p class="mt-1 text-sm text-red-600">{formErrors.tags}</p>
              )}
            </div>
            
            {/* Explanation */}
            <div>
              <label for="explanation" class="block text-sm font-medium text-gray-700 mb-1">
                Explanation (Optional)
              </label>
              <textarea
                id="explanation"
                name="explanation"
                rows={3}
                class={`w-full px-3 py-2 border rounded-md ${
                  formErrors.explanation ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                value={formValues.explanation}
              ></textarea>
              {formErrors.explanation && (
                <p class="mt-1 text-sm text-red-600">{formErrors.explanation}</p>
              )}
            </div>
            
            {/* Multiple choice options */}
            {showOptions && (
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Options <span class="text-red-500">*</span>
                </label>
                <div class="space-y-2">
                  {formValues.options?.map((option, index) => (
                    <div key={index} class="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`correctOption${index}`}
                        name="correctAnswer"
                        value={index}
                        checked={formValues.correctAnswer === index.toString()}
                        class="h-4 w-4 text-purple-600 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        id={`option${index}`}
                        name={`option${index}`}
                        value={option}
                        placeholder={`Option ${index + 1}`}
                        class={`flex-1 px-3 py-2 border rounded-md ${
                          formErrors.options ? "border-red-500" : "border-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        required
                      />
                    </div>
                  ))}
                </div>
                {formErrors.options && (
                  <p class="mt-1 text-sm text-red-600">{formErrors.options}</p>
                )}
                {formErrors.correctAnswer && (
                  <p class="mt-1 text-sm text-red-600">{formErrors.correctAnswer}</p>
                )}
              </div>
            )}
            
            {/* True/False answer */}
            {showTrueFalse && (
              <div>
                <label for="correctAnswer" class="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer <span class="text-red-500">*</span>
                </label>
                <select
                  id="correctAnswer"
                  name="correctAnswer"
                  value={formValues.correctAnswer}
                  class={`w-full px-3 py-2 border rounded-md ${
                    formErrors.correctAnswer ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  required
                >
                  <option value="">Select Correct Answer</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
                {formErrors.correctAnswer && (
                  <p class="mt-1 text-sm text-red-600">{formErrors.correctAnswer}</p>
                )}
              </div>
            )}
            
            {/* Other question types correct answer */}
            {showCorrectAnswer && (
              <div>
                <label for="correctAnswer" class="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="correctAnswer"
                  name="correctAnswer"
                  value={formValues.correctAnswer}
                  class={`w-full px-3 py-2 border rounded-md ${
                    formErrors.correctAnswer ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  required
                />
                {formErrors.correctAnswer && (
                  <p class="mt-1 text-sm text-red-600">{formErrors.correctAnswer}</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div class="flex justify-end space-x-3">
          <a
            href="/admin/questions"
            class="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            class="px-4 py-2 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 transition-colors"
          >
            Update Question
          </button>
        </div>
      </form>
    </div>
  );
}