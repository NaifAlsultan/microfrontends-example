import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Microfrontend } from "./microfrontend";

export function App() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    window.addEventListener(
      "increment",
      (event) => setValue((event as CustomEvent).detail),
      { signal }
    );

    return () => controller.abort();
  }, []);

  function increment() {
    const event = new CustomEvent("increment", { detail: value + 1 });
    window.dispatchEvent(event);
  }

  return (
    <div
      style={{ border: "1px dashed black", margin: "16px", padding: "16px" }}
    >
      <p>React Host</p>
      <p>Value: {value}</p>
      <p>
        <button onClick={increment}>Increment</button>
      </p>
      <Link to="/other">Navigate Forward</Link>
      <Microfrontend src="http://localhost:5174/src/main.tsx" />
      <Microfrontend src="http://localhost:4200/remoteEntry.js" />
    </div>
  );
}
