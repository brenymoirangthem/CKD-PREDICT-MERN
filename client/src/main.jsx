import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <AuthProvider>
      <App />
      <Toaster
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#e2e8f0',
            border: '1px solid #334155',
          },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);