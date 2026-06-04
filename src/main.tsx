import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import GuestView from './GuestView.tsx';
import './index.css';

// Simple hash-based routing: #/guest → GuestView, everything else → Admin App
const isGuestView = window.location.hash.startsWith('#/guest');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isGuestView ? <GuestView /> : <App />}
  </StrictMode>,
);
