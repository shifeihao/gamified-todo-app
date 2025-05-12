import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';

// 卡片选择组件：可显示空白卡片数或奖励卡片列表
export const CardSelector = ({
  onSelect,
  selectedCard,
  showRewards = false,   // 是否显示奖励卡片列表
  taskType = 'short'       // 任务类型，用于过滤奖励卡
}) => {
  const { user } = useContext(AuthContext);
  const [cards, setCards] = useState([]);
  const [dailyCards, setDailyCards] = useState(0);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        console.log(`CardSelector - 开始获取卡片，任务类型: ${taskType}, 是否显示奖励卡: ${showRewards}`);
        
        // 直接使用axios，确保获取完整数据
        const response = await axios.get('/api/cards/inventory', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        const data = response.data;
        console.log("CardSelector - 获取到的完整卡片数据:", data);
        
        // 确保数据存在再设置
        if (data && data.inventory) {
          // 存储所有卡片数据
          setCards(data.inventory || []);
          
          // 输出完整的特殊卡片信息，帮助调试
          if (showRewards) {
            console.log("CardSelector - 所有特殊卡片:");
            data.inventory
              .filter(card => card.type === 'special' && !card.used)
              .forEach(card => {
                console.log(`  ID: ${card._id}, 标题: ${card.title}, 时长: ${card.taskDuration}`);
              });
              
            // 输出当前任务类型匹配的卡片
            const matchingCards = data.inventory.filter(card => 
              card.type === 'special' && 
              !card.used && 
              (card.taskDuration === taskType || card.taskDuration === 'general')
            );
            
            console.log(`CardSelector - 匹配当前任务类型(${taskType})的特殊卡片数量: ${matchingCards.length}`);
            matchingCards.forEach(card => {
              console.log(`  匹配的卡片 - ID: ${card._id}, 标题: ${card.title}, 时长: ${card.taskDuration}`);
            });
          }
        } else {
          console.warn("卡片库存数据为空");
          setCards([]);
        }
        
        // 设置每日卡片数量
        if (data && data.dailyCards) {
          setDailyCards(data.dailyCards.blank || 0);
        } else {
          console.warn("每日卡片数据为空");
          setDailyCards(0);
        }
        
        console.log("CardSelector - 设置空白卡数量:", data?.dailyCards?.blank || 0);
        console.log("CardSelector - 卡片库存数量:", data?.inventory?.length || 0);
      } catch (error) {
        console.error('CardSelector - 获取卡片失败:', error);
      }
    };
    
    if (user && user.token) {
      fetchCards();
    }
  }, [user, taskType, showRewards]); // 添加showRewards作为依赖，确保显示模式变化时重新获取

  const getCardColor = (type) => {
    switch (type) {
      case 'blank': return 'bg-gray-100';
      case 'special': return 'bg-purple-100';
      default: return 'bg-white';
    }
  };

  // 过滤奖励卡：special 且 duration 匹配或通用
  // 添加详细的日志，确保过滤逻辑正确
  const getRewardCards = () => {
    console.log(`CardSelector - 筛选奖励卡片, 当前任务类型: ${taskType}, 总卡片数: ${cards.length}`);
    
    const filteredCards = cards.filter(card => {
      const isSpecial = card.type === 'special';
      const isNotUsed = !card.used;
      const durationMatch = card.taskDuration === taskType || card.taskDuration === 'general';
      const result = isSpecial && isNotUsed && durationMatch;
      
      if (isSpecial && isNotUsed) {
        console.log(`  卡片 ${card._id} (${card.title}): 类型=${card.type}, 时长=${card.taskDuration}, 匹配=${result}`);
      }
      
      return result;
    });
    
    console.log(`CardSelector - 筛选后的奖励卡片数量: ${filteredCards.length}`);
    return filteredCards;
  };
  
  const rewardCards = showRewards ? getRewardCards() : [];

  return (
    <div className="mb-4">
      {/* 仅在未开启奖励卡模式时显示空白卡数量 */}
      {!showRewards && (
          <div className="text-sm font-medium mb-2">
            Blank cards available: {dailyCards}
          </div>
      )}
      {showRewards && (
        <div className="grid grid-cols-3 gap-4">
          {rewardCards.map(card => (
            <div
              key={card._id}
              onClick={() => onSelect(card)}
              className={`p-4 rounded-lg cursor-pointer border-2 ${
                selectedCard?._id === card._id
                  ? 'border-blue-500'
                  : 'border-transparent'
              } ${getCardColor(card.type)}`}
            >
              <h3 className="font-medium">{card.title}</h3>
              {card.description && (
                <p className="text-sm text-gray-600">{card.description}</p>
              )}
              <div className="mt-1 text-xs font-medium">
                {card.taskDuration === 'short' ? 'Short-term Card' : card.taskDuration === 'long' ? 'Long-term Card' : 'General Card'}
              </div>
              {card.type === 'special' && card.bonus && (
                <div className="mt-2 text-xs text-purple-600">
                  Experience Multiplier: {card.bonus.experienceMultiplier}x，Coins Multiplier: {card.bonus.goldMultiplier}x
                </div>
              )}
            </div>
          ))}
          {rewardCards.length === 0 && (
            <div className="col-span-3 text-gray-500 text-sm">
              No rewards cards available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
