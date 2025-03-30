// QuestionCreationForm.tsx
import { useState } from 'preact/hooks';
import { QuestionType, DifficultyLevel } from '../domain/models/Question.ts';
import { Button } from '../components/Button.tsx';

// Define proper types for the question data
interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface QuestionData {
  prompt: string;
  type: QuestionType;
  difficultyLevel: DifficultyLevel;
  options: QuestionOption[];
  correctAnswer: string;
  tags: string[];
  mediaUrl: string;
  mediaType: string;
  pointValue: number;
}

interface QuestionFormProps {
  onSubmit: (questionData: QuestionData) => Promise<void>;
  initialData?: Partial<QuestionData>;
}

export default function QuestionCreationForm({ onSubmit, initialData }: QuestionFormProps) {
  const [question, setQuestion] = useState<QuestionData>({
    prompt: initialData?.prompt || '',
    type: initialData?.type || QuestionType.MULTIPLE_CHOICE,
    difficultyLevel: initialData?.difficultyLevel || DifficultyLevel.MEDIUM,
    options: initialData?.options || [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
    correctAnswer: initialData?.correctAnswer || '',
    tags: initialData?.tags || [],
    mediaUrl: initialData?.mediaUrl || '',
    mediaType: initialData?.mediaType || '',
    pointValue: initialData?.pointValue || 1
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!question.prompt.trim()) {
      newErrors.prompt = 'Question prompt is required';
    }
    
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      // Check if at least one option is marked as correct
      const hasCorrectOption = question.options.some(option => option.isCorrect);
      if (!hasCorrectOption) {
        newErrors.options = 'At least one option must be marked as correct';
      }
      
      // Check if all options have text
      const emptyOptions = question.options.some(option => !option.text.trim());
      if (emptyOptions) {
        newErrors.options = newErrors.options || 'All options must have text';
      }
    } else if (question.type === QuestionType.SHORT_ANSWER && !question.correctAnswer.trim()) {
      newErrors.correctAnswer = 'Correct answer is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (validateForm()) {
      await onSubmit(question);
    }
  };
  
  const handlePromptChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setQuestion({
      ...question,
      prompt: target.value
    });
  };
  
  const handleTypeChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setQuestion({
      ...question,
      type: target.value as QuestionType,
      // Reset options when changing question type
      options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
      correctAnswer: ''
    });
  };
  
  const handleDifficultyChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setQuestion({
      ...question,
      difficultyLevel: target.value as DifficultyLevel
    });
  };
  
  const handleOptionTextChange = (index: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[index].text = value;
    setQuestion({
      ...question,
      options: newOptions
    });
  };
  
  const handleOptionCorrectChange = (index: number, value: boolean) => {
    const newOptions = [...question.options];
    newOptions[index].isCorrect = value;
    setQuestion({
      ...question,
      options: newOptions
    });
  };
  
  const addOption = () => {
    setQuestion({
      ...question,
      options: [...question.options, { text: '', isCorrect: false }]
    });
  };
  
  const removeOption = (index: number) => {
    const newOptions = [...question.options];
    newOptions.splice(index, 1);
    setQuestion({
      ...question,
      options: newOptions
    });
  };
  
  const handleCorrectAnswerChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setQuestion({
      ...question,
      correctAnswer: target.value
    });
  };
  
  const handleTagsChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setQuestion({
      ...question,
      tags: target.value.split(',').map(tag => tag.trim())
    });
  };
  
  const handlePointValueChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setQuestion({
      ...question,
      pointValue: parseInt(target.value) || 1
    });
  };
  
  // Helper function to format type names
  const formatType = (type: string): string => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };
  
  return (
    <form onSubmit={handleSubmit} class="bg-white shadow-md rounded-lg p-6 mb-8">
      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2" htmlFor="prompt">
          Question Prompt
        </label>
        <textarea
          id="prompt"
          value={question.prompt}
          onChange={handlePromptChange}
          class={`w-full px-3 py-2 border rounded-md ${errors.prompt ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          rows={4}
          placeholder="Enter the question prompt"
        />
        {errors.prompt && <p class="text-red-500 text-xs mt-1">{errors.prompt}</p>}
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
            Question Type
          </label>
          <select
            id="type"
            value={question.type}
            onChange={handleTypeChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(QuestionType).map((type) => (
              <option key={type} value={type}>
                {formatType(type)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" htmlFor="difficulty">
            Difficulty Level
          </label>
          <select
            id="difficulty"
            value={question.difficultyLevel}
            onChange={handleDifficultyChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(DifficultyLevel).map((level) => (
              <option key={level} value={level}>
                {formatType(level)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {question.type === QuestionType.MULTIPLE_CHOICE && (
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">
            Answer Options
          </label>
          {errors.options && <p class="text-red-500 text-xs mb-2">{errors.options}</p>}
          
          {question.options.map((option, index) => (
            <div key={index} class="flex items-center mb-2">
              <input
                type="checkbox"
                checked={option.isCorrect}
                onChange={(e) => handleOptionCorrectChange(index, (e.target as HTMLInputElement).checked)}
                class="mr-2"
              />
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleOptionTextChange(index, (e.target as HTMLInputElement).value)}
                placeholder={`Option ${index + 1}`}
                class="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {question.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  class="ml-2 text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addOption}
            class="mt-2 text-blue-500 hover:text-blue-700"
          >
            + Add Option
          </button>
        </div>
      )}
      
      {question.type === QuestionType.TRUE_FALSE && (
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">
            Correct Answer
          </label>
          <div class="flex items-center">
            <label class="inline-flex items-center mr-4">
              <input
                type="radio"
                name="trueFalse"
                checked={question.correctAnswer === 'true'}
                onChange={() => setQuestion({ ...question, correctAnswer: 'true' })}
                class="mr-2"
              />
              <span>True</span>
            </label>
            <label class="inline-flex items-center">
              <input
                type="radio"
                name="trueFalse"
                checked={question.correctAnswer === 'false'}
                onChange={() => setQuestion({ ...question, correctAnswer: 'false' })}
                class="mr-2"
              />
              <span>False</span>
            </label>
          </div>
        </div>
      )}
      
      {question.type !== QuestionType.MULTIPLE_CHOICE && question.type !== QuestionType.TRUE_FALSE && (
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2" htmlFor="correctAnswer">
            Correct Answer
          </label>
          <input
            type="text"
            id="correctAnswer"
            value={question.correctAnswer}
            onChange={handleCorrectAnswerChange}
            class={`w-full px-3 py-2 border rounded-md ${errors.correctAnswer ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Enter the correct answer"
          />
          {errors.correctAnswer && <p class="text-red-500 text-xs mt-1">{errors.correctAnswer}</p>}
        </div>
      )}
      
      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">
          Tags (comma separated)
        </label>
        <input
          type="text"
          id="tags"
          value={question.tags.join(', ')}
          onChange={handleTagsChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="math, algebra, equations"
        />
      </div>
      
      <div class="mb-6">
        <label class="block text-gray-700 text-sm font-bold mb-2" htmlFor="pointValue">
          Point Value
        </label>
        <input
          type="number"
          id="pointValue"
          value={question.pointValue}
          onChange={handlePointValueChange}
          min="1"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div class="flex justify-end">
        <Button type="submit" variant="primary">
          Create Question
        </Button>
      </div>
    </form>
  );
}
