import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { preloadWelcomeImages } from './utils/preloadWelcomeImages';

// Précharge les visuels d'accueil avant le premier rendu React
preloadWelcomeImages('high');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
