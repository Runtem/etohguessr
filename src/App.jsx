// ImageGuessGame.jsx
import { useState, useEffect } from "react";
import './App.css';

// Small UI primitives (defined inline so no external imports required)
export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl shadow-md bg-white text-black ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function Button({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow ${className}`}
    >
      {children}
    </button>
  );
}

// Example dataset (local images with multiple possible answers)
// Place images in your public folder (e.g. public/images/cat.jpg)
const images = [
  { url: "/images/ToM.jpg", answers: ["ToM", "Tower of Madness"] },
  { url: "/images/CoHaD.jpg", answers: ["CoHaD", "Citadel of Heights and Depths"] },
  { url: "/images/CoWS.jpg", answers: ["CoWS", "Citadel of Wacky Strategy"] },
  { url: "/images/ToFN.jpg", answers: ["ToFN", "Tower of Frightening Nightmares"] },
  { url: "/images/ToGaH.jpg", answers: ["ToGaH", "Tower of Glitches and Healing"] },
  { url: "/images/ToI.jpg", answers: ["ToI", "Tower of Inception"] },
  { url: "/images/ToL.jpg", answers: ["ToL", "Tower of Linonophobia"] },
  { url: "/images/ToOH.jpg", answers: ["ToOH", "Tower of Overcoming Hatred"] },
  { url: "/images/ToR.jpg", answers: ["ToR", "Tower of Rage"] },
  { url: "/images/ToSI.jpg", answers: ["ToSI", "Tower of Slight Inconvenience"] },
];

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ImageGuessGame() {
  const [shuffledImages, setShuffledImages] = useState(shuffleArray(images));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState(null);

  useEffect(() => {
    const storedHigh = parseInt(localStorage.getItem("highScore"), 10);
    if (!Number.isNaN(storedHigh)) setHighScore(storedHigh);
  }, []);

  const checkGuess = () => {
    const normalized = guess.trim().toLowerCase();
    const validAnswers = shuffledImages[currentIndex].answers.map(a => a.toLowerCase());
    const isCorrect = validAnswers.includes(normalized);

    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      setGuess("");

      // advance to next image, reshuffle if needed
      if (currentIndex + 1 < shuffledImages.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setShuffledImages(shuffleArray(images));
        setCurrentIndex(0);
      }
    } else {
      setLastCorrectAnswer(shuffledImages[currentIndex].answers[0]);
      endGame();
    }
  };

  const endGame = () => {
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("highScore", score.toString());
    }
  };

  const restart = () => {
    setScore(0);
    setGuess("");
    setGameOver(false);
    setShuffledImages(shuffleArray(images));
    setCurrentIndex(0);
    setLastCorrectAnswer(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <Card className="w-full max-w-md mx-auto text-center p-6 bg-gray-800 rounded-2xl shadow-lg">
        <CardContent>
          {!gameOver ? (
            <>
              <h1 className="text-xl font-bold mb-4">Guess the EToH Tower</h1>
              <img
                src={shuffledImages[currentIndex].url}
                alt="guess"
                className="mx-auto mb-4 rounded-xl shadow max-h-64 object-cover"
              />

              <input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkGuess()}
                className="w-full p-2 mb-3 text-black rounded"
                placeholder="Type your guess and press Enter or Submit..."
              />

              <Button onClick={checkGuess} className="w-full mb-3">Submit</Button>

              <div className="flex justify-between text-sm opacity-90">
                <div>Score: {score}</div>
                <div>High Score: {highScore}</div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-4">Game Over!</h1>
              <p className="mb-2">Your Score: {score}</p>
              <p className="mb-2">High Score: {highScore}</p>
              {lastCorrectAnswer && (
                <p className="mb-4">Correct Answer was: <span className="font-semibold">{lastCorrectAnswer}</span></p>
              )}
              <Button onClick={restart} className="w-full">Play Again</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}