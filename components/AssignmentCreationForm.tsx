// AssignmentCreationForm.tsx
import { useState, useEffect } from 'preact/hooks';
import { AssignmentType } from '../domain/models/Assignment.ts';
import { Question } from '../domain/models/Question.ts';
import { z } from 'zod';

// Form validation schema
const AssignmentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.nativeEnum(AssignmentType),
  questionIds: z.array(z.string().uuid()).min(1, "At least one question is required"),
  dueDate: z.string().min(1, "Due date is required"),
  timeLimit: z.number().min(0, "Time limit must be 0 or greater"),
  confettiThreshold: z.number().min(0).max(100),
  maxRetakes: z.number().min(1),
  instructions: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

type AssignmentForm = z.infer<typeof AssignmentFormSchema>;

export default function AssignmentCreationForm() {
  const [form, setForm] = useState<AssignmentForm>({
    title: '',
    description: '',
    type: AssignmentType.HOMEWORK,
    questionIds: [],
    dueDate: '',
    timeLimit: 0,
    confettiThreshold: 80,
    maxRetakes: 1,
    instructions: '',
    categories: [],
  });

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available questions
  useEffect(() => {
    // TODO: Implement API call to fetch questions
    // For now, use empty array
    setAvailableQuestions([]);
  }, []);

  // Filter questions based on search term and tags
  const filteredQuestions = availableQuestions.filter(q => 
    q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterTag === '' || q.tags.includes(filterTag))
  );

  const handleAddQuestion = (question: Question) => {
    setSelectedQuestions([...selectedQuestions, question]);
    setForm(prev => ({
      ...prev,
      questionIds: [...prev.questionIds, question.id]
    }));
  };

  const handleRemoveQuestion = (questionId: string) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
    setForm(prev => ({
      ...prev,
      questionIds: prev.questionIds.filter(id => id !== questionId)
    }));
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const validatedForm = AssignmentFormSchema.parse(form);
      
      // TODO: Implement API call to create assignment
      console.log('Creating assignment:', validatedForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message || 'Form validation failed');
      } else {
        setError('An error occurred while creating the assignment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AssignmentForm) => (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!target) return;

    if (field === 'type') {
      setForm(prev => ({ ...prev, type: target.value as AssignmentType }));
    } else if (field === 'confettiThreshold' || field === 'timeLimit' || field === 'maxRetakes') {
      setForm(prev => ({ ...prev, [field]: parseInt(target.value) }));
    } else {
      setForm(prev => ({ ...prev, [field]: target.value }));
    }
  };

  const handleCheckboxChange = (field: keyof AssignmentForm) => (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target) return;

    if (field === 'confettiThreshold') {
      setForm(prev => ({ ...prev, confettiThreshold: target.checked ? 80 : 100 }));
    } else if (field === 'maxRetakes') {
      setForm(prev => ({ ...prev, maxRetakes: target.checked ? 1 : 1 }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Create New Assignment</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Basic information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={handleInputChange('title')}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignment Type
          </label>
          <select
            value={form.type}
            onChange={handleInputChange('type')}
            className="w-full p-2 border rounded"
            required
          >
            {Object.values(AssignmentType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={handleInputChange('description')}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instructions for Students
        </label>
        <textarea
          value={form.instructions}
          onChange={handleInputChange('instructions')}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={handleInputChange('dueDate')}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Limit (minutes, 0 for no limit)
          </label>
          <input
            type="number"
            min="0"
            value={form.timeLimit}
            onChange={handleInputChange('timeLimit')}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {/* Gamification and adaptive learning settings */}
      <div className="bg-gray-50 p-4 rounded mb-4">
        <h3 className="font-medium mb-3">Learning Settings</h3>
        
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={form.confettiThreshold < 100}
            onChange={handleCheckboxChange('confettiThreshold')}
            className="mr-2"
          />
          <label>Enable Confetti</label>
          
          {form.confettiThreshold < 100 && (
            <div className="ml-4">
              <label className="mr-2">Threshold:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.confettiThreshold}
                onChange={handleInputChange('confettiThreshold')}
                className="w-16 p-1 border rounded"
              />
              <span className="ml-1">%</span>
            </div>
          )}
        </div>

        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={form.maxRetakes > 1}
            onChange={handleCheckboxChange('maxRetakes')}
            className="mr-2"
          />
          <label>Allow Retakes</label>
          
          {form.maxRetakes > 1 && (
            <div className="ml-4">
              <label className="mr-2">Max Retakes:</label>
              <input
                type="number"
                min="1"
                value={form.maxRetakes}
                onChange={handleInputChange('maxRetakes')}
                className="w-16 p-1 border rounded"
              />
            </div>
          )}
        </div>
      </div>

      {/* Question selection */}
      <div className="mb-4">
        <h3 className="font-medium mb-3">Selected Questions ({selectedQuestions.length})</h3>
        
        {selectedQuestions.length === 0 ? (
          <p className="text-gray-500 italic">No questions selected yet.</p>
        ) : (
          <ul className="border rounded divide-y">
            {selectedQuestions.map((question, index) => (
              <li key={question.id} className="p-3 flex justify-between items-center">
                <div>
                  <span className="font-medium mr-2">{index + 1}.</span>
                  {question.prompt}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(question.id)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Question browser */}
      <div className="mb-4">
        <h3 className="font-medium mb-3">Add Questions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => {
              const target = e.target as HTMLInputElement;
              if (!target) return;
              setSearchTerm(target.value);
            }}
            className="p-2 border rounded"
          />
          
          <select
            value={filterTag}
            onChange={(e) => {
              const target = e.target as HTMLSelectElement;
              if (!target) return;
              setFilterTag(target.value);
            }}
            className="p-2 border rounded"
          >
            <option value="">All Tags</option>
            {/* Dynamically populate with available tags */}
          </select>
        </div>

        <div className="max-h-64 overflow-y-auto border rounded">
          {filteredQuestions.length === 0 ? (
            <p className="p-3 text-gray-500 italic">No questions found.</p>
          ) : (
            <ul className="divide-y">
              {filteredQuestions.map(question => (
                <li key={question.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p>{question.prompt}</p>
                    <div className="flex mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-2">
                        {question.type}
                      </span>
                      {question.tags.map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded mr-2">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion(question)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded"
                    disabled={selectedQuestions.some(q => q.id === question.id)}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create Assignment'}
      </button>
    </form>
  );
}