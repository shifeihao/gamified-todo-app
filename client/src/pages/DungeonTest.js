// 简化版DungeonExplorer.jsx
import React, { useState, useEffect, useRef } from 'react';
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
import axios from 'axios';
import StatAllocation from '../components/game/StatAllocation.js';
import CombatSystem from '../components/game/CombatSystem';

// 游戏状态
const GAME_STATES = {
  IDLE: 'idle',
  CLASS_SELECTION: 'class_selection',
  ENTERING_DUNGEON: 'entering_dungeon',
  EXPLORING: 'exploring',
  COMBAT: 'combat',
  SHOP: 'shop',
  VICTORY: 'victory',
  STATS_ALLOCATION: 'stats_allocation'
};

// 设置调试标志
const DEBUG = true;

// 战斗动画组件


// 商店界面组件
const ShopInterface = ({ items, gold, onBuyItem, onLeaveShop }) => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f7e8', borderRadius: '8px', border: '2px solid #c8b458' }}>
      <h3 style={{ textAlign: 'center', color: '#8b6b2f' }}>🛒 商人商店</h3>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
        <div style={{ 
          backgroundColor: '#f8d64e', 
          padding: '8px 12px', 
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <span style={{ marginRight: '4px' }}>💰</span>
          <span style={{ fontWeight: 'bold' }}>{gold} 金币</span>
        </div>
      </div>
      
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {!Array.isArray(items) || items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            商店中没有可用物品
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {items.map(entry => (
              <div key={entry._id || `item-${Math.random()}`} style={{
                border: '1px solid #d4c778',
                borderRadius: '6px',
                padding: '15px',
                backgroundColor: '#fffdf0'
              }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    backgroundColor: '#f7f0d2',
                    borderRadius: '6px',
                    marginRight: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    {entry.item?.icon ? '🔮' : '📦'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{entry.item?.name || '未知物品'}</div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      {entry.item?.description || '无描述'}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '10px'
                    }}>
                      <span style={{ fontWeight: 'bold', color: '#b7962d' }}>{entry.price} 金币</span>
                      <button 
                        onClick={() => onBuyItem(entry.item?._id, entry.price)}
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
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'block',
          margin: '20px auto 0'
        }}
      >
        离开商店并继续
      </button>
    </div>
  );
};

// 主组件
const DungeonExplorer = () => {
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gold, setGold] = useState(0);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [shopItems, setShopItems] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [playerStats, setPlayerStats] = useState({
    hp: 100,
    attack: 10,
    defense: 5
  });
  
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

  // 初始加载 - 检查用户职业
  useEffect(() => {
    const checkUserClass = async () => {
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      try {
        console.log('使用令牌检查用户职业');
        
        // 获取用户统计信息
        const stats = await getUserStats(token);
        console.log('收到用户统计信息:', stats);
        
        setUserStats({
          ...stats,
          skills: stats.skills || [] 
        });
        
        // 如果用户需要选择职业
        if (!stats.hasClass) {
          console.log('用户需要选择职业，获取可用职业');
          setGameState(GAME_STATES.CLASS_SELECTION);
          const classData = await getAvailableClasses(token);
          setClasses(classData.classes);
        } else {
          setGameState(GAME_STATES.IDLE);
        }
        
        // 获取用户金币
        try {
          const res = await axios.get('/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setGold(res.data.gold || 0);
          
          // 根据返回数据设置玩家统计信息
          if (stats.baseStats) {
            setPlayerStats({
              hp: stats.baseStats.hp || 100,
              attack: stats.baseStats.attack || 10,
              defense: stats.baseStats.defense || 5,
            });
          }
        } catch (profileErr) {
          console.error('获取用户配置文件失败:', profileErr);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('检查用户职业时出错:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    checkUserClass();
  }, [token]);

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
      // 设置为空数组以防止错误
      setShopItems([]);
    }
  };

  // 选择职业
  const handleClassSelect = async (classSlug) => {
    try {
      setLoading(true);
      const result = await selectClass(token, classSlug);
      setUserStats({ 
        ...result.class, 
        hasClass: true 
      });
      setSelectedClass(result.class);
      
      // 根据职业设置玩家属性
      if (result.class.baseStats) {
        setPlayerStats({
          hp: result.class.baseStats.hp || 100,
          attack: result.class.baseStats.attack || 10,
          defense: result.class.baseStats.defense || 5,
        });
      }
      
      setLogs([`✅ 已选择职业: ${result.class.name}`]);
      setGameState(GAME_STATES.IDLE);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 购买商店物品
  const handleBuyItem = async (itemId, price) => {
    try {
      if (gold < price) {
        alert('金币不足！');
        return;
      }
      
      await axios.post(
        '/api/shop/buy', 
        { itemId }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // 更新金币
      setGold(prev => prev - price);
      
      // 更新日志
      setLogs(prev => [...prev, `💰 购买了 ${shopItems.find(i => i.item._id === itemId)?.item.name || '一件物品'}`]);
      
      // 刷新用户资料以获取最新金币
      try {
        const res = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGold(res.data.gold || 0);
      } catch (profileErr) {
        console.error('刷新用户资料失败:', profileErr);
      }
    } catch (err) {
      alert(`购买失败: ${err.message}`);
    }
  };

  // 战斗结束处理
  // Frontend: Update the handleCombatEnd function
const handleCombatEnd = async (result) => {
  console.log("战斗结束:", result);
  
  if (result.result === 'victory') {
    // 基本胜利日志
    setLogs(prev => [...prev, '🎯 战斗胜利！']);
    
    // 如果有掉落结果，显示掉落信息
    if (result.drops) {
      const { gold, exp, items, cards } = result.drops;
      
      // 更新金币（如果有掉落）
      if (gold > 0) {
        setGold(prev => prev + gold);
      }
      
      // 注意：这里不需要再次调用掉落API，因为已经在CombatSystem中处理了
      setLogs(prev => [...prev, '✨ 战利品已添加到库存中']);
    }
    
    setPlayerStats(prev => ({
      ...prev,
      hp: result.remainingHp
    }));
    
    try {
      // 更新战斗后状态（不包含掉落处理，因为已经在前端完成）
      const updateResponse = await axios.post(
        '/api/dungeon/update-after-combat',
        { 
          result: 'victory', 
          remainingHp: result.remainingHp 
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
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
 // 改进的handleLeaveShop函数
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
        defense: enter.stats.defense || 5
      });
    }
    
    // 添加进入日志包含层数信息
    setLogs([
      `✅ 进入: ${enter.dungeon.name}`,
      `🏁 从第 ${initialFloor} 层开始探索`
    ]);
    
    // 开始探索
    setGameState(GAME_STATES.EXPLORING);
    continueExploration();
  } catch (err) {
    console.error('开始探索时出错:', err);
    setLogs([`❌ 错误: ${err.message}`]);
    setGameState(GAME_STATES.IDLE);
  }
};

  // 显示加载中
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        <div>加载中...</div>
      </div>
    );
  }

  // 显示错误
  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#e74c3c' }}>错误</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          重试
        </button>
      </div>
    );
  }

  // 职业选择界面
  if (gameState === GAME_STATES.CLASS_SELECTION && classes.length > 0) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ textAlign: 'center' }}>🧙‍♂️ 选择你的职业</h2>
        <p style={{ textAlign: 'center' }}>选择一个职业开始你的冒险：</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px', justifyContent: 'center' }}>
          {classes.map((characterClass) => (
            <div 
              key={characterClass.slug} 
              style={{ 
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '16px',
                width: '240px',
                cursor: 'pointer',
                backgroundColor: selectedClass?.slug === characterClass.slug ? '#f0f8ff' : 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onClick={() => handleClassSelect(characterClass.slug)}
            >
              <h3 style={{ textAlign: 'center', marginTop: 0 }}>{characterClass.name}</h3>
              <div style={{ 
                marginBottom: '15px', 
                display: 'flex',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                  {characterClass.slug === 'warrior' && '⚔️'}
                  {characterClass.slug === 'mage' && '🔮'}
                  {characterClass.slug === 'archer' && '🏹'}
                  {characterClass.slug === 'cleric' && '✨'}
                  {!['warrior', 'mage', 'archer', 'cleric'].includes(characterClass.slug) && '👤'}
                </div>
              </div>
              <p style={{ 
                fontSize: '14px', 
                color: '#666',
                minHeight: '60px'
              }}>
                {characterClass.description || '一位勇敢的冒险者，准备迎接任何挑战。'}
              </p>
              
              <div style={{ 
                marginTop: '15px',
                backgroundColor: '#f9f9f9',
                padding: '10px',
                borderRadius: '6px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>基础属性：</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>HP: {characterClass.baseStats?.hp || 0}</div>
                  <div>攻击: {characterClass.baseStats?.attack || 0}</div>
                  <div>防御: {characterClass.baseStats?.defense || 0}</div>
                  <div>速度: {characterClass.baseStats?.speed || 0}</div>
                </div>
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ margin: '5px 0', fontSize: '15px' }}>技能：</h4>
                <ul style={{ 
                  paddingLeft: '20px',
                  margin: '5px 0',
                  fontSize: '14px',
                  color: '#555'
                }}>
                  {characterClass.skills?.map((skill) => (
                    <li key={skill.id || skill._id}>{skill.name}</li>
                  )) || <li>无可用技能</li>}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 主游戏界面，不同的状态
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>🧩 地下城探索</h2>
      
      {/* 角色信息 */}
      {userStats?.hasClass && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>你的角色</h3>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {userStats.unspentPoints > 0 && (
          <button
            onClick={() => setGameState(GAME_STATES.STATS_ALLOCATION)}
            style={{
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '14px',
              marginRight: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span style={{ marginRight: '5px' }}>💪</span>
            分配属性点 ({userStats.unspentPoints})
          </button>
        )}
          <div style={{ 
                backgroundColor: '#f8d64e', 
                padding: '8px 12px', 
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '4px' }}>💰</span>
                <span style={{ fontWeight: 'bold' }}>{gold} 金币</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ 
              width: '50px',
              height: '50px',
              backgroundColor: '#e8e8e8',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginRight: '15px'
            }}>
              {userStats.slug === 'warrior' && '⚔️'}
              {userStats.slug === 'mage' && '🔮'}
              {userStats.slug === 'archer' && '🏹'}
              {userStats.slug === 'cleric' && '✨'}
              {!['warrior', 'mage', 'archer', 'cleric'].includes(userStats.slug) && '👤'}
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{userStats.name}</div>
              <div style={{ 
                color: '#555',
                marginTop: '5px',
                fontSize: '14px'
              }}>
                等级: {userStats.level || 1} | 经验: {userStats.exp || 0}
                {userStats.unspentPoints > 0 && (
                  <span style={{ 
                    marginLeft: '10px',
                    color: '#28a745',
                    fontWeight: 'bold'
                  }}>
                    可用属性点: {userStats.unspentPoints}
                  </span>
                )}
              </div>
            </div>
          </div>
    
    {/* 属性展示 */}
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr 1fr', 
      gap: '10px',
      marginTop: '15px'
    }}>
      <div style={{ backgroundColor: '#e8f5e9', padding: '8px', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#555' }}>HP</div>
        <div style={{ fontWeight: 'bold' }}>{userStats.baseStats?.hp || playerStats.hp}</div>
      </div>
      <div style={{ backgroundColor: '#fff3e0', padding: '8px', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#555' }}>攻击</div>
        <div style={{ fontWeight: 'bold' }}>{userStats.baseStats?.attack || playerStats.attack}</div>
      </div>
      <div style={{ backgroundColor: '#e3f2fd', padding: '8px', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#555' }}>防御</div>
        <div style={{ fontWeight: 'bold' }}>{userStats.baseStats?.defense || playerStats.defense}</div>
      </div>
      <div style={{ backgroundColor: '#e8eaf6', padding: '8px', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#555' }}>魔法</div>
        <div style={{ fontWeight: 'bold' }}>{userStats.baseStats?.magicPower || 0}</div>
      </div>
      <div style={{ backgroundColor: '#f3e5f5', padding: '8px', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#555' }}>速度</div>
        <div style={{ fontWeight: 'bold' }}>{userStats.baseStats?.speed || 0}</div>
      </div>
      <div style={{ backgroundColor: '#fff8e1', padding: '8px', borderRadius: '4px' }}>
        <div style={{ fontSize: '12px', color: '#555' }}>当前层</div>
        <div style={{ fontWeight: 'bold' }}>{currentFloor}</div>
      </div>
    </div>
    
    {/* 高级属性（可展开） */}
    <div 
      style={{ 
        marginTop: '10px', 
        backgroundColor: '#f9f9f9', 
        padding: '10px', 
        borderRadius: '4px',
        cursor: 'pointer'
      }}
      onClick={() => setShowAdvancedStats(!showAdvancedStats)}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>高级属性</span>
        <span>{showAdvancedStats ? '▲' : '▼'}</span>
      </div>
      
      {showAdvancedStats && (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '10px'
        }}>
          <div style={{ backgroundColor: '#ffebee', padding: '8px', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#555' }}>暴击率</div>
            <div style={{ fontWeight: 'bold' }}>{userStats.baseStats?.critRate || 0}%</div>
          </div>
          <div style={{ backgroundColor: '#e0f7fa', padding: '8px', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#555' }}>闪避率</div>
            <div style={{ fontWeight: 'bold' }}>{userStats.baseStats?.evasion || 0}%</div>
          </div>
        </div>
      )}
    </div>
  </div>
)}
      
      {/* 冒险日志 */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '6px',
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#fafafa',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
          📜 冒险日志
        </h3>
        
        {logs.length === 0 ? (
          <p style={{ color: '#777', fontStyle: 'italic', textAlign: 'center' }}>
            你的冒险等待开始。启程后记录你的探索经历。
          </p>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index}
              style={{
                padding: '6px 0',
                borderBottom: index < logs.length - 1 ? '1px solid #eee' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                fontSize: '14px'
              }}
            >
              {log.includes('进入:') && <span style={{ marginRight: '8px' }}>✅</span>}
              {log.includes('暂停') && <span style={{ marginRight: '8px' }}>⏸️</span>}
              {log.includes('完成') && <span style={{ marginRight: '8px' }}>🎉</span>}
              {log.includes('击败') && <span style={{ marginRight: '8px' }}>💀</span>}
              {log.includes('错误') && <span style={{ marginRight: '8px' }}>❌</span>}
              {!log.includes('进入:') && !log.includes('暂停') && !log.includes('完成') && !log.includes('击败') && !log.includes('错误') && (
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
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            开始探索
          </button>
          <p style={{ fontSize: '14px', color: '#777', marginTop: '10px' }}>
            进入地下城，面对怪物，寻找宝藏，测试你的技能。
          </p>
        </div>
      )}
      
      {gameState === GAME_STATES.ENTERING_DUNGEON && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div>正在进入地下城...</div>
        </div>
      )}
      
      {gameState === GAME_STATES.EXPLORING && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</div>
          <div>正在探索第 {currentFloor} 层...</div>
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
          gold={gold}
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
              border: 'none',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              fontSize: '24px',
              boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
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
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          border: '2px solid #4caf50'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏆</div>
            <h3 style={{ color: '#2e7d32', marginBottom: '15px' }}>探索结算！</h3>
          </div>
          
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.7)', 
            padding: '15px',
            borderRadius: '6px'
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
                color: '#2e7d32', 
                fontWeight: 'bold',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                padding: '10px',
                borderRadius: '4px',
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
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
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

export default DungeonExplorer;