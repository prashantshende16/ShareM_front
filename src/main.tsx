import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// ErrorWatch Client Integration Listener
window.addEventListener("error", (event) => {
  fetch("http://127.0.0.1:8000/api/v1/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ErrorWatch-Key": "ew_client_4JZ0mGc1UB1Py26ZVxQRIGtPDKPQXTP"
    },
    body: JSON.stringify({
      exception: {
        type: event.error?.name || "Error",
        message: event.message || "Unhandled error",
        stacktrace: [
          { filename: event.filename, lineno: event.lineno, colno: event.colno, function: "window.onerror", in_app: true }
        ]
      },
      environment: "staging",
      release: "1.0.0"
    })
  }).catch(() => {
    // Silence error reporter network failures
  });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
