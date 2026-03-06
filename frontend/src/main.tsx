import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import GameController from './components/GameController';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <GameController />
    </React.StrictMode>
);
