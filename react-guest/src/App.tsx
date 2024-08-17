import { useEffect, useState } from "react";

function App() {
  const [value, setValue] = useState(-1);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // listen for the response
    window.addEventListener("Current value is", handleValue, { signal });

    // ask
    const event = new Event("What is the current value?");
    window.dispatchEvent(event);

    return () => controller.abort();
  }, []);

  function handleValue(event: Event) {
    setValue((event as CustomEvent).detail);
  }

  return (
    <div style={{ border: "1px solid blue", margin: "16px", padding: "16px" }}>
      <p>React Guest</p>
      <p>Value: {value}</p>
    </div>
  );
}

export default App;
