import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { QuestionType } from "../../../domain/models/Question.ts";
import { DifficultyLevel } from "../../../domain/models/Assignment.ts";
import { HintButton, CheckAnswerButton, GetMoreQuestionsButton } from "../../../islands/PracticeButtons.tsx";

// Mock data for practice questions
const mockPracticeQuestions = [
  {
    id: "p1",
    prompt: "What is the capital of France?",
    type: QuestionType.MULTIPLE_CHOICE,
    difficultyLevel: DifficultyLevel.EASY,
    options: [
      { id: "opt1", text: "London", isCorrect: false },
      { id: "opt2", text: "Berlin", isCorrect: false },
      { id: "opt3", text: "Paris", isCorrect: true },
      { id: "opt4", text: "Madrid", isCorrect: false },
    ],
    explanation: "Paris is the capital and most populous city of France.",
    tags: ["geography", "capitals"],
  },
  {
    id: "p2",
    prompt: "Solve for x: 2x + 7 = 15",
    type: QuestionType.SHORT_ANSWER,
    difficultyLevel: DifficultyLevel.MEDIUM,
    correctAnswers: ["4"],
    explanation: "2x + 7 = 15\n2x = 8\nx = 4",
    tags: ["algebra", "equations"],
  },
  {
    id: "p3",
    prompt: "What is the formula for the area of a circle?",
    type: QuestionType.MULTIPLE_CHOICE,
    difficultyLevel: DifficultyLevel.MEDIUM,
    options: [
      { id: "opt1", text: "A = πr", isCorrect: false },
      { id: "opt2", text: "A = πr²", isCorrect: true },
      { id: "opt3", text: "A = 2πr", isCorrect: false },
      { id: "opt4", text: "A = πd", isCorrect: false },
    ],
    explanation: "The area of a circle is calculated using the formula A = πr², where r is the radius of the circle.",
    tags: ["geometry", "formulas"],
  },
  {
    id: "p4",
    prompt: "What is the main function of mitochondria in a cell?",
    type: QuestionType.MULTIPLE_CHOICE,
    difficultyLevel: DifficultyLevel.HARD,
    options: [
      { id: "opt1", text: "Protein synthesis", isCorrect: false },
      { id: "opt2", text: "Cell division", isCorrect: false },
      { id: "opt3", text: "Energy production", isCorrect: true },
      { id: "opt4", text: "Storage of genetic material", isCorrect: false },
    ],
    explanation: "Mitochondria are often referred to as the 'powerhouse of the cell' because they generate most of the cell's supply of adenosine triphosphate (ATP), which is used as a source of chemical energy.",
    tags: ["biology", "cells"],
  },
];

// Mock data for student's weak areas
const mockWeakAreas = [
  "algebra",
  "grammar",
  "cells",
];

interface PracticeSessionData {
  username: string;
  avatarId: string;
  questions: typeof mockPracticeQuestions;
  weakAreas: string[];
}

export const handler: Handlers<PracticeSessionData> = {
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
    
    // In a real app, we would fetch questions based on the student's weak areas
    // and spaced repetition algorithm
    return ctx.render({
      username,
      avatarId,
      questions: mockPracticeQuestions,
      weakAreas: mockWeakAreas,
    });
  },
};

export default function PracticeSession({ data }: PageProps<PracticeSessionData>) {
  const { username, questions, weakAreas } = data;
  
  // Get difficulty level color
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
  
  return (
    <div>
      <Head>
        <title>Practice Session</title>
      </Head>
      
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Practice Session</h1>
            <p class="text-gray-600">
              Practice questions tailored to your learning needs
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
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Focus Areas</h2>
        <p class="text-gray-600 mb-3">
          Based on your previous work, we recommend focusing on these areas:
        </p>
        <div class="flex flex-wrap gap-2 mb-4">
          {weakAreas.map(area => (
            <span 
              key={area} 
              class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
            >
              {area}
            </span>
          ))}
        </div>
        <p class="text-sm text-gray-500">
          Practice sessions use spaced repetition to help you remember concepts over time.
        </p>
      </div>
      
      <div class="space-y-8">
        {questions.map((question, index) => (
          <div key={question.id} class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-800">Question {index + 1}</h3>
              <div class="flex items-center space-x-2">
                <span class={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(question.difficultyLevel)}`}>
                  {question.difficultyLevel}
                </span>
                {question.tags.map(tag => (
                  <span 
                    key={tag} 
                    class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <p class="text-gray-800 mb-4">{question.prompt}</p>
            
            <form class="space-y-4">
              {question.type === QuestionType.MULTIPLE_CHOICE && question.options && (
                <div class="space-y-2">
                  {question.options.map(option => (
                    <label key={option.id} class="flex items-start p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`question_${question.id}`} 
                        value={option.id}
                        class="mt-0.5 mr-3"
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === QuestionType.SHORT_ANSWER && (
                <div>
                  <input
                    type="text"
                    name={`question_${question.id}`}
                    class="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your answer..."
                  />
                </div>
              )}
              
              <div class="flex justify-between pt-2">
                <HintButton _questionId={question.id} />
                <CheckAnswerButton _questionId={question.id} />
              </div>
            </form>
          </div>
        ))}
      </div>
      
      <div class="mt-8 flex justify-between">
        <a 
          href={`/student/dashboard?username=${encodeURIComponent(username)}`}
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
        >
          End Practice
        </a>
        <GetMoreQuestionsButton />
      </div>
    </div>
  );
}
