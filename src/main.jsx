import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './redux/store.js';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditorPanel from './pages/Editor.jsx';
import SavedDesignsPage from './pages/SavedDesigns.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<EditorPanel />} />
          <Route path="/saved-designs" element={<SavedDesignsPage />} />
        </Routes>
      </Router>
    </Provider>
  </StrictMode>
);




