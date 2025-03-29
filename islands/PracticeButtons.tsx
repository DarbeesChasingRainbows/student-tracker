import { JSX } from "preact";

export function HintButton({ _questionId }: { _questionId: string }): JSX.Element {
  return (
    <button
      type="button"
      class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
      onClick={() => alert("Show hint functionality would be implemented here")}
    >
      Show Hint
    </button>
  );
}

export function CheckAnswerButton({ _questionId }: { _questionId: string }): JSX.Element {
  return (
    <button
      type="button"
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      onClick={() => alert("Check answer functionality would be implemented here")}
    >
      Check Answer
    </button>
  );
}

export function GetMoreQuestionsButton(): JSX.Element {
  return (
    <button
      type="button"
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      onClick={() => alert("Get more questions functionality would be implemented here")}
    >
      Get More Questions
    </button>
  );
}
