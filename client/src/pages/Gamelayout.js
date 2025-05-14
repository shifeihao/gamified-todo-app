// Redesigned GameLayout.jsx with Tailwind CSS
import React, { useState, useEffect, useMemo } from 'react';
import DungeonTest from './DungeonTest';
import InventoryShopPage from './InventoryShopPage';
import axios from 'axios';
import { getUserStats, getAvailableClasses, selectClass } from '../services/characterService';
import { computeTotalStats } from '../components/game/EquipmentPanel';
import { getUserEquipment } from "../services/inventoryShopService";

const PAGES = {
  DUNGEON: 'dungeon',
  INVENTORY: 'inventory'
};

const GameLayout = () => {
  const [currentPage, setCurrentPage] = useState(PAGES.DUNGEON);
  const [gold, setGold] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [selectedGender, setSelectedGender] = useState('male');

  // Get token
  const token = userInfo?.token || null;
  
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const parsed = JSON.parse(storedUserInfo);
      setUserInfo(parsed);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    getUserEquipment(token).then(data => setEquipment(data));
  }, [token]);

  // Initialize user data
  useEffect(() => {
    const initializeUser = async () => {
      if (!token) {
        setError('Please log in first');
        setLoading(false);
        return;
      }

      try {
        // Get user stats
        const stats = await getUserStats(token);
        console.log('User stats:', stats);
        
        setUserStats({
          ...stats,
          skills: stats.skills || []
        });
        
        // If user has no class, get available classes
        if (!stats.hasClass) {
          console.log('User needs to select class, getting available classes');
          setIsSelecting(true);
          const classData = await getAvailableClasses(token);
          setClasses(classData.classes);
        }
        
        // Get user gold
        try {
          const res = await axios.get('/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setGold(res.data.gold || 0);
        } catch (profileErr) {
          console.error('Failed to get user profile:', profileErr);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize user data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (userInfo?.token) {
      initializeUser();
    }
  }, [userInfo?.token]);
  
  // Select class
  const handleClassSelect = async (classSlug) => {
    try {
      setLoading(true);
      // Send selected class and gender to backend
      const result = await selectClass(token, classSlug, selectedGender);
      setUserStats({ 
        ...userStats,
        ...result.class,
        hasClass: true,
        gender: selectedGender, // Save selected gender
        baseStats: result.class.baseStats || userStats.baseStats 
      });
      setIsSelecting(false);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  // Refresh gold
  const refreshGold = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGold(res.data.gold || 0);
    } catch (err) {
      console.error('Failed to refresh gold:', err);
    }
  };

  const fetchEquipment = async () => {
    if (!token) return;
    try {
      const equipData = await getUserEquipment(token);
      setEquipment(equipData);
    } catch (err) {
      console.error('Failed to fetch equipment', err);
    }
  };

  const bonusStats = useMemo(() => {
    return equipment ? computeTotalStats(equipment?.slots) : { hp: 0, attack: 0, defense: 0, magicPower: 0, speed: 0, critRate: 0, evasion: 0 }
  }, [equipment]);

  const effectiveBaseStats = useMemo(() => {
    const base = userStats?.baseStats || {}
    return Object.fromEntries(
      Object.entries(base).map(([key, val]) => [
        key,
        val + (bonusStats[key] || 0)
      ])
    )
  }, [userStats?.baseStats, bonusStats])

  // Show loading
  if (loading && !userStats) {
    return (
      <div className="min-h-screen bg-[#2c1810] text-[#e0e0e0] font-mono">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-white/30 border-t-[#ffa726] rounded-full animate-spin mx-auto mb-5"></div>
            <p className="text-white">Loading game...</p>
          </div>
        </div>
      </div>
    );
  }

  // Class selection interface
  if (isSelecting && classes.length > 0) {
    return (
      <div className="min-h-screen bg-[#2c1810] text-[#e0e0e0] font-mono">
        <nav className="bg-[#4c2a85] border-b-4 border-[#6a3bab] py-3">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white">TaskMasters</h1>
              <span className="text-xs text-[#b89be6]">Select Class</span>
            </div>
          </div>
        </nav>
        
        <div className="px-5 py-10 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl mb-2">🧙‍♂️ Choose Your Class</h2>
            <p className="text-lg text-[#b89be6] mb-8">Select a class and gender to begin your adventure:</p>
            
            {/* Gender selection */}
            <div className="flex items-center justify-center gap-5 mb-5">
              <label className="text-base font-bold">Select Gender:</label>
              <div className="flex gap-2">
                <button
                  className={`flex items-center gap-2 px-5 py-2 bg-[#3a1f6b] border-2 border-[#5d3494] rounded-lg text-[#e0e0e0] cursor-pointer font-mono transition-all duration-300 hover:bg-[#5d3494] hover:-translate-y-0.5 ${
                    selectedGender === 'male' ? 'bg-[#7e4ab8] border-[#9866d4] shadow-[0_0_10px_rgba(126,74,184,0.5)]' : ''
                  }`}
                  onClick={() => setSelectedGender('male')}
                >
                  <span className="text-xl">👨</span>
                  <span>Male</span>
                </button>
                <button
                  className={`flex items-center gap-2 px-5 py-2 bg-[#3a1f6b] border-2 border-[#5d3494] rounded-lg text-[#e0e0e0] cursor-pointer font-mono transition-all duration-300 hover:bg-[#5d3494] hover:-translate-y-0.5 ${
                    selectedGender === 'female' ? 'bg-[#7e4ab8] border-[#9866d4] shadow-[0_0_10px_rgba(126,74,184,0.5)]' : ''
                  }`}
                  onClick={() => setSelectedGender('female')}
                >
                  <span className="text-xl">👩</span>
                  <span>Female</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* 2x2 grid layout */}
          <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
            {classes.map((characterClass) => (
              <div
                key={characterClass.slug}
                className="bg-[#3a1f6b] border-3 border-[#5d3494] rounded-xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col h-full hover:bg-[#5d3494] hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40 hover:shadow-[0_0_20px_rgba(126,74,184,0.3)] hover:border-[#7e4ab8]"
                onClick={() => handleClassSelect(characterClass.slug)}
              >
                {/* Class avatar */}
                <div className="text-center mb-5">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#4c2a85] border-3 border-[#7e4ab8] flex items-center justify-center overflow-hidden">
                    {characterClass.images && characterClass.images[selectedGender] ? (
                      <img 
                        src={`/icon/characters/${characterClass.images[selectedGender].avatar}`}
                        alt={`${characterClass.name} ${selectedGender}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">
                        {characterClass.slug === 'warrior' && '⚔️'}
                        {characterClass.slug === 'mage' && '🔮'}
                        {characterClass.slug === 'archer' && '🏹'}
                        {characterClass.slug === 'rogue' && '🗡️'}
                        {!['warrior', 'mage', 'archer', 'rogue'].includes(characterClass.slug) && '👤'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-white text-2xl font-bold m-0">{characterClass.name}</h3>
                </div>
                
                <p className="text-[#b89be6] text-sm text-center leading-relaxed m-0 mb-5 flex-grow">
                  {characterClass.description || 'A brave adventurer'}
                </p>
                
                {/* Base stats - show all 7 stats */}
                <div className="mb-5">
                  <h4 className="text-white text-base m-0 mb-4 text-center">Base Stats:</h4>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">❤️ HP</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.hp || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">⚔️ Attack</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.attack || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">🛡️ Defense</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.defense || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">✨ Magic</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.magicPower || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">💨 Speed</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.speed || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">💥 Crit</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.critRate || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs col-span-2">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">👻 Evasion</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.evasion || 0}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Default skills */}
                <div className="mb-5">
                  <h4 className="text-white text-base m-0 mb-4 text-center">Initial Skills:</h4>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {characterClass.skills && characterClass.skills.length > 0 ? (
                      characterClass.skills.map((skill) => (
                        <div 
                          key={skill.id} 
                          className="w-11 h-11 bg-[#4c2a85] border-2 border-[#7e4ab8] rounded-lg flex items-center justify-center cursor-pointer relative transition-all duration-300 overflow-hidden hover:bg-[#7e4ab8] hover:scale-110 hover:shadow-lg hover:shadow-black/30 group"
                        >
                          {skill.icon ? (
                            <img 
                              src={`/icon/skills/${skill.icon}.png`}
                              alt={skill.name}
                              className="w-7 h-7 object-cover"
                            />
                          ) : (
                            <span className="text-xl">✨</span>
                          )}
                          <div className="absolute bottom-[-80px] left-1/2 transform -translate-x-1/2 bg-[#2c1810] border-2 border-[#ffa726] rounded-lg px-3 py-2 whitespace-nowrap opacity-0 pointer-events-none transition-all duration-300 z-10 shadow-lg shadow-black/30 min-w-[200px] group-hover:opacity-100 group-hover:bottom-[-90px]">
                            <div className="text-[#ffa726] font-bold text-sm text-center">{skill.name}</div>
                            <div className="text-white text-xs max-w-[200px] whitespace-normal leading-normal mt-1 text-center">{skill.description}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[#888] text-xs text-center py-2">No skill information available</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#ffa726] text-[#2c1810] px-6 py-3 rounded-lg text-center font-bold text-base transition-all duration-300 mt-auto hover:bg-[#ffca60] hover:shadow-lg hover:shadow-[#ffa726]/30">
                  Select Class
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // Main game interface
  return (
    <div className="min-h-screen bg-[#2c1810] font-mono text-[#e0e0e0]">
      {/* Top navigation bar */}
      <nav className="bg-[#4c2a85] border-b-4 border-[#6a3bab] py-3 shadow-lg shadow-black/30">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold text-white shadow-[2px_2px_0px_#2c1810]">TaskMasters</h1>
            <span className="text-xs text-[#b89be6] font-normal">Game Mode</span>
          </div>
          
          <div className="flex gap-2 bg-[#3a1f6b] p-1 rounded-lg border-2 border-[#5d3494]">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono font-medium text-sm transition-all duration-200 ${
                currentPage === PAGES.DUNGEON
                  ? 'bg-[#7e4ab8] text-white shadow-[inset_0_0_0_2px_#9866d4,_0_4px_8px_rgba(0,0,0,0.2)]'
                  : 'bg-transparent text-[#b89be6] hover:bg-[#5d3494] hover:text-white hover:-translate-y-px'
              }`}
              onClick={() => setCurrentPage(PAGES.DUNGEON)}
            >
              <div className="text-base">⚔️</div>
              <span className="whitespace-nowrap">Dungeon Exploration</span>
            </button>
            
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono font-medium text-sm transition-all duration-200 ${
                currentPage === PAGES.INVENTORY
                  ? 'bg-[#7e4ab8] text-white shadow-[inset_0_0_0_2px_#9866d4,_0_4px_8px_rgba(0,0,0,0.2)]'
                  : 'bg-transparent text-[#b89be6] hover:bg-[#5d3494] hover:text-white hover:-translate-y-px'
              }`}
              onClick={() => setCurrentPage(PAGES.INVENTORY)}
            >
              <div className="text-base">🎒</div>
              <span className="whitespace-nowrap">Inventory Shop</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#ffa726] rounded-lg px-3 py-2 text-[#2c1810] font-bold text-sm border-2 border-[#ff8f00] shadow-md shadow-black/20">
              <span className="text-base">💰</span>
              <span>{gold}</span>
            </div>
            {userInfo && (
              <div className="flex items-center gap-2 bg-[#5d3494] rounded-lg px-3 py-2 border-2 border-[#7e4ab8] shadow-md shadow-black/20">
                <div className="w-6 h-6 rounded bg-[#7e4ab8] flex items-center justify-center text-sm border border-[#9866d4]">👤</div>
                <span className="text-xs font-medium text-[#e0e0e0]">{userInfo.username}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Character status bar - always visible */}
      {userStats?.hasClass && (
        <div className="bg-[#f5f5f5] border-b-3 border-[#7e4ab8] py-3 text-[#2c1810] shadow-md shadow-black/10">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#4c2a85] rounded-lg flex items-center justify-center text-2xl border-2 border-[#5d3494] text-white">
                {userStats.slug === 'warrior' && '⚔️'}
                {userStats.slug === 'mage' && '🔮'}
                {userStats.slug === 'archer' && '🏹'}
                {userStats.slug === 'cleric' && '✨'}
              </div>
              
              <div>
                <h3 className="text-lg font-bold m-0">{userStats.name}</h3>
                <p className="text-sm text-[#666] m-0 mt-1">
                  DungeonLevel: {userStats.level || 1} | EXP: {userStats.exp || 0}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc]">
                <span className="block text-xs text-[#666] font-medium">HP</span>
                <span className="block text-base font-bold text-[#333] mt-0.5">{(userStats.baseStats?.hp || 100) + (bonusStats.hp || 0)}</span>
              </div>
              <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc]">
                <span className="block text-xs text-[#666] font-medium">ATK</span>
                <span className="block text-base font-bold text-[#333] mt-0.5">{(userStats.baseStats?.attack || 10) + (bonusStats.attack || 0)}</span>
              </div>
              <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc]">
                <span className="block text-xs text-[#666] font-medium">DEF</span>
                <span className="block text-base font-bold text-[#333] mt-0.5">{(userStats.baseStats?.defense || 5) + (bonusStats.defense || 0)}</span>
              </div>
              <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc]">
                <span className="block text-xs text-[#666] font-medium">MAG</span>
                <span className="block text-base font-bold text-[#333] mt-0.5">{(userStats.baseStats?.magicPower || 0) + (bonusStats.magicPower || 0)}</span>
              </div>
              <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc]">
                <span className="block text-xs text-[#666] font-medium">SPD</span>
                <span className="block text-base font-bold text-[#333] mt-0.5">{(userStats.baseStats?.speed || 0) + (bonusStats.speed || 0)}</span>
              </div>
              <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc]">
                <span className="block text-xs text-[#666] font-medium">CRIT</span>
                <span className="block text-base font-bold text-[#333] mt-0.5">{(userStats.baseStats?.critRate || 0) + (bonusStats.critRate || 0)}</span>
              </div>
              <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc]">
                <span className="block text-xs text-[#666] font-medium">EVA</span>
                <span className="block text-base font-bold text-[#333] mt-0.5">{(userStats.baseStats?.evasion || 0) + (bonusStats.critRate || 0)}</span>
              </div>
            </div>
            
            {userStats.unspentPoints > 0 && (
              <div className="flex items-center gap-2 bg-[#4caf50] text-white px-4 py-2 rounded-lg font-bold border-2 border-[#388e3c] shadow-md shadow-black/10">
                <span className="text-base">💪</span>
                <span className="text-sm">Available Stat Points: {userStats.unspentPoints}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <main className="min-h-[calc(100vh-200px)] bg-[#1a0f12] p-4">
        <div className={`mx-auto ${
          currentPage === PAGES.DUNGEON ? 'max-w-3xl' : 'max-w-6xl bg-[#f5f5f5] rounded-xl border-3 border-[#7e4ab8] p-4 text-[#2c1810]'
        }`}>
          {currentPage === PAGES.DUNGEON && (
            <DungeonTest 
              userStats={{
                ...userStats,
                baseStats: effectiveBaseStats
              }}
              onGoldUpdate={refreshGold}
              gold={gold}
            />
          )}
          {currentPage === PAGES.INVENTORY && (
            <InventoryShopPage onEquipmentChange={fetchEquipment} />
          )}
        </div>
      </main>

      {/* Responsive design */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .status-container {
            flex-direction: column;
            gap: 12px;
          }
          
          .character-stats {
            flex-wrap: wrap;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            gap: 12px;
            padding: 0 12px;
          }
          
          .nav-tabs {
            order: 2;
            width: 100%;
            justify-content: center;
          }
          
          .brand {
            order: 1;
            text-align: center;
          }
          
          .user-section {
            order: 3;
            width: 100%;
            justify-content: center;
          }
          
          .tab-label {
            display: none;
          }
          
          .character-stats {
            gap: 8px;
          }
          
          .stat-item {
            padding: 4px 8px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default GameLayout;