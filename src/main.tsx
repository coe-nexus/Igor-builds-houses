import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { useDayStore } from "./lib/dayStore";
import "./styles/theme.css";
import "./styles/base.css";

// A per-model shell page (/64/, /96/ ...) carries its route in a meta tag: land on the hash route.
const shellRoute = document.querySelector<HTMLMetaElement>('meta[name="kiver:route"]')?.content;
if (shellRoute && !window.location.hash) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${shellRoute}`);

document.documentElement.lang = useDayStore.getState().lang;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
