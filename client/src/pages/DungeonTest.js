// pages/DungeonTest.jsx
import React, { useState, useEffect } from 'react';
import { getShopItems, buyItem } from '../services/inventoryShopService.js';
import {
  enterDungeon,
  exploreCurrentFloor,
  summarizeExploration
} from '../services/dungeonTestService.js';
import {
  getAvailableClasses,
  selectClass,
  getUserStats
} from '../services/characterService.js';
import axios from 'axios'; // 引入 axios 用于调用 API

const DungeonTest = () => {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 商店相关状态
  const [showShop, setShowShop] = useState(false);
  const [shopItems, setShopItems] = useState([]);
  const [gold, setGold] = useState(0);
  const [currentEvent, setCurrentEvent] = useState(null);
  

  const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
  const token = userInfo?.token || null;

  // 检查用户职业状态
  useEffect(() => {
    const checkUserClass = async () => {
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      try {
        console.log('Checking user class with token:', token ? 'exists' : 'none');
        
        // 获取用户统计信息
        const stats = await getUserStats(token);
        console.log('Received user stats:', stats);
        
        setUserStats(stats);
        
        // 如果用户还没有选择职业，获取可用职业列表
        if (!stats.hasClass) {
          console.log('User needs to select a class, fetching available classes');
          const classData = await getAvailableClasses(token);
          setClasses(classData.classes);
        }
        
        // 获取用户金币
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
        console.error('Error checking user class:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    checkUserClass();
  }, [token]);

  // 加载商店物品
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
      // 设置为空数组防止错误
      setShopItems([]);
    }
  };

  // 处理职业选择
  const handleClassSelect = async (classSlug) => {
    try {
      setLoading(true);
      const result = await selectClass(token, classSlug);
      setUserStats({ 
        ...result.class, 
        hasClass: true 
      });
      setSelectedClass(result.class);
      setLogs([`✅ Selected class: ${result.class.name}`]);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 购买物品
  const handleBuyItem = async (itemId, price) => {
    try {
      if (gold < price) {
        alert('您的金币不足!');
        return;
      }
      
      // 使用你已有的购买 API
      await axios.post(
        '/api/shop/buy', 
        { itemId }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // 更新金币
      setGold(prev => prev - price);
      
      // 添加日志
      setLogs(prev => [...prev, `💰 Purchased ${shopItems.find(i => i.item._id === itemId)?.item.name || 'an item'}`]);
      
      // 刷新用户档案以获取最新金币
      try {
        const res = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGold(res.data.gold || 0);
      } catch (profileErr) {
        console.error('Failed to refresh user profile:', profileErr);
      }
    } catch (err) {
      alert(`购买失败: ${err.message}`);
    }
  };

  // 离开商店，继续探索
  const handleLeaveShop = async () => {
    setShowShop(false);
    setCurrentEvent(null);
    
    setLogs(prev => [...prev, '🚶 Leaving the shop and continuing exploration...']);
    
    try {
      // 继续探索
      const res = await exploreCurrentFloor(token);
      console.log('Continue exploration after shop:', res);
      
      // 处理战斗日志
      if (res.logs && Array.isArray(res.logs)) {
        setLogs(prev => [...prev, ...res.logs]);
      }
      
      // 处理经验值
      if (res.gainedExp) {
        setLogs(prev => [...prev, `✨ Gained ${res.gainedExp} experience points`]);
      }
      
      // 处理结果
      if (res.result === 'completed') {
        setLogs(prev => [...prev, '🎉 Exploration complete!']);
        try {
          const summary = await summarizeExploration(token);
          setSummary(summary);
        } catch (error) {
          console.error('Error getting summary after shop:', error);
        }
      } else if (res.result === 'defeat') {
        setLogs(prev => [...prev, '💀 You were defeated.']);
      }
    } catch (err) {
      console.error('Error after leaving shop:', err);
      setLogs(prev => [...prev, `❌ Error: ${err.message}`]);
    }
  };

  // 开始/继续探索
  const runExploration = async () => {
    setLogs([]);
    setSummary(null);
    setIsRunning(true);
  
    try {
      console.log('======= EXPLORATION START =======');
      const enter = await enterDungeon(token);
      console.log('Enter response (FULL):', JSON.stringify(enter));
      setLogs((prev) => [...prev, `✅ Entered: ${enter.dungeon.name}`]);
  
      let done = false;
      while (!done) {
        console.log('======= CALLING EXPLORE FLOOR =======');
        const res = await exploreCurrentFloor(token);
        console.log('Explore response (FULL):', JSON.stringify(res));
        
        // 检查关键字段
        console.log('Response contains logs?', res.logs !== undefined);
        console.log('Logs is array?', Array.isArray(res.logs));
        console.log('Logs length:', res.logs?.length || 0);
        console.log('Response result:', res.result);
        console.log('Response pause:', res.pause);
        console.log('Response eventType:', res.eventType);
        console.log('Response gainedExp:', res.gainedExp);
        
        // 单独处理日志
        if (Array.isArray(res.logs) && res.logs.length > 0) {
          console.log('Combat logs:', JSON.stringify(res.logs));
          setLogs((prev) => {
            console.log('Previous logs:', prev);
            console.log('Adding logs:', res.logs);
            return [...prev, ...res.logs];
          });
        } else {
          console.warn('No logs found in response or logs is not an array');
          setLogs((prev) => [...prev, '🔍 Exploring...']);
        }
        
        // 处理事件和结果
        if (res.pause) {
          console.log('Exploration paused due to:', res.eventType);
          setLogs((prev) => [...prev, `⏸️ Exploration paused due to ${res.eventType || 'event'}.`]);
          
          if (res.eventType === 'shop') {
            console.log('Opening shop...');
            setCurrentEvent({ type: 'shop', data: res });
            await loadShopItems();
            setShowShop(true);
          }
          
          done = true;
        } else if (res.result === 'completed') {
          console.log('Exploration completed');
          setLogs((prev) => [...prev, '🎉 Exploration complete!']);
          done = true;
        } else if (res.result === 'defeat') {
          console.log('Player defeated');
          setLogs((prev) => [...prev, '💀 You were defeated.']);
          done = true;
        } else if (res.result === 'continue') {
          console.log('Moving to next floor:', res.nextFloor);
          setLogs((prev) => [...prev, `🚶 Moving to floor ${res.nextFloor}...`]);
        } else {
          console.warn('Unknown result:', res.result);
        }
        
        // 检查当前日志状态
        console.log('Current logs state:', logs);
      }
  
      // 获取摘要
      console.log('======= GETTING SUMMARY =======');
      try {
        const summary = await summarizeExploration(token);
        console.log('Summary response (FULL):', JSON.stringify(summary));
        setSummary(summary);
      } catch (summaryErr) {
        console.error('Summary error:', summaryErr);
      }
    } catch (err) {
      console.error('Exploration error:', err);
      console.error('Error details:', err.response?.data || err.message);
      setLogs((prev) => [...prev, `❌ Error: ${err.message || 'Unknown error'}`]);
    }
  
    setIsRunning(false);
  };

  // 显示加载中
  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  // 显示错误
  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // 职业选择界面
  if (!userStats?.hasClass && classes.length > 0) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>🧙‍♂️ Choose Your Class</h2>
        <p>Select a class to begin your adventure:</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
          {classes.map((characterClass) => (
            <div 
              key={characterClass.slug} 
              style={{ 
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '16px',
                width: '200px',
                cursor: 'pointer',
                backgroundColor: selectedClass?.slug === characterClass.slug ? '#f0f8ff' : 'white'
              }}
              onClick={() => handleClassSelect(characterClass.slug)}
            >
              <h3>{characterClass.name}</h3>
              <div style={{ marginBottom: '10px' }}>
                {characterClass.icon && (
                  <img 
                    src={`/images/classes/${characterClass.icon}`} 
                    alt={characterClass.name}
                    style={{ width: '64px', height: '64px' }} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='8' r='5'/%3E%3Cpath d='M20 21v-2a7 7 0 0 0-14 0v2'/%3E%3C/svg%3E";
                    }}
                  />
                )}
              </div>
              <p>{characterClass.description}</p>
              
              <div style={{ marginTop: '10px' }}>
                <h4>Base Stats:</h4>
                <ul style={{ paddingLeft: '20px' }}>
                  <li>HP: {characterClass.baseStats.hp}</li>
                  <li>Attack: {characterClass.baseStats.attack}</li>
                  <li>Defense: {characterClass.baseStats.defense}</li>
                  <li>Speed: {characterClass.baseStats.speed}</li>
                </ul>
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <h4>Skills:</h4>
                <ul style={{ paddingLeft: '20px' }}>
                  {characterClass.skills?.map((skill) => (
                    <li key={skill.id}>{skill.name}</li>
                  )) || <li>No skills available</li>}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 显示商店界面
  if (showShop) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>🛒 Merchant Shop</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p>Buy what you need for your adventure!</p>
          <div style={{ 
            backgroundColor: '#f8d64e', 
            padding: '8px 12px', 
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <span style={{ marginRight: '4px' }}>💰</span>
            <span style={{ fontWeight: 'bold' }}>{gold} Gold</span>
          </div>
        </div>
        
        <div style={{
          border: '2px solid #888',
          borderRadius: '6px',
          backgroundColor: '#fff',
          padding: '1rem',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
          }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#eee' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc', textAlign: 'left' }}>Item</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(shopItems) || shopItems.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '16px', textAlign: 'center' }}>
                    No items available in shop
                  </td>
                </tr>
              ) : (
                shopItems.map(entry => (
                  <tr key={entry._id || `item-${Math.random()}`}>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          backgroundColor: '#f0f0f0',
                          borderRadius: '4px',
                          marginRight: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {entry.item?.icon ? (
                            <img 
                              src={`/Icon/Item/${entry.item.icon}.png`} 
                              alt="" 
                              style={{ maxWidth: '100%', maxHeight: '100%' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <span style={{ fontWeight: 'bold' }}>{entry.item?.name || 'Unknown Item'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee', color: '#666' }}>
                      {entry.item?.description || 'No description available'}
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold' }}>
                      {entry.price} gold
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleBuyItem(entry.item?._id, entry.price)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: gold >= entry.price ? '#4caf50' : '#ccc',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: gold >= entry.price ? 'pointer' : 'not-allowed'
                        }}
                        disabled={gold < entry.price || !entry.item?._id}
                      >
                        Buy
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <button 
          onClick={handleLeaveShop}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Leave Shop & Continue
        </button>
        
        <div style={{ 
          marginTop: '1rem', 
          padding: '10px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '5px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {logs.map((log, index) => (
            <div 
              key={index}
              style={{
                padding: '5px 0',
                borderBottom: index < logs.length - 1 ? '1px solid #eee' : 'none'
              }}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 探索界面
  return (
    <div style={{ padding: '2rem' }}>
      <h2>🧩 Dungeon Exploration Test</h2>
      
      {userStats?.hasClass && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '5px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Your Character</h3>
            <div style={{ 
              backgroundColor: '#f8d64e', 
              padding: '8px 12px', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '4px' }}>💰</span>
              <span style={{ fontWeight: 'bold' }}>{gold} Gold</span>
            </div>
          </div>
          <p><strong>Class:</strong> {userStats.name}</p>
          <p><strong>Stats:</strong> HP: {userStats.baseStats?.hp || 0}, ATK: {userStats.baseStats?.attack || 0}, DEF: {userStats.baseStats?.defense || 0}</p>
          {userStats.skills && userStats.skills.length > 0 && (
            <div>
              <strong>Skills:</strong> {userStats.skills.map(s => s.name).join(', ')}
            </div>
          )}
        </div>
      )}
      
      <button 
        onClick={runExploration} 
        disabled={isRunning}
        style={{
          padding: '10px 20px',
          backgroundColor: isRunning ? '#ccc' : '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {isRunning ? 'Exploring...' : 'Start Exploration'}
      </button>

      <div 
        style={{ 
          marginTop: '1rem', 
          padding: '15px', 
          backgroundColor: '#f9f9f9',
          borderRadius: '5px',
          maxHeight: '400px',
          overflowY: 'auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        {logs.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No exploration logs yet. Press Start to begin.</p>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index}
              style={{
                padding: '6px 0',
                borderBottom: index < logs.length - 1 ? '1px solid #eee' : 'none',
                display: 'flex',
                alignItems: 'flex-start'
              }}
            >
              {log.includes('Entered:') && <span style={{ marginRight: '8px' }}>✅</span>}
              {log.includes('paused') && <span style={{ marginRight: '8px' }}>⏸️</span>}
              {log.includes('complete') && <span style={{ marginRight: '8px' }}>🎉</span>}
              {log.includes('defeated') && <span style={{ marginRight: '8px' }}>💀</span>}
              {log.includes('Error') && <span style={{ marginRight: '8px' }}>❌</span>}
              {!log.includes('Entered:') && !log.includes('paused') && !log.includes('complete') && !log.includes('defeated') && !log.includes('Error') && (
                <span style={{ marginRight: '8px' }}>🔸</span>
              )}
              <span>{log}</span>
            </div>
          ))
        )}
      </div>

      {summary && (
        <div 
          style={{ 
            marginTop: '2rem',
            padding: '20px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <h3 style={{ color: '#2e7d32', marginTop: 0 }}>📊 Exploration Summary</h3>
          <p><strong>Experience Gained:</strong> {summary.gainedExp}</p>
          <p><strong>New Level:</strong> {summary.newLevel}</p>
          {summary.levelUp && (
            <p style={{ 
              color: '#2e7d32', 
              fontWeight: 'bold',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              padding: '10px',
              borderRadius: '4px'
            }}>
              🎉 Level up! +{summary.statPointsGained} stat points
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DungeonTest;