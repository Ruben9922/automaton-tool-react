/* eslint-disable react/jsx-filename-extension */
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { enableMapSet } from "immer";
import App from "./component/App";
import reportWebVitals from "./reportWebVitals";

// Enable support for native Map and Set in Immer
enableMapSet();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root"),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
