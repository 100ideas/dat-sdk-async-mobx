import React from "react";
import ReactDOM from "react-dom";

// import { DatComponent } from "./Dat";
import { DatComponent } from "./DatPromise";

import "./styles.css";

function App() {
  return (
    <div className="App">
      <div className="Header">
        <h1>Hello CodeSandbox</h1>
        <h2>Start editing to see some magic happen!</h2>
      </div>
      <hr />
      <DatComponent />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
