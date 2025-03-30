// QuestionCreationForm.tsx
/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from "preact";
import { useState } from 'preact/hooks';
import { QuestionType, DifficultyLevel } from '../domain/models/Question.ts';
import { Button } from './Button.tsx';

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
  onSubmit: (questionData: QuestionData) => void;
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
      const hasCorrectOption = question.options.some((opt: QuestionOption) => opt.isCorrect);
      if (!hasCorrectOption) {
        newErrors.options = 'At least one option must be marked as correct';
      }
      
      // Check if all options have text
      const emptyOptions = question.options.some((opt: QuestionOption) => !opt.text.trim());
      if (emptyOptions) {
        newErrors.optionsText = 'All options must have text';
      }
    } else if (question.type === QuestionType.SHORT_ANSWER && !question.correctAnswer.trim()) {
      newErrors.correctAnswer = 'Correct answer is required';
    }
    
    if (question.pointValue < 1) {
      newErrors.pointValue = 'Point value must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Transform the form data as needed
      const formattedQuestion: QuestionData = {
        ...question,
        // Ensure tags is an array
        tags: Array.isArray(question.tags) ? question.tags : [],
      };
      
      onSubmit(formattedQuestion);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Create New Question</h2>
      
      {/* Question type selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Type
        </label>
        <select 
          value={question.type}
          onChange={(e: Event) => {
            const target = e.target as HTMLSelectElement;
            setQuestion({...question, type: target.value as QuestionType});
          }}
          className="w-full p-2 border rounded"
        >
          {Object.values(QuestionType).map((type: string) => (
            <option key={type} value={type}>{formatType(type)}</option>
          ))}
        </select>
      </div>
      
      {/* Question prompt */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Prompt
        </label>
        <textarea 
          value={question.prompt}
          onChange={(e: Event) => {
            const target = e.target as HTMLTextAreaElement;
            setQuestion({...question, prompt: target.value});
          }}
          className={`w-full p-2 border rounded ${errors.prompt ? 'border-red-500' : ''}`}
          rows={3}
        />
        {errors.prompt && <p className="text-red-500 text-sm mt-1">{errors.prompt}</p>}
      </div>
      
      {/* Media upload (conditional) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add Media (Optional)
        </label>
        <select
          value={question.mediaType}
          onChange={(e: Event) => {
            const target = e.target as HTMLSelectElement;
            setQuestion({...question, mediaType: target.value});
          }}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="">None</option>
          <option value="image">Image</option>
          <option value="audio">Audio</option>
        </select>
        
        {question.mediaType && (
          <input 
            type="file" 
            accept={question.mediaType === 'image' ? 'image/*' : 'audio/*'}
            className="w-full p-2 border rounded"
            onChange={(e: Event) => {
              const target = e.target as HTMLInputElement;
              if (target.files && target.files[0]) {
                // Handle file upload logic here
                // For now, we'll just store the file name
                setQuestion({
                  ...question,
                  mediaUrl: URL.createObjectURL(target.files[0])
                });
              }
            }}
          />
        )}
      </div>
      
      {/* Type-specific inputs (e.g., multiple choice options, correct answer) */}
      {question.type === QuestionType.MULTIPLE_CHOICE && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Answer Options
          </label>
          {errors.options && <p className="text-red-500 text-sm mb-2">{errors.options}</p>}
          {errors.optionsText && <p className="text-red-500 text-sm mb-2">{errors.optionsText}</p>}
          
          {question.options.map((option: QuestionOption, index: number) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="radio"
                name="correctOption"
                checked={option.isCorrect}
                onChange={() => {
                  const newOptions = question.options.map((opt: QuestionOption, i: number) => ({
                    ...opt,
                    isCorrect: i === index
                  }));
                  setQuestion({...question, options: newOptions});
                }}
                className="mr-2"
              />
              <input
                type="text"
                value={option.text}
                onChange={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  const newOptions = [...question.options];
                  newOptions[index].text = target.value;
                  setQuestion({...question, options: newOptions});
                }}
                className={`flex-1 p-2 border rounded ${errors.optionsText ? 'border-red-500' : ''}`}
                placeholder={`Option ${index + 1}`}
              />
              {question.options.length > 2 && (
                <button 
                  type="button"
                  onClick={() => {
                    const newOptions = question.options.filter((_: QuestionOption, i: number) => i !== index);
                    setQuestion({...question, options: newOptions});
                  }}
                  className="ml-2 p-1 text-red-500"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setQuestion({
                ...question, 
                options: [...question.options, { text: '', isCorrect: false }]
              });
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
          >
            Add Option
          </button>
        </div>
      )}
      
      {question.type === QuestionType.SHORT_ANSWER && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correct Answer
          </label>
          <input
            type="text"
            value={question.correctAnswer}
            onChange={(e: Event) => {
              const target = e.target as HTMLInputElement;
              setQuestion({...question, correctAnswer: target.value});
            }}
            className={`w-full p-2 border rounded ${errors.correctAnswer ? 'border-red-500' : ''}`}
          />
          {errors.correctAnswer && <p className="text-red-500 text-sm mt-1">{errors.correctAnswer}</p>}
        </div>
      )}
      
      {/* Tags input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags (comma separated)
        </label>
        <input
          type="text"
          value={Array.isArray(question.tags) ? question.tags.join(', ') : ''}
          onChange={(e: Event) => {
            const target = e.target as HTMLInputElement;
            const tagsString = target.value;
            const tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
            setQuestion({...question, tags: tags as string[]});
          }}
          className="w-full p-2 border rounded"
        />
      </div>
      
      {/* Question difficulty */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Difficulty Level
        </label>
        <select
          value={question.difficultyLevel}
          onChange={(e: Event) => {
            const target = e.target as HTMLSelectElement;
            setQuestion({...question, difficultyLevel: target.value as DifficultyLevel});
          }}
          className="w-full p-2 border rounded"
        >
          {Object.values(DifficultyLevel).map((level: string) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>
      
      {/* Point value */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Point Value
        </label>
        <input
          type="number"
          min="1"
          value={question.pointValue}
          onChange={(e: Event) => {
            const target = e.target as HTMLInputElement;
            setQuestion({...question, pointValue: parseInt(target.value)});
          }}
          className={`w-full p-2 border rounded ${errors.pointValue ? 'border-red-500' : ''}`}
        />
        {errors.pointValue && <p className="text-red-500 text-sm mt-1">{errors.pointValue}</p>}
      </div>
      
      {/* Submit button */}
      <Button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Create Question
      </Button>
    </form>
  );
}

// Helper function to format type names
function formatType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}