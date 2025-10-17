import React, { useState } from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';

const SocialButton = ({ icon: Icon, text, onClick, bgColor, hoverColor }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full ${bgColor} ${hoverColor} text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2`}
  >
    <Icon className="text-xl" />
    <span>Continue with {text}</span>
  </button>
);

export default function LandingPage({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    if (isRegistering) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      // Add registration logic here
    }
    
    setError('');
    onLogin(email, password, isRegistering);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0a2540 50%, #2563eb 100%)',
    }}>
      <div className="flex flex-col items-center w-full">
        <div className="bg-gray-800 shadow-2xl rounded-2xl p-10 w-full max-w-md border border-blue-900">
          <h1 className="text-4xl font-semibold text-blue-400 mb-2 text-center tracking-tight drop-shadow">RMS</h1>
          <p className="text-blue-200 mb-8 text-center text-lg">Build your career story visually and easily.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-blue-200 mb-1 font-medium">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 bg-gray-900 text-blue-100 border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-400"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-blue-200 mb-1 font-medium">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 bg-gray-900 text-blue-100 border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-400"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {isRegistering && (
              <div>
                <label className="block text-blue-200 mb-1 font-medium">Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 bg-gray-900 text-blue-100 border border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-400"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}
            {error && <div className="text-red-400 text-sm text-center font-semibold">{error}</div>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-2 rounded-lg shadow-lg transition-colors text-lg"
            >
              {isRegistering ? 'Create Account' : 'Log In with Email'}
            </button>
          </form>
            
          <div className="my-6 flex items-center justify-between">
            <div className="w-full border-t border-blue-800"></div>
            <span className="px-4 text-blue-400 text-sm">OR</span>
            <div className="w-full border-t border-blue-800"></div>
          </div>

          <div className="space-y-3">
            <SocialButton
              icon={FaGoogle}
              text="Google"
              onClick={() => {/* Implement Google OAuth */}}
              bgColor="bg-gray-900"
              hoverColor="hover:bg-red-700"
            />
            <SocialButton
              icon={FaGithub}
              text="GitHub"
              onClick={() => {/* Implement GitHub OAuth */}}
              bgColor="bg-gray-900"
              hoverColor="hover:bg-gray-950"
            />
          </div>
          
          <div className="mt-6 text-center">
            <span className="text-blue-300">
              {isRegistering ? 'Already have an account? ' : 'Don\'t have an account? '}
            </span>
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
            >
              {isRegistering ? 'Log in' : 'Create one'}
            </button>
          </div>
        </div>
        <footer className="mt-8 text-blue-400 text-xs text-center">&copy; {new Date().getFullYear()} ResumeBuilder</footer>
      </div>
    </div>
  );
}
