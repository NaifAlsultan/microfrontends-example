import { Link } from "react-router-dom";
import { MicroFrontend } from "./MicroFrontend";
import { useEffect, useState } from "react";

const reactGuest = {
  id: "react_guest",
  mainSource: "http://localhost:8002/assets/index-CYhDH8Pq.js",
};

const angularGuest = {
  id: "angular_guest",
  mainSource: "http://localhost:8003/main-WSKM47JJ.js",
  supportSources: ["http://localhost:8003/polyfills-SCHOHYNV.js"],
};

function App() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const event = new CustomEvent("Current value is", { detail: value });

    const controller = new AbortController();
    const { signal } = controller;

    // respond to explicit questions
    window.addEventListener(
      "What is the current value?",
      () => {
        window.dispatchEvent(event);
      },
      { signal }
    );

    // announce when the value changes
    window.dispatchEvent(event);

    return () => controller.abort();
  }, [value]);

  return (
    <div
      style={{ border: "1px dashed black", margin: "16px", padding: "16px" }}
    >
      <p>React Host</p>
      <p>Value: {value}</p>
      <p>
        <button onClick={() => setValue((value) => value + 1)}>
          Increment
        </button>
      </p>
      <Link to="/some-other-route">Navigate Forward</Link>
      <MicroFrontend {...reactGuest} />
      <MicroFrontend {...angularGuest} />
    </div>
  );
}

export default App;
