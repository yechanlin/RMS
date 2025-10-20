
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
      {/* <CareerFlowDiagram /> */}
    </div>
  );
}

export default App;