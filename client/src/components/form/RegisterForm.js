import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

export const RegisterForm = ({ isEmbedded = false }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('The passwords you entered twice do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      await register(username, email, password);
      navigate('/tasks');
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Registration failed, please try again later'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = isEmbedded
    ? 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
    : 'form-input';

  const labelClasses = isEmbedded
    ? 'block text-gray-300 font-medium mb-2'
    : 'block text-gray-700 font-medium mb-2';

  const buttonClasses = isEmbedded
    ? 'w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors duration-200'
    : 'btn-primary w-full';

  return (
    <div>
      {error && (
        <div className={`px-4 py-3 rounded mb-4 ${
          isEmbedded 
            ? 'bg-red-900/50 border border-red-500/50 text-red-200'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className={labelClasses}>
            Username
          </label>
          <input
            type="text"
            id="username"
            className={inputClasses}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Please enter your username"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className={labelClasses}>
            Mail
          </label>
          <input
            type="email"
            id="email"
            className={inputClasses}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Please enter your email"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className={labelClasses}>
            Password
          </label>
          <input
            type="password"
            id="password"
            className={inputClasses}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Please enter your password(at least 6 characters)"
            required
            minLength={6}
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className={labelClasses}>
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            className={inputClasses}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Please confirm your password"
            required
            minLength={6}
          />
        </div>
        
        <button
          type="submit"
          className={buttonClasses}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};