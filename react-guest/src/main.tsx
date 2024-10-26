import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";

export function mountMicrofrontend(root: HTMLElement) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

const root = document.getElementById("react-guest");

if (root) {
  mountMicrofrontend(root);
}
