import { useLocation } from "react-router-dom";

interface QuizResult {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface ResultsProps {
  score: number;
  totalQuestions: number;
  quizResults: QuizResult[];
}

const Results = () => {
  const location = useLocation();
  const { score, totalQuestions, quizResults } = (location.state || {}) as ResultsProps;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card border border-border p-6 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Quiz Natijalari</h1>
        <p className="text-xl mb-2 text-foreground">
          Sizning ballingiz: <span className="font-semibold text-primary">{score} / {totalQuestions}</span>
        </p>
        <p className="text-lg text-muted-foreground mb-6">
          {((score / totalQuestions) * 100).toFixed(2)}% to'g'ri javoblar
        </p>

        {quizResults && quizResults.length > 0 && (
          <div className="mt-6 text-left">
            <h2 className="text-xl font-semibold mb-3 text-foreground">Javoblaringizni ko'rib chiqing:</h2>
            {quizResults.map((result, index) => (
              <div key={index} className="mb-4 p-3 border border-border rounded-xl bg-muted/20">
                <p className="font-medium text-foreground">Savol: {result.question}</p>
                <p className={result.isCorrect ? "text-green-500" : "text-red-500"}>
                  Sizning javobingiz: {result.selectedAnswer} {result.isCorrect ? "(To'g'ri)" : "(Noto'g'ri)"}
                </p>
                {!result.isCorrect && (
                  <p className="text-green-500">To'g'ri javob: {result.correctAnswer}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => window.location.href = "/"}
          className="mt-8 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-bold rounded-xl transition-colors"
        >
          Qayta boshlash
        </button>
      </div>
    </div>
  );
};

export default Results;
