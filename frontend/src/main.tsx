import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import './index.css';
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const sessionId = localStorage.getItem('sessionId');
  
  if (sessionId) {
    init = init || {};
    init.headers = init.headers || {};
    
    if (init.headers instanceof Headers) {
      init.headers.set('X-Session-ID', sessionId);
    } else if (Array.isArray(init.headers)) {
      init.headers.push(['X-Session-ID', sessionId]);
    } else {
      init.headers['X-Session-ID'] = sessionId;
    }
  }
  
  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
