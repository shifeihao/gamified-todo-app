// 简化版的 DungeonTest.jsx - 前半部分
import React, { useState, useEffect, useRef } from 'react';
import { getShopItems, buyItem } from '../services/inventoryShopService.js';
import {
  enterDungeon,
  exploreCurrentFloor,
  summarizeExploration,
  updateCombatResult
} from '../services/dungeonTestService.js';
import axios from 'axios';
import StatAllocation from '../components/game/StatAllocation.js';
import CombatSystem from '../components/game/CombatSystem';
import { toast } from 'react-hot-toast';
import AchievementUnlockNotification from '../components/achievement/AchievementUnlockNotification';

// 游戏状态
const GAME_STATES = {
  IDLE: 'idle',
  ENTERING_DUNGEON: 'entering_dungeon',
  EXPLORING: 'exploring',
  COMBAT: 'combat',
  SHOP: 'shop',
  VICTORY: 'victory',
  STATS_ALLOCATION: 'stats_allocation'
};

// 设置调试标志
const DEBUG = true;

// 商店界面组件
const ShopInterface = ({ items, gold, onBuyItem, onLeaveShop }) => {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#3a1f6b', 
      borderRadius: '12px', 
      border: '2px solid #5d3494',
      color: '#e0e0e0'
    }}>
      <h3 style={{ textAlign: 'center', color: '#ffffff', marginBottom: '15px' }}>
        🛒 商人商店
      </h3>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
        <div style={{ 
          backgroundColor: '#ffa726', 
          padding: '8px 12px', 
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          color: '#2c1810',
          border: '2px solid #ff8f00'
        }}>
          <span style={{ marginRight: '4px' }}>💰</span>
          <span style={{ fontWeight: 'bold' }}>{gold} 金币</span>
        </div>
      </div>
      
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {!Array.isArray(items) || items.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#b89be6',
            backgroundColor: '#2c1810',
            borderRadius: '8px',
            border: '1px solid #5d3494'
          }}>
            商店中没有可用物品
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            {items.map(entry => (
              <div key={entry._id || `item-${Math.random()}`} style={{
                border: '2px solid #5d3494',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#2c1810',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    backgroundColor: '#4c2a85',
                    borderRadius: '8px',
                    marginRight: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    border: '2px solid #7e4ab8'
                  }}>
                    {entry.item?.icon ? '🔮' : '📦'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#ffffff' }}>
                      {entry.item?.name || '未知物品'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#b89be6', marginBottom: '8px' }}>
                      {entry.item?.description || '无描述'}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '10px'
                    }}>
                      <span style={{ fontWeight: 'bold', color: '#ffa726' }}>
                        {entry.price} 金币
                      </span>
                      <button 
                        onClick={() => onBuyItem(entry.item?._id, entry.price)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: gold >= entry.price ? '#4caf50' : '#666',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: gold >= entry.price ? 'pointer' : 'not-allowed',
                          fontFamily: 'Courier New, monospace',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease'
                        }}
                        disabled={gold < entry.price || !entry.item?._id}
                      >
                        购买
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
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#ff9800',
          color: 'white',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
          display: 'block',
          margin: '20px auto 0',
          border: '2px solid #f57800',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#f57800';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#ff9800';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        离开商店并继续
      </button>
    </div>
  );
};

// 主组件 - 简化版
const DungeonTest = ({ userStats, onGoldUpdate, gold  }) => {
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [currentFloor, setCurrentFloor] = useState(1);
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
  
  // 引用变量
  const logsEndRef = useRef(null);
  const prevStateRef = useRef(null);
  const transitionInProgressRef = useRef(false);
  
  const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
  const token = userInfo?.token || null;

  // 滚动到日志底部
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  
  // 状态监控
  useEffect(() => {
    if (DEBUG) console.log(`游戏状态变化: ${gameState}`);
    
    // 从商店状态转出时的特殊处理
    if (gameState === GAME_STATES.EXPLORING && prevStateRef.current === GAME_STATES.SHOP) {
      if (DEBUG) console.log('检测到从商店状态转出');
      
      // 检查是否有怪物等待战斗但状态未正确转换
      if (monsters && monsters.length > 0) {
        if (DEBUG) console.log('有怪物等待战斗，但状态未正确转换，强制转换到战斗状态');
        setTimeout(() => {
          setGameState(GAME_STATES.COMBAT);
        }, 300);
      }
    }
    
    // 记录前一个状态
    prevStateRef.current = gameState;
  }, [gameState, monsters]);

  // 初始化玩家属性
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

  // 加载商店物品
  const loadShopItems = async () => {
    try {
      console.log("加载商店物品...");
      const items = await getShopItems(token);
      console.log("商店物品加载完成:", items);
      
      if (items) {
        setShopItems(Array.isArray(items) ? items : []);
      } else {
        setShopItems([]);
      }
    } catch (err) {
      console.error('加载商店物品失败:', err);
      setShopItems([]);
    }
  };

  // 购买商店物品
  const handleBuyItem = async (itemId, price) => {
    try {
      // 检查金币是否足够
      const res = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.gold < price) {
        alert('金币不足！');
        return;
      }
      
      const purchaseResponse = await axios.post(
        '/api/shop/buy', 
        { itemId }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // 更新日志
      setLogs(prev => [...prev, `💰 购买了 ${shopItems.find(i => i.item._id === itemId)?.item.name || '一件物品'}`]);
      
      // 显示成就解锁提醒
      if (purchaseResponse.data.newlyUnlockedAchievements?.length > 0) {
        purchaseResponse.data.newlyUnlockedAchievements.forEach(achievement => {
          toast.success(
            <AchievementUnlockNotification achievement={achievement} />,
            {
              duration: 5000,
              position: "top-right",
              style: {
                minWidth: '320px'
              }
            }
          );
        });
      }
      
      // 通知父组件更新金币
      if (onGoldUpdate) {
        onGoldUpdate();
      }
    } catch (err) {
      alert(`购买失败: ${err.message}`);
    }
  };

  // 战斗结束处理
  const handleCombatEnd = async (result) => {
    console.log("战斗结束:", result);
    
    if (result.result === 'victory') {
      // 基本胜利日志
      setLogs(prev => [...prev, '🎯 战斗胜利！']);
      
      // 如果有掉落结果，显示掉落信息
      if (result.drops) {
        const { gold, exp, items, cards } = result.drops;
        
        // 通知父组件更新金币
        if (gold > 0 && onGoldUpdate) {
          onGoldUpdate();
        }
        
        setLogs(prev => [...prev, '✨ 战利品已添加到库存中']);
      }
      
      setPlayerStats(prev => ({
        ...prev,
        hp: result.remainingHp
      }));
      
      try {
        const updateResponse = await updateCombatResult(token, {
          survived: result.result === 'victory',
          remainingHp: result.remainingHp
        });
        
        console.log('战斗后状态更新:', updateResponse.data);
        
        // 处理等级提升等其他更新
        if (updateResponse.data.logs && Array.isArray(updateResponse.data.logs)) {
          setLogs(prev => [...prev, ...updateResponse.data.logs]);
        }
        
        if (updateResponse.data.expGained) {
          setLogs(prev => [...prev, `✨ 获得 ${updateResponse.data.expGained} 点经验`]);
        }

        if (updateResponse.data.levelUp) {
          setLogs(prev => [
            ...prev, 
            `🌟 升级了！从 ${updateResponse.data.prevLevel || '?'} 级到 ${updateResponse.data.currentLevel || updateResponse.data.newLevel || '?'} 级`
          ]);
          
          if (updateResponse.data.statPointsGained > 0) {
            setLogs(prev => [
              ...prev,
              `💪 获得了 ${updateResponse.data.statPointsGained} 点属性点`
            ]);
          }
        }
        
        // 显示成就解锁提醒
        if (updateResponse.data.newlyUnlockedAchievements?.length > 0) {
          updateResponse.data.newlyUnlockedAchievements.forEach(achievement => {
            toast.success(
              <AchievementUnlockNotification achievement={achievement} />,
              {
                duration: 5000,
                position: "top-right",
                style: {
                  minWidth: '320px'
                }
              }
            );
          });
        }
        
        // 更新楼层
        if (updateResponse.data.nextFloor) {
          console.log(`更新楼层: ${currentFloor} -> ${updateResponse.data.nextFloor}`);
          setCurrentFloor(updateResponse.data.nextFloor);
          setLogs(prev => [...prev, `🚪 你进入了第 ${updateResponse.data.nextFloor} 层`]);
        }
        
        // 继续探索
        setTimeout(() => {
          continueExploration();
        }, 1000);
      } catch (err) {
        console.error('更新战斗结果出错:', err);
        setTimeout(() => {
          continueExploration();
        }, 1000);
      }
    } else if (result.result === 'settlement') {
      // HP为0时的处理
      setLogs(prev => [...prev, '💀 你被击败了，自动结算...']);
      
      try {
        const summary = await summarizeExploration(token);
        setSummary(summary);
        setGameState(GAME_STATES.VICTORY);
      } catch (err) {
        console.error('获取结算信息失败:', err);
      }
    }
  };
  // 离开商店
  const handleLeaveShop = async () => {
    console.log('=== LEAVE SHOP START ===');
    setLogs(prev => [...prev, '🚶 离开商店并继续探索...']);
    
    // 标记转换进行中
    setShopItems([]);
    setGameState(GAME_STATES.EXPLORING);
    
    try {
      // 调用离开商店API
      await axios.post(
        '/api/dungeon/shop-interaction', 
        { action: 'leave' }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // 调用专门为商店后战斗设计的continue API
      const continueResponse = await axios.post(
        '/api/dungeon/continue',
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log('Continue after shop response:', continueResponse.data);
      
      // 添加这部分代码：处理返回的日志
      if (continueResponse.data.logs && Array.isArray(continueResponse.data.logs)) {
        console.log('Adding logs from response:', continueResponse.data.logs);
        setLogs(prev => [...prev, ...continueResponse.data.logs]);
      }
      
      // 更新当前楼层
      if (continueResponse.data.currentFloor) {
        setCurrentFloor(continueResponse.data.currentFloor);
      }
      
      // 处理返回的怪物数据
      if (continueResponse.data.monsters && 
          Array.isArray(continueResponse.data.monsters) && 
          continueResponse.data.monsters.length > 0) {
          
        console.log('Found monsters after shop, starting combat');
        setMonsters(continueResponse.data.monsters);
        
        // 延迟确保UI更新
        setTimeout(() => {
          setGameState(GAME_STATES.COMBAT);
        }, 300);
      } else {
        console.log('No monsters after shop, continuing exploration');
        continueExploration();
      }

      const summary = await summarizeExploration(token);
      setSummary(summary);

      // 显示成就解锁提醒
      if (summary.newlyUnlockedAchievements?.length > 0) {
        summary.newlyUnlockedAchievements.forEach(achievement => {
          toast.success(
            <AchievementUnlockNotification achievement={achievement} />,
            {
              duration: 5000,
              position: "top-right",
              style: {
                minWidth: '320px'
              }
            }
          );
        });
      }

      setGameState(GAME_STATES.VICTORY);
    } catch (err) {
      console.error('Leave shop error:', err);
      setLogs(prev => [...prev, `❌ 错误: ${err.message}`]);
      
      // 错误恢复
      setTimeout(() => {
        setGameState(GAME_STATES.IDLE);
      }, 1000);
    }
    
    console.log('=== LEAVE SHOP END ===');
  };
  
  // 战斗或商店后继续探索
  const continueExploration = async () => {
    // 如果转换正在进行中，避免重复调用
    if (transitionInProgressRef.current) {
      if (DEBUG) console.log('转换正在进行中，跳过继续探索');
      return;
    }
    
    try {
      if (DEBUG) console.log('开始继续探索流程');
      
      // 设置状态为探索中
      setGameState(GAME_STATES.EXPLORING);
      
      // 调用API获取探索结果
      const res = await exploreCurrentFloor(token);
    
      
      if (DEBUG) console.log('探索响应:', res);
      
      // 处理战斗日志
      if (res.logs && Array.isArray(res.logs)) {
        setLogs(prev => [...prev, ...res.logs]);
      }
      
      // 处理经验值
      if (res.gainedExp) {
        setLogs(prev => [...prev, `✨ 获得 ${res.gainedExp} 点经验`]);
      }
      
      // 更新楼层
      if (res.nextFloor) {
        setCurrentFloor(res.nextFloor);
      }
      
      // 处理怪物战斗 - 这是关键部分
      if (res.monsters && Array.isArray(res.monsters) && res.monsters.length > 0) {
        if (DEBUG) console.log('发现怪物，设置战斗状态');
        setMonsters(res.monsters);
        
        // 使用延迟确保状态正确更新
        setTimeout(() => {
          if (DEBUG) console.log('切换到战斗UI');
          setGameState(GAME_STATES.COMBAT);
        }, 300);
        return;
      }
      
      // 处理商店事件
      if (res.pause && res.eventType === 'shop') {
        if (DEBUG) console.log('发现商店事件');
        await loadShopItems();
        
        // 使用延迟确保状态正确更新
        setTimeout(() => {
          if (DEBUG) console.log('切换到商店UI');
          setGameState(GAME_STATES.SHOP);
        }, 300);
        return;
      }
      
      // 处理结算
      if (res.result === 'completed') {
        setLogs(prev => [...prev, '🎉 探索完成！']);
        try {
          const summary = await summarizeExploration(token);
          setSummary(summary);
          setGameState(GAME_STATES.VICTORY);
        } catch (error) {
          console.error('获取结算信息失败:', error);
        }
      } 
      // 处理被击败
      else if (res.result === 'defeat') {
        setLogs(prev => [...prev, '💀 你被击败了，自动结算...']);
        try {
          const summary = await summarizeExploration(token);
          setSummary(summary);
          setGameState(GAME_STATES.VICTORY);
        } catch (error) {
          console.error('获取结算信息失败:', error);
        }
      } 
      // 处理继续探索
      else if (res.result === 'continue') {
        // 递归调用自身继续探索
        setTimeout(() => {
          continueExploration();
        }, 500);
      }

      // 显示成就解锁提醒
      if (res.newlyUnlockedAchievements?.length > 0) {
        res.newlyUnlockedAchievements.forEach(achievement => {
          toast.success(
            <AchievementUnlockNotification achievement={achievement} />,
            {
              duration: 5000,
              position: "top-right",
              style: {
                minWidth: '320px'
              }
            }
          );
        });
      }
    } catch (err) {
      console.error('探索过程中出错:', err);
      setLogs(prev => [...prev, `❌ 错误: ${err.message}`]);
    }
  };

  // 开始探索
  const startExploration = async () => {
    setLogs([]);
    setSummary(null);
    setGameState(GAME_STATES.ENTERING_DUNGEON);

    try {
      const enter = await enterDungeon(token);
      console.log('进入地下城响应:', enter);
      
      // 设置初始层数
      let initialFloor = 1;
      if (enter.exploration) {
        initialFloor = enter.exploration.floorIndex || 1;
        setCurrentFloor(initialFloor);
      }
      
      if (enter.stats) {
        setPlayerStats({
          hp: enter.stats.hp || 100,
          attack: enter.stats.attack || 10,
          defense: enter.stats.defense || 5,
          magicPower: userStats.baseStats.magicPower || 0,
          speed: userStats.baseStats.speed || 0,
          critRate: userStats.baseStats.critRate || 5,
          evasion: userStats.baseStats.evasion || 0
        });
      }
      
      // 添加进入日志包含层数信息
      setLogs([
        `✅ 进入: ${enter.dungeon.name}`,
        `🏁 从第 ${initialFloor} 层开始探索`
      ]);

      // 显示成就解锁提醒
      if (enter.newlyUnlockedAchievements?.length > 0) {
        enter.newlyUnlockedAchievements.forEach(achievement => {
          toast.success(
            <AchievementUnlockNotification achievement={achievement} />,
            {
              duration: 5000,
              position: "top-right",
              style: {
                minWidth: '320px'
              }
            }
          );
        });
      }
      
      // 开始探索
      setGameState(GAME_STATES.EXPLORING);
      continueExploration();
    } catch (err) {
      console.error('开始探索时出错:', err);
      setLogs([`❌ 错误: ${err.message}`]);
      setGameState(GAME_STATES.IDLE);
    }
  };

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: '#2c1810', 
        borderRadius: '12px' 
      }}>
        <h2 style={{ color: '#e74c3c' }}>错误</h2>
        <p style={{ color: '#e0e0e0' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '10px',
            fontFamily: 'Courier New, monospace'
          }}
        >
          重试
        </button>
      </div>
    );
  }

  // 主游戏界面
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Courier New, monospace',
      color: '#e0e0e0'
    }}>
      {/* 冒险日志 */}
      <div style={{
        border: '2px solid #5d3494',
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#3a1f6b',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          borderBottom: '1px solid #5d3494', 
          paddingBottom: '8px',
          color: '#ffffff'
        }}>
          📜 冒险日志 - 第 {currentFloor} 层
        </h3>
        
        {logs.length === 0 ? (
          <p style={{ color: '#b89be6', fontStyle: 'italic', textAlign: 'center' }}>
            你的冒险等待开始。启程后记录你的探索经历。
          </p>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index}
              style={{
                padding: '6px 0',
                borderBottom: index < logs.length - 1 ? '1px solid #5d3494' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                fontSize: '14px',
                color: '#e0e0e0'
              }}
            >
              {log.includes('进入:') && <span style={{ marginRight: '8px' }}>✅</span>}
              {log.includes('暂停') && <span style={{ marginRight: '8px' }}>⏸️</span>}
              {log.includes('完成') && <span style={{ marginRight: '8px' }}>🎉</span>}
              {log.includes('击败') && <span style={{ marginRight: '8px' }}>💀</span>}
              {log.includes('错误') && <span style={{ marginRight: '8px' }}>❌</span>}
              {!log.includes('进入:') && !log.includes('暂停') && !log.includes('完成') && 
               !log.includes('击败') && !log.includes('错误') && (
                <span style={{ marginRight: '8px' }}>🔸</span>
              )}
              <span>{log}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
      
      {/* 游戏状态展示 */}
      {gameState === GAME_STATES.IDLE && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button 
            onClick={startExploration}
            style={{
              padding: '12px 25px',
              backgroundColor: '#4caf50',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              border: '2px solid #388e3c',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#388e3c';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#4caf50';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            开始探索
          </button>
          <p style={{ fontSize: '14px', color: '#b89be6', marginTop: '10px' }}>
            进入地下城，面对怪物，寻找宝藏，测试你的技能。
          </p>
        </div>
      )}
      
      {gameState === GAME_STATES.ENTERING_DUNGEON && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#3a1f6b',
          borderRadius: '12px',
          border: '2px solid #5d3494'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div style={{ color: '#e0e0e0' }}>正在进入地下城...</div>
        </div>
      )}
      
      {gameState === GAME_STATES.EXPLORING && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#3a1f6b',
          borderRadius: '12px',
          border: '2px solid #5d3494'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</div>
          <div style={{ color: '#e0e0e0' }}>正在探索第 {currentFloor} 层...</div>
        </div>
      )}
      
      {gameState === GAME_STATES.COMBAT && (
        <CombatSystem
          monsters={monsters}
          playerStats={playerStats}
          playerClass={userStats?.classSlug || "warrior"}
          playerClassName={userStats?.name}
          skills={userStats?.skills || []} 
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
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          zIndex: 1000 
        }}>
          <button 
            onClick={() => setGameState(GAME_STATES.STATS_ALLOCATION)}
            style={{
              backgroundColor: '#ff9800',
              color: 'white',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              fontSize: '24px',
              boxShadow: '0 3px 5px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #f57800'
            }}
          >
            💪
          </button>
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            backgroundColor: '#e53935',
            color: 'white',
            borderRadius: '50%',
            width: '25px',
            height: '25px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {userStats.unspentPoints}
          </div>
        </div>
      )}
      
      {gameState === GAME_STATES.VICTORY && summary && (
        <div style={{ 
          marginBottom: '20px',
          padding: '25px',
          backgroundColor: '#3a1f6b',
          borderRadius: '12px',
          border: '2px solid #4caf50'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏆</div>
            <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>探索结算！</h3>
          </div>
          
          <div style={{ 
            backgroundColor: '#2c1810', 
            padding: '15px',
            borderRadius: '8px',
            color: '#e0e0e0'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>获得经验：</span> {summary.gainedExp}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>新等级：</span> {summary.newLevel}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>可用属性点：</span> {summary.unspentStatPoints || 0}
             </div>
            
            {summary.levelUp && (
              <div style={{ 
                color: '#4caf50', 
                fontWeight: 'bold',
                backgroundColor: '#1b5e20',
                padding: '10px',
                borderRadius: '6px',
                marginTop: '10px'
              }}>
                🎉 升级了！ +{summary.statPointsGained || 0} 属性点
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              onClick={() => {
                setGameState(GAME_STATES.IDLE);
                setLogs([]);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4caf50',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Courier New, monospace',
                fontWeight: 'bold',
                border: '2px solid #388e3c',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#388e3c';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#4caf50';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              返回首页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DungeonTest;