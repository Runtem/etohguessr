import { useState, useEffect } from "react";
import "./App.css";

export function Card({ children, className = "" }) {
    return (
        <div
            className={`rounded-2xl shadow-md bg-white text-black ${className}`}
        >
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

// --- Image Sets ---
const defaultImages = [
    { url: "/images/ToM.jpg", answers: ["ToM", "Tower of Madness"] },
    {
        url: "/images/CoHaD.jpg",
        answers: ["CoHaD", "Citadel of Heights and Depths"],
    },
    { url: "/images/CoWS.jpg", answers: ["CoWS", "Citadel of Wacky Strategy"] },
    {
        url: "/images/ToFN.jpg",
        answers: ["ToFN", "Tower of Frightening Nightmares"],
    },
    {
        url: "/images/ToGaH.jpg",
        answers: ["ToGaH", "Tower of Glitches and Healing"],
    },
    { url: "/images/ToI.jpg", answers: ["ToI", "Tower of Inception"] },
    { url: "/images/ToL.jpg", answers: ["ToL", "Tower of Linonophobia"] },
    {
        url: "/images/ToOH.jpg",
        answers: ["ToOH", "Tower of Overcoming Hatred"],
    },
    { url: "/images/ToR.jpg", answers: ["ToR", "Tower of Rage"] },
    {
        url: "/images/ToSI.jpg",
        answers: ["ToSI", "Tower of Slight Inconvenience"],
    },
];

const pitOfMiseryImages = [
    {
        url: "/images/ToMDC.jpg",
        answers: ["ToMDC", "Tower of Modernistic Design Choices"],
    },
    { url: "/images/CoIV.jpg", answers: ["CoIV", "Citadel of Infinite Void"] },
    { url: "/images/ToBF.jpg", answers: ["ToBF", "Tower of Blind Fate"] },
    { url: "/images/ToEV.jpg", answers: ["ToEV", "Tower of Eternal Void"] },
    {
        url: "/images/ToOLC.jpg",
        answers: ["ToOLC", "Tower of Overthinking Life Choices"],
    },
    {
        url: "/images/ToSE.jpg",
        answers: ["ToSE", "Tower of Shunning Excursion"],
    },
    { url: "/images/ToSF.jpg", answers: ["ToSF", "Tower of Spiralling Fates"] },
    {
        url: "/images/TotRP.jpg",
        answers: ["TotRP", "Tower of The Roof's Pique"],
    },
    {
        url: "/images/ToVH.jpg",
        answers: ["ToVH", "Tower of Vacant Hindrances"],
    },
    { url: "/images/ToWM.jpg", answers: ["ToWM", "Tower of Water Melon"] },
    {
        url: "/images/ToXIC.jpg",
        answers: ["ToXIC", "Tower of Xerially Infuriating Calamity"],
    },
    {
        url: "/images/ToVM.jpg",
        answers: ["ToVM", "Tower of Vindictive Maneuvers"],
    },
    { url: "/images/WaT.jpg", answers: ["WaT", "Was a Tower"] },
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
    const [includePit, setIncludePit] = useState(false);
    const [selectedSetName, setSelectedSetName] = useState("");
    const [imageSet, setImageSet] = useState(null); // null = not chosen yet
    const [shuffledImages, setShuffledImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [guess, setGuess] = useState("");
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [highScore, setHighScore] = useState(0);
    const [lastCorrectAnswer, setLastCorrectAnswer] = useState(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Preload images after dataset is chosen
    useEffect(() => {
        if (!imageSet) return;
        let loadedCount = 0;
        const total = imageSet.length;

        imageSet.forEach((img) => {
            const imageObj = new Image();
            imageObj.src = img.url;
            imageObj.onload = () => {
                loadedCount++;
                if (loadedCount === total) {
                    setShuffledImages(shuffleArray(imageSet));
                    setImagesLoaded(true);
                }
            };
            // guard in case some images 404 — still counts them so preload doesn't hang
            imageObj.onerror = () => {
                loadedCount++;
                if (loadedCount === total) {
                    setShuffledImages(shuffleArray(imageSet));
                    setImagesLoaded(true);
                }
            };
        });
    }, [imageSet]);

    useEffect(() => {
        const storedHigh = parseInt(localStorage.getItem("highScore"), 10);
        if (!Number.isNaN(storedHigh)) setHighScore(storedHigh);
    }, []);

    const startGame = () => {
        const chosen = includePit
            ? [...defaultImages, ...pitOfMiseryImages]
            : [...defaultImages];
        setSelectedSetName(includePit ? "EToH + Pit of Misery" : "EToH");
        // reset states for a fresh game
        setImagesLoaded(false);
        setShuffledImages([]);
        setCurrentIndex(0);
        setScore(0);
        setGuess("");
        setGameOver(false);
        setLastCorrectAnswer(null);
        setImageSet(chosen);
    };

    const checkGuess = () => {
        if (!shuffledImages.length) return;
        const normalized = guess.trim().toLowerCase();
        const validAnswers = shuffledImages[currentIndex].answers.map((a) =>
            a.toLowerCase()
        );
        const isCorrect = validAnswers.includes(normalized);

        if (isCorrect) {
            const newScore = score + 1;
            setScore(newScore);
            setGuess("");

            if (currentIndex + 1 < shuffledImages.length) {
                setCurrentIndex((i) => i + 1);
            } else {
                setShuffledImages(shuffleArray(imageSet));
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
        if (!imageSet) return;
        setScore(0);
        setGuess("");
        setGameOver(false);
        setShuffledImages(shuffleArray(imageSet));
        setCurrentIndex(0);
        setLastCorrectAnswer(null);
    };

    // Start screen with checkbox
    if (!imageSet) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
                <Card className="w-full max-w-md mx-auto text-center p-6 bg-gray-800 rounded-2xl shadow-lg">
                    <CardContent>
                        <h1 className="text-xl font-bold mb-4">
                            Guess the EToH Tower
                        </h1>

                        <label className="flex items-center mb-4">
                            <div className="mr-4">
                                <div className="font-semibold">
                                    Include Pit of Misery
                                </div>
                                <div className="text-sm opacity-80 text-left">
                                    {pitOfMiseryImages.length} towers
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={includePit}
                                onChange={(e) =>
                                    setIncludePit(e.target.checked)
                                }
                                className="h-5 w-5"
                                aria-label="Include Pit of Misery towers"
                            />
                        </label>

                        <Button onClick={startGame} className="w-full mb-3">
                            Start Game
                        </Button>

                        <div className="text-sm opacity-80">
                            Tip: type the tower acronym (e.g.{" "}
                            <span className="font-semibold">ToM</span>) or the
                            full tower name.
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!imagesLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
                <h1 className="text-xl font-bold">Loading images...</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            <Card className="w-full max-w-md mx-auto text-center p-6 bg-gray-800 rounded-2xl shadow-lg">
                <CardContent>
                    {!gameOver ? (
                        <>
                            <h1 className="text-xl font-bold mb-4">
                                Guess the EToH Tower
                            </h1>
                            <img
                                src={shuffledImages[currentIndex].url}
                                alt="guess"
                                className="mx-auto mb-4 rounded-xl shadow max-h-64 object-cover"
                            />

                            <input
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && checkGuess()
                                }
                                className="w-full p-2 mb-3 text-black rounded"
                                placeholder="Type your guess..."
                            />

                            <Button
                                onClick={checkGuess}
                                className="w-full mb-3"
                            >
                                Submit
                            </Button>

                            <div className="flex justify-between text-sm opacity-90">
                                <div>Score: {score}</div>
                                <div>High Score: {highScore}</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-bold mb-4">
                                Game Over!
                            </h1>
                            <p className="mb-2">Your Score: {score}</p>
                            <p className="mb-2">High Score: {highScore}</p>
                            {lastCorrectAnswer && (
                                <p className="mb-4">
                                    Correct Answer was:{" "}
                                    <span className="font-semibold">
                                        {lastCorrectAnswer}
                                    </span>
                                </p>
                            )}
                            <Button onClick={restart} className="w-full mb-3">
                                Play Again
                            </Button>
                            <Button
                                onClick={() => {
                                    setImageSet(null);
                                    setImagesLoaded(false);
                                    // keep includePit as-is so user's preference remains
                                }}
                                className="w-full"
                            >
                                Back to Start
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
