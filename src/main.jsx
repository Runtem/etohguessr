import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ImageGuessGame from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ImageGuessGame />
    </StrictMode>
);