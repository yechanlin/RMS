
import React, { useState } from 'react';
import CareerFlowDiagram from './components/CareerFlowDiagram';
import LandingPage from './LandingPage';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = () => { // email, password
    // For demo, just log in any user
    setLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      {loggedIn ? (
        <CareerFlowDiagram />
      ) : (
        <LandingPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;

/*
import React from 'react';

import CareerFlowDiagram from './components/CareerFlowDiagram';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <CareerFlowDiagram/>
    </div>
  );
}

export default App;
 */