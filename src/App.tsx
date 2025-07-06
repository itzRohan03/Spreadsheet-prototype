import { useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';
import Spreadsheet from './components/Spreadsheet'; // Adjust path if needed

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Spreadsheet />
    </div>
  );
}

export default App;