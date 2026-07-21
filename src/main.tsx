import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ClipboardPopupApp } from "./features/clipboard";
import "./App.css";

const isClipboardPopup = window.location.hash === "#clip";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isClipboardPopup ? <ClipboardPopupApp /> : <App />}
  </React.StrictMode>,
);
