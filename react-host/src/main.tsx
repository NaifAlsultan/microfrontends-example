import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import { createBrowserRouter, Link, RouterProvider } from "react-router-dom";

createRoot(document.getElementById("react-host")!).render(
  <StrictMode>
    <RouterProvider
      router={createBrowserRouter([
        {
          path: "/",
          element: <App />,
        },
        {
          path: "/other",
          element: <Link to="/">Navigate Back</Link>,
        },
      ])}
    />
  </StrictMode>
);
