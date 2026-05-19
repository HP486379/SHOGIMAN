import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './extra.css';
import './unitIcons.css';
import './battlefield.css';
import './unitGuide.css';
import './checkEffects.css';
import './uxFixes.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
