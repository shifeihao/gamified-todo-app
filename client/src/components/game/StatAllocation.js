import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Stat point conversion rates
const STAT_MULTIPLIERS = {
  hp: 15,
  attack: 1,
  defense: 1,
  magicPower: 1,
  speed: 0.5,
  critRate: 0.2,
  evasion: 0.2
};

// Stat names in English
const STAT_NAMES = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  magicPower: 'Magic',
  speed: 'Speed',
  critRate: 'Crit Rate',
  evasion: 'Evasion'
};

// Pixel-style stat background colors
const STAT_COLORS = {
  hp: '#4c2a85',
  attack: '#ff8f00',
  defense: '#5d3494',
  magicPower: '#7e4ab8',
  speed: '#9c27b0',
  critRate: '#e53935',
  evasion: '#00acc1'
};

const StatAllocation = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [allocation, setAllocation] = useState({});
  const [currentStats, setCurrentStats] = useState({});
  const [unspentPoints, setUnspentPoints] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Get token
  const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
  const token = userInfo?.token || null;
  
  // Load stat data
  useEffect(() => {
    const fetchStatData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/character/stat-allocation', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCurrentStats(response.data.assignedStats || {});
        setUnspentPoints(response.data.unspentPoints || 0);
        
        // Initialize allocation object
        const initialAllocation = {};
        Object.keys(STAT_MULTIPLIERS).forEach(stat => {
          initialAllocation[stat] = 0;
        });
        setAllocation(initialAllocation);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to get stat data:', err);
        setError('Failed to get stat data, please refresh and try again');
        setLoading(false);
      }
    };
    
    if (token) {
      fetchStatData();
    }
  }, [token]);
  
  // Calculate total allocated points
  const getTotalAllocated = () => {
    return Object.values(allocation).reduce((sum, value) => sum + (value || 0), 0);
  };
  
  // Increase stat points
  const handleIncrement = (stat) => {
    if (getTotalAllocated() < unspentPoints) {
      const newAllocation = {
        ...allocation,
        [stat]: (allocation[stat] || 0) + 1
      };
      setAllocation(newAllocation);
      setShowSubmit(true); // Show submit button
    }
  };
  
  // Decrease stat points
  const handleDecrement = (stat) => {
    if ((allocation[stat] || 0) > 0) {
      const newAllocation = {
        ...allocation,
        [stat]: (allocation[stat] || 0) - 1
      };
      setAllocation(newAllocation);
      
      // If no allocation points, hide submit button
      if (Object.values(newAllocation).every(value => value === 0)) {
        setShowSubmit(false);
      }
    }
  };
  
  // Submit allocation
  const handleSubmit = async () => {
    try {
      // Verify if there are allocation points
      if (getTotalAllocated() <= 0) {
        setError('Please allocate at least 1 stat point');
        return;
      }
      
      setLoading(true);
      const response = await axios.post(
        '/api/character/allocate-stats',
        { allocation },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update state
      setCurrentStats(response.data.assignedStats);
      setUnspentPoints(response.data.unspentPoints);
      
      // Reset allocation
      const resetAllocation = {};
      Object.keys(allocation).forEach(stat => {
        resetAllocation[stat] = 0;
      });
      setAllocation(resetAllocation);
      setShowSubmit(false);
      
      setSuccess('Stat points allocated successfully!');
      setTimeout(() => {
        setSuccess(null);
        if (response.data.unspentPoints <= 0) {
          onClose(); // Auto close if no unspent points left
        }
      }, 1500);
      
      setLoading(false);
    } catch (err) {
      console.error('Stat allocation failed:', err);
      setError(err.response?.data?.error || 'Stat allocation failed, please try again');
      setLoading(false);
      setTimeout(() => setError(null), 3000);
    }
  };
  
  if (loading && Object.keys(currentStats).length === 0) {
    return (
      <div className="p-5 text-center bg-[#2c1810] rounded-xl text-[#e0e0e0]">
        <div className="text-2xl mb-2">⏳</div>
        <div>Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#3a1f6b] rounded-xl p-5 max-w-3xl mx-auto border-2 border-[#5d3494] text-[#e0e0e0] font-mono">
      <div className="flex justify-between items-center mb-5">
        <h2 className="m-0 text-white font-bold text-xl">Stat Point Allocation</h2>
        <div className="bg-[#4caf50] text-white px-3 py-2 rounded border-2 border-[#388e3c] font-bold">
          Available Points: {unspentPoints - getTotalAllocated()}
        </div>
      </div>
      
      {error && (
        <div className="bg-[#d32f2f] text-white p-2 rounded mb-4 border-2 border-[#b71c1c]">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-[#2e7d32] text-white p-2 rounded mb-4 border-2 border-[#1b5e20]">
          {success}
        </div>
      )}
      
      {/* Main stat grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {Object.keys(STAT_MULTIPLIERS).map(stat => (
          <div 
            key={stat} 
            className="p-3 rounded-lg relative border-2 border-white/10 text-white"
            style={{ backgroundColor: STAT_COLORS[stat] }}
          >
            <div className="text-sm font-bold">
              {STAT_NAMES[stat]}
            </div>
            <div className="font-bold text-lg mt-1 mb-1">
              {Math.round((currentStats[stat] || 0) * 10) / 10}
              {allocation[stat] > 0 && (
                <span className="text-[#81c784] ml-1">
                  +{Math.round((allocation[stat] * STAT_MULTIPLIERS[stat]) * 10) / 10}
                  {(stat === 'critRate' || stat === 'evasion') ? '%' : ''}
                </span>
              )}
            </div>
            
            {unspentPoints > 0 && (
              <div className="flex items-center mt-1">
                <button 
                  onClick={() => handleDecrement(stat)}
                  disabled={allocation[stat] <= 0}
                  className={`w-6 h-6 flex items-center justify-center font-mono font-bold text-white border-none rounded transition-all duration-200 ${
                    allocation[stat] <= 0 
                      ? 'bg-[#666] cursor-not-allowed opacity-50' 
                      : 'bg-[#f44336] cursor-pointer hover:bg-[#d32f2f]'
                  }`}
                >
                  -
                </button>
                <div className="mx-2 w-6 text-center font-bold bg-[#2c1810] rounded py-0.5">
                  {allocation[stat] || 0}
                </div>
                <button 
                  onClick={() => handleIncrement(stat)}
                  disabled={getTotalAllocated() >= unspentPoints}
                  className={`w-6 h-6 flex items-center justify-center font-mono font-bold text-white border-none rounded transition-all duration-200 ${
                    getTotalAllocated() >= unspentPoints 
                      ? 'bg-[#666] cursor-not-allowed opacity-50' 
                      : 'bg-[#4caf50] cursor-pointer hover:bg-[#388e3c]'
                  }`}
                >
                  +
                </button>
                <div className="text-xs text-[#b89be6] ml-2">
                  (1pt = {STAT_MULTIPLIERS[stat]}{(stat === 'critRate' || stat === 'evasion') ? '%' : ''})
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Submit button */}
      {showSubmit && (
        <div className="text-center mt-5">
          <button 
            onClick={handleSubmit}
            disabled={getTotalAllocated() <= 0 || loading}
            className="bg-[#2196f3] text-white border-2 border-[#1976d2] rounded px-6 py-2 text-base cursor-pointer font-bold font-mono transition-all duration-200 hover:bg-[#1976d2] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Confirm Allocation'}
          </button>
        </div>
      )}
      
      <div className="text-center mt-5">
        <button 
          onClick={onClose}
          className="bg-[#757575] text-white border-2 border-[#616161] rounded px-5 py-2 cursor-pointer font-mono font-bold transition-all duration-200 hover:bg-[#616161] hover:-translate-y-px"
        >
          Return to Game
        </button>
      </div>
    </div>
  );
};

export default StatAllocation;