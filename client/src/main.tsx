import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "animate.css";

// Add Remix Icon CSS
const remixIconLink = document.createElement("link");
remixIconLink.rel = "stylesheet";
remixIconLink.href = "https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css";
document.head.appendChild(remixIconLink);

// Add title
const titleElement = document.createElement("title");
titleElement.textContent = "Sistema Integrado de Gestión Documental y Mantenimiento";
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
