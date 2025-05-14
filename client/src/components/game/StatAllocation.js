import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 属性点换算比例
const STAT_MULTIPLIERS = {
  hp: 15,
  attack: 1,
  defense: 1,
  magicPower: 1,
  speed: 0.5,
  critRate: 0.2,
  evasion: 0.2
};

// 属性中文名称
const STAT_NAMES = {
  hp: 'HP',
  attack: '攻击',
  defense: '防御',
  magicPower: '魔法',
  speed: '速度',
  critRate: '暴击率',
  evasion: '闪避率'
};

// 像素风的属性背景颜色
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
  
  // 获取令牌
  const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
  const token = userInfo?.token || null;
  
  // 加载属性数据
  useEffect(() => {
    const fetchStatData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/character/stat-allocation', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCurrentStats(response.data.assignedStats || {});
        setUnspentPoints(response.data.unspentPoints || 0);
        
        // 初始化分配对象
        const initialAllocation = {};
        Object.keys(STAT_MULTIPLIERS).forEach(stat => {
          initialAllocation[stat] = 0;
        });
        setAllocation(initialAllocation);
        
        setLoading(false);
      } catch (err) {
        console.error('获取属性数据失败:', err);
        setError('获取属性数据失败，请刷新页面重试');
        setLoading(false);
      }
    };
    
    if (token) {
      fetchStatData();
    }
  }, [token]);
  
  // 计算总分配点数
  const getTotalAllocated = () => {
    return Object.values(allocation).reduce((sum, value) => sum + (value || 0), 0);
  };
  
  // 增加属性点
  const handleIncrement = (stat) => {
    if (getTotalAllocated() < unspentPoints) {
      const newAllocation = {
        ...allocation,
        [stat]: (allocation[stat] || 0) + 1
      };
      setAllocation(newAllocation);
      setShowSubmit(true); // 显示提交按钮
    }
  };
  
  // 减少属性点
  const handleDecrement = (stat) => {
    if ((allocation[stat] || 0) > 0) {
      const newAllocation = {
        ...allocation,
        [stat]: (allocation[stat] || 0) - 1
      };
      setAllocation(newAllocation);
      
      // 如果没有任何分配点数，隐藏提交按钮
      if (Object.values(newAllocation).every(value => value === 0)) {
        setShowSubmit(false);
      }
    }
  };
  
  // 提交分配
  const handleSubmit = async () => {
    try {
      // 验证是否有分配点数
      if (getTotalAllocated() <= 0) {
        setError('请至少分配1点属性点');
        return;
      }
      
      setLoading(true);
      const response = await axios.post(
        '/api/character/allocate-stats',
        { allocation },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // 更新状态
      setCurrentStats(response.data.assignedStats);
      setUnspentPoints(response.data.unspentPoints);
      
      // 重置分配
      const resetAllocation = {};
      Object.keys(allocation).forEach(stat => {
        resetAllocation[stat] = 0;
      });
      setAllocation(resetAllocation);
      setShowSubmit(false);
      
      setSuccess('属性点分配成功！');
      setTimeout(() => {
        setSuccess(null);
        if (response.data.unspentPoints <= 0) {
          onClose(); // 如果没有未分配点数了，自动关闭
        }
      }, 1500);
      
      setLoading(false);
    } catch (err) {
      console.error('属性分配失败:', err);
      setError(err.response?.data?.error || '属性分配失败，请重试');
      setLoading(false);
      setTimeout(() => setError(null), 3000);
    }
  };
  
  if (loading && Object.keys(currentStats).length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: '#2c1810',
        borderRadius: '12px',
        color: '#e0e0e0'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        <div>加载中...</div>
      </div>
    );
  }
  
  return (
    <div style={{
      backgroundColor: '#3a1f6b',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      border: '2px solid #5d3494',
      color: '#e0e0e0',
      fontFamily: 'Courier New, monospace'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h2 style={{ margin: 0, color: '#ffffff' }}>属性点分配</h2>
        <div style={{
          backgroundColor: '#4caf50',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontWeight: 'bold',
          border: '2px solid #388e3c'
        }}>
          可用点数: {unspentPoints - getTotalAllocated()}
        </div>
      </div>
      
      {error && (
        <div style={{
          backgroundColor: '#d32f2f',
          color: '#ffffff',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '15px',
          border: '2px solid #b71c1c'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{
          backgroundColor: '#2e7d32',
          color: '#ffffff',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '15px',
          border: '2px solid #1b5e20'
        }}>
          {success}
        </div>
      )}
      
      {/* 主要属性网格 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '15px',
        marginBottom: '15px'
      }}>
        {Object.keys(STAT_MULTIPLIERS).map(stat => (
          <div 
            key={stat} 
            style={{ 
              backgroundColor: STAT_COLORS[stat],
              padding: '12px',
              borderRadius: '8px',
              position: 'relative',
              border: '2px solid rgba(255,255,255,0.1)',
              color: '#ffffff'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {STAT_NAMES[stat]}
            </div>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '18px',
              marginTop: '5px',
              marginBottom: '5px'
            }}>
              {Math.round((currentStats[stat] || 0) * 10) / 10}
              {allocation[stat] > 0 && (
                <span style={{ color: '#81c784', marginLeft: '5px' }}>
                  +{Math.round((allocation[stat] * STAT_MULTIPLIERS[stat]) * 10) / 10}
                  {(stat === 'critRate' || stat === 'evasion') ? '%' : ''}
                </span>
              )}
            </div>
            
            {unspentPoints > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                <button 
                  onClick={() => handleDecrement(stat)}
                  disabled={allocation[stat] <= 0}
                  style={{
                    backgroundColor: allocation[stat] <= 0 ? '#666' : '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: allocation[stat] <= 0 ? 'not-allowed' : 'pointer',
                    opacity: allocation[stat] <= 0 ? 0.5 : 1,
                    fontFamily: 'Courier New, monospace',
                    fontWeight: 'bold'
                  }}
                >
                  -
                </button>
                <div style={{ 
                  margin: '0 8px',
                  width: '24px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  backgroundColor: '#2c1810',
                  borderRadius: '4px',
                  padding: '2px'
                }}>
                  {allocation[stat] || 0}
                </div>
                <button 
                  onClick={() => handleIncrement(stat)}
                  disabled={getTotalAllocated() >= unspentPoints}
                  style={{
                    backgroundColor: getTotalAllocated() >= unspentPoints ? '#666' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: getTotalAllocated() >= unspentPoints ? 'not-allowed' : 'pointer',
                    opacity: getTotalAllocated() >= unspentPoints ? 0.5 : 1,
                    fontFamily: 'Courier New, monospace',
                    fontWeight: 'bold'
                  }}
                >
                  +
                </button>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#b89be6', 
                  marginLeft: '8px' 
                }}>
                  (1点 = {STAT_MULTIPLIERS[stat]}{(stat === 'critRate' || stat === 'evasion') ? '%' : ''})
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 提交按钮 */}
      {showSubmit && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={handleSubmit}
            disabled={getTotalAllocated() <= 0 || loading}
            style={{
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 25px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'Courier New, monospace',
              border: '2px solid #1976d2',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#1976d2';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#2196f3';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {loading ? '提交中...' : '确认分配'}
          </button>
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={onClose}
          style={{
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 20px',
            cursor: 'pointer',
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            border: '2px solid #616161',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#616161';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#757575';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          返回游戏
        </button>
      </div>
    </div>
  );
};

export default StatAllocation;