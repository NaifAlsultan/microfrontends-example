import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

window.render_react_guest = (rootId: string) => {
  const root = document.getElementById(rootId);
  if (!root) {
    console.error(`Unable to find root with id: ${rootId}`);
    window.unmount_react_guest = undefined;
    return;
  }
  const app = ReactDOM.createRoot(root);
  app.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  window.unmount_react_guest = () => {
    app.unmount();
  };
};
