import { Link } from "react-router-dom";
import { MicroFrontend } from "./MicroFrontend";

function App() {
  return (
    <div
      style={{ border: "1px dashed black", margin: "16px", padding: "16px" }}
    >
      <p>React Host</p>
      <Link to="/some-other-route">Navigate Forward</Link>
      <MicroFrontend
        id="react_guest"
        mainSource="http://localhost:8002/assets/index-DqZzPsFQ.js"
      />
      <MicroFrontend
        id="angular_guest"
        mainSource="http://localhost:8003/main-DHUQKNTD.js"
        supportSources={["http://localhost:8003/polyfills-SCHOHYNV.js"]}
      />
    </div>
  );
}

export default App;
