import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("review app missing #root");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.DEV) {
  void import("./dev-mock.ts").then((mod) => {
    const el = document.getElementById("edges-review-payload");
    if (el && (el.textContent ?? "").trim() === "{}") {
      el.textContent = JSON.stringify(mod.mockPayload);
    }
  });
}
