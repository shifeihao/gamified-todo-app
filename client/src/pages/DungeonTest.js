import React, { useState, useEffect, useRef } from 'react';
import { getShopItems, buyItem } from '../services/inventoryShopService.js';
import {
  enterDungeon,
  exploreCurrentFloor,
  summarizeExploration
} from '../services/dungeonTestService.js';
import axios from 'axios';
import StatAllocation from '../components/game/StatAllocation.js';
import CombatSystem from '../components/game/CombatSystem';

// Game states
const GAME_STATES = {
  IDLE: 'idle',
  ENTERING_DUNGEON: 'entering_dungeon',
  EXPLORING: 'exploring',
  COMBAT: 'combat',
  SHOP: 'shop',
  VICTORY: 'victory',
  STATS_ALLOCATION: 'stats_allocation'
};

// Set debug flag
const DEBUG = true;

// Shop interface component
const ShopInterface = ({ items, gold, onBuyItem, onLeaveShop }) => {
  return (
    <div className="p-5 bg-[#3a1f6b] rounded-xl border-2 border-[#5d3494] text-[#e0e0e0]">
      <h3 className="text-center text-white mb-4 font-bold text-lg">
        🛒 Merchant Shop
      </h3>
      
      <div className="flex justify-end mb-4">
        <div className="bg-[#ffb74d] p-2 rounded-md flex items-center shadow-lg text-[#2c1810] border-2 border-[#ff8f00] font-bold">
          <span className="mr-1">🪙</span>
          <span>{gold}</span>
        </div>
      </div>
      
      <div className="max-h-[300px] overflow-y-auto">
        {!Array.isArray(items) || items.length === 0 ? (
          <div className="text-center p-5 text-[#b89be6] bg-[#2c1810] rounded-lg border border-[#5d3494]">
            No items available in shop
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map(entry => (
              <div key={entry._id || `item-${Math.random()}`} 
                   className="border-2 border-[#5d3494] rounded-lg p-4 bg-[#2c1810] transition-all duration-200">
                <div className="flex">
                  <div className="w-12 h-12 bg-[#4c2a85] rounded-lg mr-4 flex items-center justify-center text-2xl border-2 border-[#7e4ab8]">
                    {entry.item?.icon ? '🔮' : '📦'}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold mb-1 text-white">
                      {entry.item?.name || 'Unknown Item'}
                    </div>
                    <div className="text-sm text-[#b89be6] mb-2">
                      {entry.item?.description || 'No description'}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-[#ffa726]">
                        {entry.price} Gold
                      </span>
                      <button 
                        onClick={() => onBuyItem(entry.item?._id, entry.price)}
                        className={`px-3 py-1.5 text-white border-none rounded-md font-mono font-bold transition-all duration-200 
                          ${gold >= entry.price 
                            ? 'bg-[#4caf50] cursor-pointer' 
                            : 'bg-[#666] cursor-not-allowed'}`}
                        disabled={gold < entry.price || !entry.item?._id}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button 
        onClick={onLeaveShop}
        className="mt-5 px-5 py-2.5 bg-[#ff9800] text-white border-none rounded-md cursor-pointer text-base font-mono font-bold block mx-auto border-2 border-[#f57800] transition-all duration-200 hover:bg-[#f57800] hover:-translate-y-px"
      >
        Leave Shop and Continue
      </button>
    </div>
  );
};

// Main component - Simplified
const DungeonTest = ({ userStats, onGoldUpdate, gold  }) => {
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [currentHp, setCurrentHp] = useState(userStats?.baseStats?.hp || 100);
  const [shopItems, setShopItems] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [playerStats, setPlayerStats] = useState({
      hp: userStats?.baseStats?.hp || 100,
      attack: userStats?.baseStats?.attack || 10,
      defense: userStats?.baseStats?.defense || 5,
      magicPower: userStats?.baseStats?.magicPower || 0,
      speed: userStats?.baseStats?.speed || 0,
      critRate: userStats?.baseStats?.critRate || 5,
      evasion: userStats?.baseStats?.evasion || 0
    });
    
  const [accumulatedDrops, setAccumulatedDrops] = useState({
      gold: 0,
      exp: 0,
      items: [],
      cards: []
    });
    
  useEffect(() => {
    if (userStats?.baseStats) {
      setPlayerStats(prev => {
        const newStats = {
          attack: userStats.baseStats.attack || 10,
          defense: userStats.baseStats.defense || 5,
          magicPower: userStats.baseStats.magicPower || 0,
          speed: userStats.baseStats.speed || 0,
          critRate: userStats.baseStats.critRate || 5,
          evasion: userStats.baseStats.evasion || 0
        };
        
        if (gameState === GAME_STATES.IDLE || prev.hp === undefined) {
          newStats.hp = userStats.baseStats.hp || 100;
          setCurrentHp(userStats.baseStats.hp || 100);
        } else {
          
          newStats.hp = prev.hp;
        }
        
        return newStats;
      });
    }
  }, [userStats, gameState]);
  
  // Reference variables
  const logsEndRef = useRef(null);
  const prevStateRef = useRef(null);
  const transitionInProgressRef = useRef(false);
  
  const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
  const token = userInfo?.token || null;

  // Scroll to bottom of logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  
  // State monitoring
  useEffect(() => {
    if (DEBUG) console.log(`Game state change: ${gameState}`);
    
    // Special handling when transitioning out of shop state
    if (gameState === GAME_STATES.EXPLORING && prevStateRef.current === GAME_STATES.SHOP) {
      if (DEBUG) console.log('Detected transition out of shop state');
      
      // Check if there are monsters waiting for combat but state didn't transition correctly
      if (monsters && monsters.length > 0) {
        if (DEBUG) console.log('Monsters waiting for combat but state not correctly transitioned, forcing combat state');
        setTimeout(() => {
          setGameState(GAME_STATES.COMBAT);
        }, 300);
      }
    }
    
    // Record previous state
    prevStateRef.current = gameState;
  }, [gameState, monsters]);

  // Initialize player stats
  useEffect(() => {
    if (userStats?.baseStats) {
      setPlayerStats({
        hp: userStats.baseStats.hp || 100,
        attack: userStats.baseStats.attack || 10,
        defense: userStats.baseStats.defense || 5,
        magicPower: userStats.baseStats.magicPower || 0,
        speed: userStats.baseStats.speed || 0,
        critRate: userStats.baseStats.critRate || 5,
        evasion: userStats.baseStats.evasion || 0
      });
    }
  }, [userStats]);

  // Load shop items
  const loadShopItems = async () => {
    try {
      console.log("Loading shop items...");
      const items = await getShopItems(token);
      console.log("Shop items loaded:", items);
      
      if (items) {
        setShopItems(Array.isArray(items) ? items : []);
      } else {
        setShopItems([]);
      }
    } catch (err) {
      console.error('Failed to load shop items:', err);
      setShopItems([]);
    }
  };

  // Buy shop item
  const handleBuyItem = async (itemId, price) => {
    try {
      // Check if gold is sufficient
      const res = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.gold < price) {
        alert('Insufficient gold!');
        return;
      }
      
      await axios.post(
        '/api/shop/buy', 
        { itemId }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update logs
      setLogs(prev => [...prev, `💰 Purchased ${shopItems.find(i => i.item._id === itemId)?.item.name || 'an item'}`]);
      
      // Notify parent component to update gold
      if (onGoldUpdate) {
        onGoldUpdate();
      }
    } catch (err) {
      alert(`Purchase failed: ${err.message}`);
    }
  };

  // Handle combat end
  const handleCombatEnd = async (result) => {
    console.log("Combat ended:", result);
  
    if (result.result === 'victory') {
      // Basic victory log
      setLogs(prev => [...prev, '🎯 Combat Victory!']);

      setCurrentHp(result.remainingHp);
      setPlayerStats(prev => ({
        ...prev,
        hp: result.remainingHp
      }));
      
      // If there are drop results, show drop information
      if (result.drops) {
        const { gold, exp, items, cards } = result.drops;

        setAccumulatedDrops(prev => ({
          gold: prev.gold + (gold || 0),
          exp: prev.exp + (exp || 0),
          items: [...prev.items, ...(items || [])],
          cards: [...prev.cards, ...(cards || [])]
        }));
        
        // Notify parent component to update gold
        if (gold > 0 && onGoldUpdate) {
          onGoldUpdate();
        }
        
        setLogs(prev => [...prev, '✨ Loot has been added to inventory']);
      }
      
      setPlayerStats(prev => ({
        ...prev,
        hp: result.remainingHp
      }));
      
      try {
        // Update post-combat state
        const updateResponse = await axios.post(
          '/api/dungeon/update-after-combat',
          { 
            result: 'victory', 
            remainingHp: result.remainingHp 
          },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        console.log('Post-combat state update:', updateResponse.data);
        
        // Handle level up and other updates
        if (updateResponse.data.logs && Array.isArray(updateResponse.data.logs)) {
          setLogs(prev => [...prev, ...updateResponse.data.logs]);
        }
        
        if (updateResponse.data.expGained) {
          setLogs(prev => [...prev, `✨ Gained ${updateResponse.data.expGained} experience`]);
        }

        if (updateResponse.data.levelUp) {
          setLogs(prev => [
            ...prev, 
            `🌟 Level up! From ${updateResponse.data.prevLevel || '?'} to ${updateResponse.data.currentLevel || updateResponse.data.newLevel || '?'}`
          ]);
          
          if (updateResponse.data.statPointsGained > 0) {
            setLogs(prev => [
              ...prev,
              `💪 Gained ${updateResponse.data.statPointsGained} stat points`
            ]);
          }
        }
        
        // Update floor
        if (updateResponse.data.nextFloor) {
          console.log(`Update floor: ${currentFloor} -> ${updateResponse.data.nextFloor}`);
          setCurrentFloor(updateResponse.data.nextFloor);
          setLogs(prev => [...prev, `🚪 You entered floor ${updateResponse.data.nextFloor}`]);
        }
        
        // Continue exploration
        setTimeout(() => {
          continueExploration();
        }, 1000);
      } catch (err) {
        console.error('Error updating combat result:', err);
        setTimeout(() => {
          continueExploration();
        }, 1000);
      }
    } else if (result.result === 'settlement') {
      // Handle when HP is 0
      setCurrentHp(0);
      setPlayerStats(prev => ({
        ...prev,
        hp: 0
      }));
      setLogs(prev => [...prev, '💀 You were defeated, auto settling...']);
      
      try {
        const summary = await summarizeExploration(token);
        setSummary(summary);
        setGameState(GAME_STATES.VICTORY);
      } catch (err) {
        console.error('Failed to get settlement info:', err);
      }
    }
  };
  // Simplified DungeonTest.jsx - Part 2 complete (Using Tailwind CSS)

  // Leave shop
  const handleLeaveShop = async () => {
    console.log('=== LEAVE SHOP START ===');
    setLogs(prev => [...prev, '🚶 Leaving shop and continuing exploration...']);
    
    // Mark transition in progress
    setShopItems([]);
    setGameState(GAME_STATES.EXPLORING);
    
    try {
      // Call leave shop API
      await axios.post(
        '/api/dungeon/shop-interaction', 
        { action: 'leave' }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Call continue API specifically designed for post-shop combat
      const continueResponse = await axios.post(
        '/api/dungeon/continue',
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log('Continue after shop response:', continueResponse.data);
      
      // Add this code: handle returned logs
      if (continueResponse.data.logs && Array.isArray(continueResponse.data.logs)) {
        console.log('Adding logs from response:', continueResponse.data.logs);
        setLogs(prev => [...prev, ...continueResponse.data.logs]);
      }
      
      // Update current floor
      if (continueResponse.data.currentFloor) {
        setCurrentFloor(continueResponse.data.currentFloor);
      }
      
      // Handle returned monster data
      if (continueResponse.data.monsters && 
          Array.isArray(continueResponse.data.monsters) && 
          continueResponse.data.monsters.length > 0) {
          
        console.log('Found monsters after shop, starting combat');
        setMonsters(continueResponse.data.monsters);
        
        // Delay to ensure UI update
        setTimeout(() => {
          setGameState(GAME_STATES.COMBAT);
        }, 300);
      } else {
        console.log('No monsters after shop, continuing exploration');
        continueExploration();
      }
    } catch (err) {
      console.error('Leave shop error:', err);
      setLogs(prev => [...prev, `❌ Error: ${err.message}`]);
      
      // Error recovery
      setTimeout(() => {
        setGameState(GAME_STATES.IDLE);
      }, 1000);
    }
    
    console.log('=== LEAVE SHOP END ===');
  };
  
  // Continue exploration after combat or shop
  const continueExploration = async () => {
    // If transition is in progress, avoid duplicate calls
    if (currentHp <= 0) {
      console.log('Player defeated, skipping exploration');
      return;
    }
    if (transitionInProgressRef.current) {
      if (DEBUG) console.log('Transition in progress, skipping continue exploration');
      return;
    }
      if (gameState === GAME_STATES.VICTORY) {
    console.log('Game already ended, skipping exploration');
    return;
  }
    
    try {
      if (DEBUG) console.log('Starting continue exploration process');
      
      // Set state to exploring
      setGameState(GAME_STATES.EXPLORING);
      
      // Call API to get exploration results
      const res = await exploreCurrentFloor(token);
    
      
      if (DEBUG) console.log('Exploration response:', res);
      
      // Handle combat logs
      if (res.logs && Array.isArray(res.logs)) {
        setLogs(prev => [...prev, ...res.logs]);
      }
      
      // Handle experience
      if (res.gainedExp) {
        setLogs(prev => [...prev, `✨ Gained ${res.gainedExp} experience`]);
      }
      
      // Update floor
      if (res.nextFloor) {
        setCurrentFloor(res.nextFloor);
      }
      
      // Handle monster combat - this is the key part
      if (res.monsters && Array.isArray(res.monsters) && res.monsters.length > 0) {
        if (DEBUG) console.log('Found monsters, setting combat state');
        setMonsters(res.monsters);
        
        // Use delay to ensure state updates correctly
        setTimeout(() => {
          if (DEBUG) console.log('Switching to combat UI');
          setGameState(GAME_STATES.COMBAT);
        }, 300);
        return;
      }
      
      // Handle shop events
      if (res.pause && res.eventType === 'shop') {
        if (DEBUG) console.log('Found shop event');
        await loadShopItems();
        
        // Use delay to ensure state updates correctly
        setTimeout(() => {
          if (DEBUG) console.log('Switching to shop UI');
          setGameState(GAME_STATES.SHOP);
        }, 300);
        return;
      }
      
      // Handle settlement
      if (res.result === 'completed') {
        setLogs(prev => [...prev, '🎉 Exploration completed!']);
        try {
          const summary = await summarizeExploration(token);
          setSummary(summary);
          setGameState(GAME_STATES.VICTORY);
        } catch (error) {
          console.error('Failed to get settlement info:', error);
        }
      } 
      // Handle defeat
      else if (res.result === 'defeat') {
        setLogs(prev => [...prev, '💀 You were defeated, auto settling...']);
        try {
          const summary = await summarizeExploration(token);
          setSummary(summary);
          setGameState(GAME_STATES.VICTORY);
        } catch (error) {
          console.error('Failed to get settlement info:', error);
        }
      } 
      // Handle continue exploration
      else if (res.result === 'continue') {
        // Recursively call itself to continue exploration
        setTimeout(() => {
          continueExploration();
        }, 500);
      }
    } catch (err) {
      console.error('Error during exploration:', err);
      setLogs(prev => [...prev, `❌ Error: ${err.message}`]);
    }
  };

  // Start exploration
  const startExploration = async () => {
    setLogs([]);
    setSummary(null);
    setAccumulatedDrops({ gold: 0, exp: 0, items: [], cards: [] });
    setGameState(GAME_STATES.ENTERING_DUNGEON);

    try {
      const enter = await enterDungeon(token);
      console.log('Enter dungeon response:', enter);
      
      // Set initial floor
      let initialFloor = 1;
      if (enter.exploration) {
        initialFloor = enter.exploration.floorIndex || 1;
        setCurrentFloor(initialFloor);
      }
      
       if (enter.stats) {
        const newStats = {
          hp: enter.stats.hp || 100,
          attack: enter.stats.attack || 10,
          defense: enter.stats.defense || 5,
          magicPower: userStats.baseStats.magicPower || 0,
          speed: userStats.baseStats.speed || 0,
          critRate: userStats.baseStats.critRate || 5,
          evasion: userStats.baseStats.evasion || 0
        };
        setPlayerStats(newStats);
        setCurrentHp(newStats.hp);
      }
      // Add entry log with floor information
      setLogs([
        `✅ Entered: ${enter.dungeon.name}`,
        `🏁 Starting exploration from floor ${initialFloor}`
      ]);
      
      // Start exploration
      setGameState(GAME_STATES.EXPLORING);
      continueExploration();
    } catch (err) {
      console.error('Error starting exploration:', err);
      setLogs([`❌ Error: ${err.message}`]);
      setGameState(GAME_STATES.IDLE);
    }
  };

  if (error) {
    return (
      <div className="p-5 text-center bg-[#2c1810] rounded-xl">
        <h2 className="text-[#e74c3c] text-xl font-bold">Error</h2>
        <p className="text-[#e0e0e0] my-3">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-[#3498db] text-white border-none rounded-md cursor-pointer mt-2 font-mono"
        >
          Retry
        </button>
      </div>
    );
  }

  // Main game interface
  return (
    <div className="p-5 font-mono text-[#e0e0e0]">
      {/* Adventure log */}
      <div className="border-2 border-[#5d3494] rounded-xl p-4 mb-5 bg-[#3a1f6b] max-h-[200px] overflow-y-auto">
        <h3 className="m-0 mb-2 border-b border-[#5d3494] pb-2 text-white font-bold">
          📜 Adventure Log - Floor {currentFloor}
        </h3>
        
        {logs.length === 0 ? (
          <p className="text-[#b89be6] italic text-center">
            Your adventure awaits. Records of your exploration will appear here once you begin.
          </p>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index}
              className="py-1.5 border-b last:border-b-0 border-[#5d3494] flex items-start text-sm"
            >
              {log.includes('Entered:') && <span className="mr-2">✅</span>}
              {log.includes('Paused') && <span className="mr-2">⏸️</span>}
              {log.includes('Completed') && <span className="mr-2">🎉</span>}
              {log.includes('defeated') && <span className="mr-2">💀</span>}
              {log.includes('Error') && <span className="mr-2">❌</span>}
              {!log.includes('Entered:') && !log.includes('Paused') && !log.includes('Completed') && 
               !log.includes('defeated') && !log.includes('Error') && (
                <span className="mr-2">🔸</span>
              )}
              <span>{log}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
      
      {/* Game state display */}
      {gameState === GAME_STATES.IDLE && (
        <div className="text-center mb-5">
          <button 
            onClick={startExploration}
            className="px-6 py-3 bg-[#4caf50] text-white border-none rounded-lg cursor-pointer text-base font-mono font-bold border-2 border-[#388e3c] transition-all duration-200 hover:bg-[#388e3c] hover:-translate-y-px"
          >
            Start Exploration
          </button>
          <p className="text-sm text-[#b89be6] mt-2">
            Enter the dungeon, face monsters, find treasures, and test your skills.
          </p>
        </div>
      )}
      
      {gameState === GAME_STATES.ENTERING_DUNGEON && (
        <div className="text-center mb-5 p-5 bg-[#3a1f6b] rounded-xl border-2 border-[#5d3494]">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-[#e0e0e0]">Entering dungeon...</div>
        </div>
      )}
      
      {gameState === GAME_STATES.EXPLORING && (
        <div className="text-center mb-5 p-5 bg-[#3a1f6b] rounded-xl border-2 border-[#5d3494]">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-[#e0e0e0]">Exploring floor {currentFloor}...</div>
        </div>
      )}
      
      {gameState === GAME_STATES.COMBAT && (
        <CombatSystem
          monsters={monsters}
          playerStats={{ ...userStats.baseStats, hp: currentHp }} 
          playerClass={userStats?.classSlug || "warrior"}
          playerClassName={userStats?.name}
          skills={userStats?.skills || []} 
          userInfo={userStats}
          userToken={token} 
          onCombatEnd={handleCombatEnd}
        />
      )}
      
      {gameState === GAME_STATES.SHOP && (
        <ShopInterface
          items={shopItems}
          gold={gold || 0}
          onBuyItem={handleBuyItem}
          onLeaveShop={handleLeaveShop}
        />
      )}
      
      {gameState === GAME_STATES.STATS_ALLOCATION && (
        <StatAllocation 
          onClose={() => setGameState(GAME_STATES.IDLE)} 
        />
      )}
      
      {userStats?.hasClass && userStats.unspentPoints > 0 && (
        <div className="fixed bottom-5 right-5 z-50">
          <button 
            onClick={() => setGameState(GAME_STATES.STATS_ALLOCATION)}
            className="bg-[#ff9800] text-white border-none rounded-full w-15 h-15 text-2xl shadow-lg cursor-pointer flex items-center justify-center border-2 border-[#f57800] relative"
          >
            💪
          </button>
          <div className="absolute -top-2 -right-2 bg-[#e53935] text-white rounded-full w-6 h-6 text-sm flex items-center justify-center font-bold">
            {userStats.unspentPoints}
          </div>
        </div>
      )}
      
      {gameState === GAME_STATES.VICTORY && summary && (
        <div className="mb-5 p-6 bg-[#3a1f6b] rounded-xl border-2 border-[#4caf50]">
          <div className="text-center">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-white mb-4 text-xl font-bold">Exploration Settlement!</h3>
          </div>
          
          {/* Basic settlement information */}
          <div className="bg-[#2c1810] p-4 rounded-lg text-[#e0e0e0] mb-5">
            <div className="mb-2">
              <span className="font-bold">Base Experience:</span> {summary.gainedExp}
            </div>
            <div className="mb-2">
              <span className="font-bold">New Level:</span> {summary.newLevel}
            </div>
            <div className="mb-2">
              <span className="font-bold">Available Stat Points:</span> {summary.unspentStatPoints || 0}
            </div>
            
            {summary.levelUp && (
              <div className="text-[#4caf50] font-bold bg-[#1b5e20] p-2 rounded-md mt-2">
                🎉 Leveled up! +{summary.statPointsGained || 0} stat points
              </div>
            )}
          </div>

          {/* Exploration rewards summary */}
          <div className="bg-[#2c1810] p-4 rounded-lg mb-5">
            <h4 className="text-[#ffa726] mb-4 text-center text-lg font-bold">
              🎁 Exploration Rewards Summary
            </h4>
            
            {/* Gold and experience summary */}
            {(accumulatedDrops.gold > 0 || accumulatedDrops.exp > 0) && (
              <div className="flex justify-center gap-5 mb-4">
                {accumulatedDrops.gold > 0 && (
                  <div className="bg-[#ffa726] text-[#2c1810] px-4 py-2 rounded-lg font-bold flex items-center gap-1">
                    <span>💰</span>
                    +{accumulatedDrops.gold} Gold
                  </div>
                )}
                {accumulatedDrops.exp > 0 && (
                  <div className="bg-[#81c784] text-[#2c1810] px-4 py-2 rounded-lg font-bold flex items-center gap-1">
                    <span>✨</span>
                    +{accumulatedDrops.exp} Extra Experience
                  </div>
                )}
              </div>
            )}
            
            {/* Items obtained */}
            {accumulatedDrops.items.length > 0 && (
              <div className="mb-4">
                <h5 className="flex flex-wrap justify-center gap-2 text-white mb-2">Items Obtained:</h5>
                <div className="flex flex-wrap justify-center gap-2">
                  {accumulatedDrops.items.map((item, index) => (
                    <div key={index} className="bg-[#4caf50] text-white p-2 rounded-md text-center text-sm font-bold min-w-[120px] max-w-[180px]">
                      🎁 {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quest cards obtained */}
            {accumulatedDrops.cards.length > 0 && (
              <div>
                <h5 className="flex flex-wrap justify-center gap-2 text-white mb-2">Quest Cards Obtained:</h5>
                <div className="flex flex-wrap justify-center gap-2">
                  {accumulatedDrops.cards.map((card, index) => (
                    <div key={index} className="bg-[#9c27b0] text-white p-2 rounded-md text-center min-w-[150px] max-w-[200px]">
                      <div className="text-xl mb-1">🃏</div>
                      <div className="text-sm font-bold">
                        {card.title}
                      </div>
                      {card.bonus && (
                        <div className="text-xs mt-1">
                          {card.bonus.experienceMultiplier > 1 && 
                            `EXP +${Math.round((card.bonus.experienceMultiplier - 1) * 100)}%`}
                          {card.bonus.goldMultiplier > 1 && 
                            ` Gold +${Math.round((card.bonus.goldMultiplier - 1) * 100)}%`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* If no drops */}
            {accumulatedDrops.gold === 0 && accumulatedDrops.exp === 0 && 
            accumulatedDrops.items.length === 0 && accumulatedDrops.cards.length === 0 && (
              <div className="text-center text-[#b89be6] italic">
                No additional rewards obtained from this exploration
              </div>
            )}
          </div>
          
          <div className="text-center mt-5">
            <button 
              onClick={() => {
                setGameState(GAME_STATES.IDLE);
                setLogs([]);
                setAccumulatedDrops({ gold: 0, exp: 0, items: [], cards: [] }); // Clear accumulated drops
              }}
              className="px-5 py-2.5 bg-[#4caf50] text-white border-none rounded-md cursor-pointer font-mono font-bold border-2 border-[#388e3c] transition-all duration-200 hover:bg-[#388e3c] hover:-translate-y-px"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DungeonTest;
