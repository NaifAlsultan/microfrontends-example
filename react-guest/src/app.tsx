import { useEffect, useState } from "react";

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

  return (
    <div style={{ border: "1px solid blue", margin: "16px", padding: "16px" }}>
      <p>React Guest</p>
      <p>Value: {value}</p>
    </div>
  );
}
