import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AudioPlayerProvider } from "./context/AudioPlayerContext";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <LanguageProvider>
        <AudioPlayerProvider>
          <App />
        </AudioPlayerProvider>
      </LanguageProvider>
    </React.StrictMode>
  );
}
