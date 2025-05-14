import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import axios from 'axios';
import { RewardCardTile } from '../task/RewardCardTile'; // 引入RewardCardTile组件

// 卡片选择组件：可显示空白卡片数或奖励卡片列表
export const CardSelector = ({
  onSelect,
  selectedCard,
  showRewards = false,   // 是否显示奖励卡片列表
  taskType = 'short',     // 任务类型，用于过滤奖励卡
  disabled = false
}) => {
  const { user } = useContext(AuthContext);
  const [cards, setCards] = useState([]);
  const [dailyCards, setDailyCards] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setIsLoading(true);
        
        // 直接使用axios，确保获取完整数据
        const response = await axios.get('/api/cards/inventory', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        const data = response.data;
        
        // 确保数据存在再设置
        if (data && data.inventory) {
          // 存储所有卡片数据
          setCards(data.inventory || []);
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
        
      } catch (error) {
        console.error('CardSelector - Failed to obtain card:', error);
        // Error handling: make sure default value is set
        setCards([]);
        setDailyCards(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && user.token) {
      fetchCards();
    }
  }, [user, taskType, showRewards]);

  const getCardColor = (type) => {
    switch (type) {
      case 'blank': return 'bg-gray-100';
      case 'special': return 'bg-purple-100 text-purple-800';
      default: return 'bg-white';
    }
  };

  // Filter reward cards: special and duration matches or universal
  const getRewardCards = () => {
    return cards.filter(card => 
      card.type === 'special' && 
      !card.used && 
      (card.taskDuration === taskType || card.taskDuration === 'general')
    );
  };
  
  const rewardCards = showRewards ? getRewardCards() : [];

  if (isLoading) {
    return <div className="mb-4">Loading cards...</div>;
  }

  return (
    <div className="mb-4" data-testid="card-selector">
      {/* Display the number of blank cards only when the reward card mode is not turned on */}
      {!showRewards && (
          <div className="text-sm font-medium mb-2">
            Blank cards available: {dailyCards}
          </div>
      )}
      {showRewards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewardCards.length > 0 ? (
            rewardCards.map(card => (
              <RewardCardTile
                key={card._id}
                card={card}
                isSelected={selectedCard?._id === card._id}
                onClick={() => onSelect(card)}
                readOnly={disabled}
              />
            ))
          ) : (
            <div className="col-span-2 text-gray-500 text-sm">
              No rewards cards available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
