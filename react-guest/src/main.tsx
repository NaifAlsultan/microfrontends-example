import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

window.render_react_guest = (rootId: string) => {
  const root = document.getElementById(rootId);
  if (!root) {
    console.error(`Unable to find root with ID: ${rootId}`);
    return;
  }
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};
