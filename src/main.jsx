import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { BrowserRouter as Router } from 'react-router-dom';
    import App from '@/App';
    import '@/index.css';
    import { ThemeProvider } from '@/contexts/ThemeContext';
    import { AuthProvider } from '@/contexts/SupabaseAuthContext';
    import { register } from '@/registerServiceWorker';
    
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeProvider defaultTheme="dark" storageKey="neuro-apice-theme">
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </React.StrictMode>
    );
    
    register();