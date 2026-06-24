import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { GuestUserProvider } from './context/GuestUserContext';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GuestUserProvider>
        <App />
      </GuestUserProvider>
    </BrowserRouter>
  </StrictMode>,
);
