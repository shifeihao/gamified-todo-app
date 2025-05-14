// 重新设计的 GameLayout.jsx
import React, { useState, useEffect,useMemo} from 'react';
import DungeonTest from './DungeonTest';
import InventoryShopPage from './InventoryShopPage';
import axios from 'axios';
import { getUserStats, getAvailableClasses, selectClass } from '../services/characterService';
import { computeTotalStats } from '../components/game/EquipmentPanel';
import {getUserEquipment} from "../services/inventoryShopService";


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

  
  // 获取令牌
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

  
  
  // 初始化用户数据
  useEffect(() => {
    const initializeUser = async () => {
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      try {
        // 获取用户统计信息
        const stats = await getUserStats(token);
        console.log('用户统计信息:', stats);
        
        setUserStats({
          ...stats,
          skills: stats.skills || []
        });
        
        // 如果用户没有职业，获取可用职业列表
        if (!stats.hasClass) {
          console.log('用户需要选择职业，获取可用职业');
          setIsSelecting(true);
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
          console.error('获取用户资料失败:', profileErr);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('初始化用户数据失败:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (userInfo?.token) {
      initializeUser();
    }
  }, [userInfo?.token]);
  
  // 选择职业
  const handleClassSelect = async (classSlug) => {
    try {
      setLoading(true);
      const result = await selectClass(token, classSlug);
      setUserStats({ 
        ...userStats,
        ...result.class,
        hasClass: true,
        baseStats: result.class.baseStats || userStats.baseStats 
      });
      setIsSelecting(false);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  // 刷新金币
  const refreshGold = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGold(res.data.gold || 0);
    } catch (err) {
      console.error('刷新金币失败:', err);
    }
  };

  const fetchEquipment = async () => {
    if (!token) return;
    try {
    const equipData = await getUserEquipment(token);
    setEquipment(equipData);
  } catch (err) {
      console.error('拉取装备失败', err);
    }
  };

  const bonusStats = useMemo(() => {
    return equipment ?computeTotalStats(equipment?.slots): { hp:0, attack:0, defense:0, magicPower:0, speed:0,critRate:0,evasion:0 }
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




  // 显示加载中
  if (loading && !userStats) {
    return (
      <div className="game-layout">
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>加载游戏中...</p>
          </div>
        </div>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            background-color: #2c1810;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-content {
            text-align: center;
            color: #ffffff;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid #ffa726;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 职业选择界面
  if (isSelecting && classes.length > 0) {
    return (
      <div className="game-layout">
        <nav className="top-navigation">
          <div className="nav-container">
            <div className="brand">
              <h1 className="brand-title">TaskMasters</h1>
              <span className="brand-subtitle">选择职业</span>
            </div>
          </div>
        </nav>
        
        <div className="class-selection">
          <h2>🧙‍♂️ 选择你的职业</h2>
          <p>选择一个职业开始你的冒险：</p>
          
          <div className="classes-grid">
            {classes.map((characterClass) => (
              <div
                key={characterClass.slug}
                className="class-card"
                onClick={() => handleClassSelect(characterClass.slug)}
              >
                <div className="class-icon">
                  {characterClass.slug === 'warrior' && '⚔️'}
                  {characterClass.slug === 'mage' && '🔮'}
                  {characterClass.slug === 'archer' && '🏹'}
                  {characterClass.slug === 'cleric' && '✨'}
                  {!['warrior', 'mage', 'archer', 'cleric'].includes(characterClass.slug) && '👤'}
                </div>
                <h3>{characterClass.name}</h3>
                <p className="class-description">
                  {characterClass.description || '一位勇敢的冒险者'}
                </p>
                
                <div className="class-stats">
                  <h4>基础属性：</h4>
                  <div className="stats-grid">
                    <div>HP: {characterClass.baseStats?.hp || 0}</div>
                    <div>攻击: {characterClass.baseStats?.attack || 0}</div>
                    <div>防御: {characterClass.baseStats?.defense || 0}</div>
                    <div>速度: {characterClass.baseStats?.speed || 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <style jsx>{`
          .game-layout {
            min-height: 100vh;
            background-color: #2c1810;
            color: #e0e0e0;
            font-family: 'Courier New', monospace;
          }
          
          .top-navigation {
            background-color: #4c2a85;
            border-bottom: 4px solid #6a3bab;
            padding: 12px 0;
          }
          
          .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 16px;
          }
          
          .brand-title {
            margin: 0;
            font-size: 20px;
            color: #ffffff;
          }
          
          .brand-subtitle {
            font-size: 12px;
            color: #b89be6;
          }
          
          .class-selection {
            padding: 40px 20px;
            text-align: center;
            max-width: 1000px;
            margin: 0 auto;
          }
          
          .class-selection h2 {
            margin-bottom: 10px;
          }
          
          .classes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
          }
          
          .class-card {
            background-color: #3a1f6b;
            border: 2px solid #5d3494;
            border-radius: 8px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .class-card:hover {
            background-color: #5d3494;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          }
          
          .class-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          
          .class-card h3 {
            color: #ffffff;
            margin: 10px 0;
          }
          
          .class-description {
            color: #b89be6;
            font-size: 14px;
            margin: 10px 0;
            min-height: 40px;
          }
          
          .class-stats h4 {
            color: #ffffff;
            font-size: 14px;
            margin: 15px 0 10px 0;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px;
            font-size: 12px;
            color: #b89be6;
          }
        `}</style>
      </div>
    );
  }

  // 主游戏界面
  return (
    <div className="game-layout">
      {/* 顶部导航栏 */}
      <nav className="top-navigation">
        <div className="nav-container">
          <div className="brand">
            <h1 className="brand-title">TaskMasters</h1>
            <span className="brand-subtitle">游戏模式</span>
          </div>
          
          <div className="nav-tabs">
            <button
              className={`nav-tab ${currentPage === PAGES.DUNGEON ? 'active' : ''}`}
              onClick={() => setCurrentPage(PAGES.DUNGEON)}
            >
              <div className="tab-icon">⚔️</div>
              <span className="tab-label">迷宫探索</span>
            </button>
            
            <button
              className={`nav-tab ${currentPage === PAGES.INVENTORY ? 'active' : ''}`}
              onClick={() => setCurrentPage(PAGES.INVENTORY)}
            >
              <div className="tab-icon">🎒</div>
              <span className="tab-label">背包商店</span>
            </button>
          </div>
          
          <div className="user-section">
            <div className="gold-display">
              <span className="gold-icon">💰</span>
              <span className="gold-amount">{gold}</span>
            </div>
            {userInfo && (
              <div className="user-info">
                <div className="user-avatar">👤</div>
                <span className="username">{userInfo.username}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 角色状态栏 - 始终可见 */}
      {userStats?.hasClass && (
        <div className="character-status-bar">
          <div className="status-container">
            <div className="character-info">
              <div className="character-portrait">
                {userStats.slug === 'warrior' && '⚔️'}
                {userStats.slug === 'mage' && '🔮'}
                {userStats.slug === 'archer' && '🏹'}
                {userStats.slug === 'cleric' && '✨'}
              </div>
              
              <div className="character-details">
                <h3 className="character-name">{userStats.name}</h3>
                <p className="character-level">
                  等级: {userStats.level || 1} | 经验: {userStats.exp || 0}
                </p>
              </div>
            </div>
            
            <div className="character-stats">
              <div className="stat-item">
                <span className="stat-label">HP</span>
                <span className="stat-value">{(userStats.baseStats?.hp || 100)+ (bonusStats.hp || 0)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">攻击</span>
                <span className="stat-value">{(userStats.baseStats?.attack || 10)+ (bonusStats.attack || 0)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">防御</span>
                <span className="stat-value">{(userStats.baseStats?.defense || 5)+ (bonusStats.defense || 0)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">魔法</span>
                <span className="stat-value">{(userStats.baseStats?.magicPower || 0) + (bonusStats.magicPower || 0)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">速度</span>
                <span className="stat-value">{(userStats.baseStats?.speed || 0)+(bonusStats.speed || 0)}</span>
              </div>
               <div className="stat-item">
                <span className="stat-label">CritRate</span>
                <span className="stat-value">{(userStats.baseStats?.critRate || 0)+(bonusStats.speed || 0)}</span>
              </div>
            </div>
            
            {userStats.unspentPoints > 0 && (
              <div className="unspent-points">
                <span className="points-icon">💪</span>
                <span className="points-text">可用属性点: {userStats.unspentPoints}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 主要内容区域 */}
      <main className="main-content">
        <div className="content-wrapper">
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

      <style jsx>{`
        .game-layout {
          min-height: 100vh;
          background-color: #2c1810;
          font-family: 'Courier New', monospace;
          color: #e0e0e0;
        }

        .top-navigation {
          background-color: #4c2a85;
          border-bottom: 4px solid #6a3bab;
          padding: 12px 0;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .brand {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .brand-title {
          margin: 0;
          font-size: 20px;
          font-weight: bold;
          color: #ffffff;
          text-shadow: 2px 2px 0px #2c1810;
        }

        .brand-subtitle {
          font-size: 12px;
          color: #b89be6;
          font-weight: normal;
        }

        .nav-tabs {
          display: flex;
          gap: 8px;
          background-color: #3a1f6b;
          padding: 4px;
          border-radius: 8px;
          border: 2px solid #5d3494;
        }

        .nav-tab {
          background-color: transparent;
          border: none;
          border-radius: 6px;
          padding: 10px 16px;
          color: #b89be6;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Courier New', monospace;
          font-weight: 500;
          font-size: 14px;
        }

        .nav-tab:hover {
          background-color: #5d3494;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .nav-tab.active {
          background-color: #7e4ab8;
          color: #ffffff;
          box-shadow: 
            inset 0 0 0 2px #9866d4,
            0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .tab-icon {
          font-size: 16px;
          line-height: 1;
        }

        .tab-label {
          font-size: 14px;
          white-space: nowrap;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .gold-display {
          background-color: #ffa726;
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #2c1810;
          font-weight: bold;
          font-size: 14px;
          border: 2px solid #ff8f00;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .gold-icon {
          font-size: 16px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #5d3494;
          border-radius: 8px;
          padding: 8px 12px;
          border: 2px solid #7e4ab8;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .user-avatar {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background-color: #7e4ab8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          border: 1px solid #9866d4;
        }

        .username {
          font-size: 13px;
          font-weight: 500;
          color: #e0e0e0;
        }

        .character-status-bar {
          background-color: #f5f5f5;
          border-bottom: 3px solid #7e4ab8;
          padding: 12px 0;
          color: #2c1810;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .status-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .character-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .character-portrait {
          width: 48px;
          height: 48px;
          background-color: #4c2a85;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          border: 2px solid #5d3494;
          color: #ffffff;
        }

        .character-details h3 {
          margin: 0;
          font-size: 18px;
          font-weight: bold;
        }

        .character-level {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #666;
        }

        .character-stats {
          display: flex;
          gap: 16px;
        }

        .stat-item {
          text-align: center;
          padding: 6px 12px;
          background-color: #e8e8e8;
          border-radius: 6px;
          border: 1px solid #ccc;
        }

        .stat-label {
          display: block;
          font-size: 11px;
          color: #666;
          font-weight: 500;
        }

        .stat-value {
          display: block;
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-top: 2px;
        }

        .unspent-points {
          background-color: #4caf50;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: bold;
          border: 2px solid #388e3c;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .main-content {
          min-height: calc(100vh - 200px);
          background-color: #1a0f12;
          padding: 16px;
        }

        .content-wrapper {
          max-width: ${currentPage === PAGES.DUNGEON ? '800px' : '1200px'};
          margin: 0 auto;
          background-color: ${currentPage === PAGES.DUNGEON ? 'transparent' : '#f5f5f5'};
          ${currentPage === PAGES.INVENTORY ? `
            border-radius: 12px;
            border: 3px solid #7e4ab8;
            padding: 16px;
            color: #2c1810;
          ` : ''}
        }

        /* 响应式设计 */
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