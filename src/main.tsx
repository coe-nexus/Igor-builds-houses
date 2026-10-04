import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { useDayStore } from "./lib/dayStore";
import "./styles/theme.css";
import "./styles/base.css";

document.documentElement.lang = useDayStore.getState().lang;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
