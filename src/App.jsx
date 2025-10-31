import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useEffect, useState } from "react";
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

export function ButtonWithoutRoundedCorners({
    children,
    onClick,
    className = "",
}) {
    return (
        <button
            onClick={onClick}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold shadow ${className}`}
        >
            {children}
        </button>
    );
}

function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export default function ImageGuessGame() {
    const [allData, setAllData] = useState(null);
    const [loadingJson, setLoadingJson] = useState(true);

    const urlParams =
        typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : null;
    // screenshotMode is stateful so we can enable it transiently while the user is taking a screenshot
    const [screenshotMode, setScreenshotMode] = useState(
        urlParams ? urlParams.has("screenshot") : false
    );

    const [includePoM, setIncludePoM] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    const [currentPool, setCurrentPool] = useState([]);
    const [shuffledImages, setShuffledImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [guess, setGuess] = useState("");
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [lastCorrectAnswer, setLastCorrectAnswer] = useState(null);

    const [highScore, setHighScore] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let clearTimer = null;

        const enableScreenshotMode = () => {
            setScreenshotMode(true);
            if (clearTimer) {
                clearTimeout(clearTimer);
                clearTimer = null;
            }
            // auto-disable after 3s in case no keyup is detected
            clearTimer = setTimeout(() => setScreenshotMode(false), 3000);
        };

        const disableScreenshotMode = () => {
            if (clearTimer) {
                clearTimeout(clearTimer);
                clearTimer = null;
            }
            // tiny delay to allow screenshot paint
            setTimeout(() => setScreenshotMode(false), 150);
        };

        const onKeyDown = (e) => {
            // PrintScreen key
            if (e.key === "PrintScreen") {
                enableScreenshotMode();
                return;
            }

            // Ctrl/Cmd+Shift+S (common screenshot shortcut)
            const isMod = e.ctrlKey || e.metaKey;
            if (isMod && e.shiftKey && e.key.toLowerCase() === "s") {
                enableScreenshotMode();
            }
        };

        const onKeyUp = (e) => {
            if (e.key === "PrintScreen") {
                disableScreenshotMode();
                return;
            }

            const isMod = e.ctrlKey || e.metaKey;
            if (isMod && e.shiftKey && e.key.toLowerCase() === "s") {
                disableScreenshotMode();
            }
        };

        const onBlur = () => {
            // when window loses focus (often happens during screenshot tools)
            enableScreenshotMode();
            // then disable shortly after
            if (clearTimer) clearTimeout(clearTimer);
            clearTimer = setTimeout(() => setScreenshotMode(false), 1000);
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("blur", onBlur);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("blur", onBlur);
            if (clearTimer) clearTimeout(clearTimer);
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/images/towers.json");
                const data = await res.json();
                if (!mounted) return;
                setAllData({
                    defaultImages: data.defaultImages || [],
                    pomImages: data.pomImages || [],
                });
            } catch (err) {
                console.error("Failed to load /images/towers.json", err);
                if (!mounted) return;
                setAllData({ defaultImages: [], pomImages: [] });
            } finally {
                if (mounted) setLoadingJson(false);
            }
        })();

        const storedHigh = parseInt(localStorage.getItem("highScore"), 10);
        if (!Number.isNaN(storedHigh)) setHighScore(storedHigh);

        return () => {
            mounted = false;
        };
    }, []);

    const startGame = () => {
        if (!allData) return;
        const pool = [...(allData.defaultImages || [])];
        if (includePoM && Array.isArray(allData.pomImages)) {
            pool.push(...allData.pomImages);
        }

        if (!pool.length) {
            console.warn("No images available for the selected set.");
            return;
        }

        setGameStarted(true);
        setImagesLoaded(false);
        setCurrentPool(pool);
        setShuffledImages([]);
        setCurrentIndex(0);
        setScore(0);
        setGuess("");
        setGameOver(false);
        setLastCorrectAnswer(null);

        let loadedCount = 0;
        const total = pool.length;

        pool.forEach((item) => {
            const img = new Image();
            img.src = item.url;
            img.onload = () => {
                loadedCount++;
                if (loadedCount >= total) {
                    const shuffled = shuffleArray(pool);
                    setShuffledImages(shuffled);
                    setImagesLoaded(true);
                }
            };
            img.onerror = () => {
                loadedCount++;
                if (loadedCount >= total) {
                    const shuffled = shuffleArray(pool);
                    setShuffledImages(shuffled);
                    setImagesLoaded(true);
                }
            };
        });

        setTimeout(() => {
            if (!imagesLoaded && !shuffledImages.length) {
                const shuffled = shuffleArray(pool);
                setShuffledImages(shuffled);
                setImagesLoaded(true);
            }
        }, 6000);
    };

    const checkGuess = () => {
        if (!shuffledImages.length) return;
        const normalized = guess.trim().toLowerCase();
        const validAnswers = shuffledImages[currentIndex].answers.map((a) =>
            String(a).toLowerCase()
        );
        const isCorrect = validAnswers.includes(normalized);

        if (isCorrect) {
            setScore((s) => s + 1);
            setGuess("");

            if (currentIndex + 1 < shuffledImages.length) {
                setCurrentIndex((i) => i + 1);
            } else {
                setShuffledImages((prev) => shuffleArray(currentPool));
                setCurrentIndex(0);
            }
        } else {
            setLastCorrectAnswer(shuffledImages[currentIndex].answers[0]);
            endGame();
        }
    };

    const endGame = () => {
        setGameOver(true);
        setHighScore((prevHigh) => {
            if (score > prevHigh) {
                localStorage.setItem("highScore", String(score));
                return score;
            }
            return prevHigh;
        });
    };

    const restart = () => {
        if (!currentPool || !currentPool.length) return startGame();
        setShuffledImages(shuffleArray(currentPool));
        setCurrentIndex(0);
        setScore(0);
        setGuess("");
        setGameOver(false);
        setLastCorrectAnswer(null);
    };

    const backToMenu = () => {
        setGameStarted(false);
        setImagesLoaded(false);
        setShuffledImages([]);
        setCurrentPool([]);
        setCurrentIndex(0);
        setGuess("");
        setScore(0);
        setGameOver(false);
        setLastCorrectAnswer(null);
    };

    if (loadingJson) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
                <h1 className="text-xl font-bold">
                    Loading towers metadata...
                </h1>
            </div>
        );
    }

    if (!gameStarted) {
        const defaultCount = (allData?.defaultImages || []).length;
        const pomCount = (allData?.pomImages || []).length;

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
                <Card className="w-full max-w-md mx-auto text-center p-6 bg-gray-800 rounded-2xl shadow-lg">
                    <CardContent>
                        <h1 className="text-xl font-bold mb-4">
                            Guess the EToH Tower
                        </h1>

                        <label className="flex items-center justify-between mb-4 w-full">
                            <div className="text-left">
                                <div className="font-semibold">
                                    Include Pit of Misery
                                </div>
                                <div className="text-sm opacity-80">
                                    {pomCount} towers
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={includePoM}
                                onChange={(e) =>
                                    setIncludePoM(e.target.checked)
                                }
                                className="h-5 w-5"
                                aria-label="Include Pit of Misery towers"
                            />
                        </label>

                        <Button onClick={startGame} className="w-full mb-3">
                            Start Game
                        </Button>

                        <div className="text-sm opacity-80">
                            Tip: type the acronym (e.g.{" "}
                            <span className="font-semibold">ToM</span>) or full
                            tower name.
                        </div>
                        <div className="text-sm opacity-80 mt-2">
                            {defaultCount} towers available
                            {includePoM
                                ? ` + ${pomCount} PoM towers`
                                : ""} ={" "}
                            {defaultCount + (includePoM ? pomCount : 0)} total
                        </div>
                        <a
                            className="text-xl opacity-100 mt-4"
                            href="https://etohguessr.vercel.app/"
                        >
                            THE URL IS https://etohguessr.vercel.app/
                        </a>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (gameStarted && !imagesLoaded) {
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

                            {shuffledImages[currentIndex] && (
                                <div className="flex flex-col items-center mb-4 w-full">
                                    <div className="w-full flex flex-col justify-center items-center">
                                        <TransformWrapper
                                            initialScale={1}
                                            minScale={1}
                                            maxScale={5}
                                            centerOnInit={true}
                                        >
                                            {({
                                                resetTransform,
                                                zoomIn,
                                                zoomOut,
                                            }) => (
                                                <>
                                                    <TransformComponent>
                                                        <img
                                                            src={
                                                                shuffledImages[
                                                                    currentIndex
                                                                ].url
                                                            }
                                                            alt="tower"
                                                            className="mx-auto rounded-xl object-contain max-h-64 w-full"
                                                        />
                                                    </TransformComponent>
                                                    <div className="flex gap-2 justify-center mt-2">
                                                        <Button
                                                            onClick={() =>
                                                                zoomIn()
                                                            }
                                                        >
                                                            +
                                                        </Button>
                                                        <Button
                                                            onClick={() =>
                                                                zoomOut()
                                                            }
                                                        >
                                                            -
                                                        </Button>
                                                        <Button
                                                            onClick={() =>
                                                                resetTransform()
                                                            }
                                                        >
                                                            Reset
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </TransformWrapper>
                                    </div>
                                </div>
                            )}

                            <input
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && checkGuess()
                                }
                                className="w-full p-2 mb-3 text-black rounded"
                                placeholder="Type your guess and press Enter or Submit..."
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
                            <a
                                className="text-xl opacity-100 mt-4"
                                href="https://etohguessr.vercel.app/"
                            >
                                THE URL IS https://etohguessr.vercel.app/
                            </a>
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
                            <Button onClick={backToMenu} className="w-full">
                                Back to Menu
                            </Button>
                            <a
                                className="text-xl opacity-100 mt-4"
                                href="https://etohguessr.vercel.app/"
                            >
                                THE URL IS https://etohguessr.vercel.app/
                            </a>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
