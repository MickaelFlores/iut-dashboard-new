import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Console log pour le développement
if (process.env.NODE_ENV === 'development') {
  console.log('🎓 IUT Dashboard Frontend démarré');
  console.log('📡 Backend:', process.env.REACT_APP_API_URL || 'http://localhost:3001');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Performance monitoring (optionnel)
if (process.env.NODE_ENV === 'production') {
  // Ici vous pourriez ajouter des outils comme Web Vitals
  const reportWebVitals = (metric) => {
    console.log('📊 Web Vital:', metric);
  };
  
  // Uncomment si vous installez web-vitals
  // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
  // getCLS(reportWebVitals);
  // getFID(reportWebVitals);
  // getFCP(reportWebVitals);
  // getLCP(reportWebVitals);
  // getTTFB(reportWebVitals);
}