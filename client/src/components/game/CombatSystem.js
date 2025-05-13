import React, { useState, useEffect, useRef } from 'react';

// 职业战斗配置
const CLASS_COMBAT_CONFIG = {
  warrior: {
    name: '战士',
    getDamage: (playerStats) => {
      return Math.floor((playerStats.attack || 10) * (0.7 + Math.random() * 0.2));
    },
    reduceDamage: (damage, playerStats) => {
      const defenseReduction = Math.floor((playerStats.defense || 5) * 0.35);
      return Math.max(1, damage - defenseReduction);
    },
    getCritChance: (playerStats) => {
      return playerStats.critRate || 5;
    }
  },
  mage: {
    name: '法师',
    getDamage: (playerStats) => {
      return Math.floor((playerStats.magicPower || 10) * (0.9 + Math.random() * 0.6));
    },
    reduceDamage: (damage, playerStats) => {
      const defenseReduction = Math.floor((playerStats.defense || 5) * 0.2);
      return Math.max(1, damage - defenseReduction);
    },
    getCritChance: (playerStats) => {
      return (playerStats.critRate || 5) + 5; // 法师基础暴击率略高
    }
  },
  rogue: {
    name: '盗贼',
    getDamage: (playerStats) => {
      const speedBonus = Math.floor((playerStats.speed || 5) * 0.2);
      return Math.floor((playerStats.attack || 10) * 0.6 + speedBonus + (Math.random() * 5));
    },
    reduceDamage: (damage, playerStats) => {
      const defenseReduction = Math.floor((playerStats.defense || 5) * 0.25);
      return Math.max(1, damage - defenseReduction);
    },
    getCritChance: (playerStats) => {
      return (playerStats.critRate || 5) + 10;
    },
    getEvasionBonus: (playerStats) => {
      return (playerStats.speed || 5) * 0.5;
    }
  },
  archer: {
    name: '弓手',
    getDamage: (playerStats) => {
      const critBonus = Math.floor((playerStats.critRate || 5) * 0.3);
      return Math.floor((playerStats.attack || 10) * 0.7 + critBonus + (Math.random() * 3));
    },
    reduceDamage: (damage, playerStats) => {
      const defenseReduction = Math.floor((playerStats.defense || 5) * 0.25);
      return Math.max(1, damage - defenseReduction);
    },
    getCritChance: (playerStats, isFirstAttack) => {
      return (playerStats.critRate || 5) + (isFirstAttack ? 20 : 0);
    }
  }
};

// 将英文类名转换为slug
const getClassSlugFromName = (className) => {
  if (!className) return 'warrior';
  const name = className.toLowerCase();
  if (name === 'mage') return 'mage';
  if (name === 'rogue') return 'rogue';
  if (name === 'archer') return 'archer';
  return 'warrior';
};

const CombatSystem = ({ 
  monsters, 
  playerStats, 
  playerClass = "warrior", 
  playerClassName,
  onCombatEnd,
  skills = [],
  userToken // 新增：用户token用于API调用
}) => {
  // 如果提供了className但没有classSlug，则转换
  const actualPlayerClass = playerClass || getClassSlugFromName(playerClassName);
  
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(playerStats.hp);
  const [monsterHp, setMonsterHp] = useState(100);
  const [combatLogs, setCombatLogs] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [combatEnded, setCombatEnded] = useState(false);
  const [showDamage, setShowDamage] = useState(null);
  const [isFirstAttack, setIsFirstAttack] = useState(true);
  const [currentTurn, setCurrentTurn] = useState(0);
  
  // 技能和状态效果相关状态
  const [activeSkills, setActiveSkills] = useState(skills || []);
  const [skillCooldowns, setSkillCooldowns] = useState({});
  const [monsterStatuses, setMonsterStatuses] = useState({});
  const [playerStatuses, setPlayerStatuses] = useState({});
  const [skillTriggeredEffects, setSkillTriggeredEffects] = useState([]);
  
  // 新增：掉落相关状态
  const [dropResults, setDropResults] = useState(null);
  const [showDropAnimation, setShowDropAnimation] = useState(false);
  const [isProcessingDrops, setIsProcessingDrops] = useState(false);
  
  const currentMonster = monsters[currentMonsterIndex];
  const logsEndRef = useRef(null);

  // 获取当前职业配置
  const classConfig = CLASS_COMBAT_CONFIG[actualPlayerClass] || CLASS_COMBAT_CONFIG.warrior;
  
  // 初始化战斗状态
  useEffect(() => {
    // 初始化技能冷却
    const initialCooldowns = {};
    activeSkills.forEach(skill => {
      initialCooldowns[skill.id || skill._id] = 0;
    });
    setSkillCooldowns(initialCooldowns);
    
    // 战斗开始日志
    setCombatLogs([
      `开始战斗! 职业: ${classConfig.name}`,
      `可用技能: ${activeSkills.map(s => s.name).join(', ') || '无'}`
    ]);
    
    // 触发战斗开始技能
    triggerSkills('onStartBattle', null);
  }, [activeSkills, classConfig.name]);
  
  // 滚动到日志底部
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combatLogs]);
  
  // 技能触发处理函数
  const triggerSkills = (triggerType, context) => {
    // 过滤出可触发的技能
    const triggeredSkills = activeSkills.filter(skill => {
      // 检查技能触发类型匹配
      if (skill.trigger !== triggerType) return false;
      
      // 检查技能是否在冷却中
      const skillId = skill.id || skill._id;
      if (skillCooldowns[skillId] > 0) return false;
      
      // 检查技能是否已经是一次性的且已使用
      if (skill.once && playerStatuses[`used_${skillId}`]) return false;
      
      // 检查特殊触发条件
      if (triggerType === 'onHpBelow' && skill.triggerCondition?.hpBelow) {
        const hpPercentage = playerHp / playerStats.hp;
        if (hpPercentage > skill.triggerCondition.hpBelow) return false;
      }
      
      return true;
    });
    
    // 按优先级排序
    triggeredSkills.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // 应用技能效果
    const effects = triggeredSkills.map(skill => {
      const skillId = skill.id || skill._id;
      
      // 设置冷却
      setSkillCooldowns(prev => ({ 
        ...prev, 
        [skillId]: skill.cooldown || 0 
      }));
      
      // 标记一次性技能已使用
      if (skill.once) {
        setPlayerStatuses(prev => ({ 
          ...prev, 
          [`used_${skillId}`]: true 
        }));
      }
      
      // 创建效果对象
      const effectObj = {
        name: skill.name,
        effect: skill.effect,
        value: skill.effectValue,
        source: 'player',
        skillId
      };
      
      // 添加到日志
      let logMessage = '';
      switch (skill.effect) {
        case 'dealDamage':
          logMessage = `🔥 发动技能 "${skill.name}"，造成了 ${skill.effectValue} 点伤害！`;
          break;
        case 'gainShield':
          logMessage = `🛡️ 发动技能 "${skill.name}"，获得了 ${skill.effectValue} 点护盾！`;
          break;
        case 'heal':
          logMessage = `💚 发动技能 "${skill.name}"，恢复了 ${skill.effectValue} 点生命！`;
          break;
        case 'buffAttack':
          logMessage = `⚔️ 发动技能 "${skill.name}"，攻击力提升了 ${skill.effectValue}！`;
          break;
        case 'debuffEnemy':
          logMessage = `⬇️ 发动技能 "${skill.name}"，降低了敌人属性 ${skill.effectValue}！`;
          break;
        default:
          logMessage = `✨ 发动技能 "${skill.name}"！`;
      }
      
      setCombatLogs(prev => [...prev, logMessage]);
      
      // 特殊状态效果处理
      if (skill.triggerCondition?.applyStatus) {
        const statusType = skill.triggerCondition.applyStatus;
        setMonsterStatuses(prev => ({
          ...prev,
          [statusType]: {
            duration: 3, // 默认3回合
            source: 'player'
          }
        }));
        
        // 添加状态效果日志
        let statusMessage = '';
        switch (statusType) {
          case 'bleed':
            statusMessage = `🩸 ${currentMonster.name} 开始流血！`;
            break;
          case 'poison':
            statusMessage = `☠️ ${currentMonster.name} 中毒了！`;
            break;
          case 'confusion':
            statusMessage = `😵 ${currentMonster.name} 陷入混乱！`;
            break;
          default:
            statusMessage = `⚡ ${currentMonster.name} 受到了 ${statusType} 效果！`;
        }
        
        setCombatLogs(prev => [...prev, statusMessage]);
      }
      
      return effectObj;
    });
    
    setSkillTriggeredEffects(effects);
    return effects;
  };
  
  // 应用技能效果
  const applySkillEffects = (effects, target) => {
    effects.forEach(effect => {
      switch (effect.effect) {
        case 'dealDamage':
          if (target === 'monster') {
            setMonsterHp(prev => Math.max(0, prev - effect.value));
          } else {
            setPlayerHp(prev => Math.max(0, prev - effect.value));
          }
          break;
        case 'gainShield':
          // 护盾效果 - 这里简化为增加HP
          setPlayerHp(prev => Math.min(playerStats.hp, prev + effect.value));
          break;
        case 'heal':
          setPlayerHp(prev => Math.min(playerStats.hp, prev + effect.value));
          break;
        // 其他效果可以继续扩展...
      }
    });
  };
  
  // 处理状态效果
  const processStatusEffects = () => {
    // 处理怪物状态效果
    Object.entries(monsterStatuses).forEach(([statusType, status]) => {
      if (status.duration <= 0) {
        // 移除过期状态
        setMonsterStatuses(prev => {
          const newStatuses = {...prev};
          delete newStatuses[statusType];
          return newStatuses;
        });
        return;
      }
      
      // 应用状态效果
      switch (statusType) {
        case 'bleed':
          const bleedDamage = Math.floor(5 + (currentTurn * 1.5)); // 流血伤害随回合增加
          setMonsterHp(prev => Math.max(0, prev - bleedDamage));
          setCombatLogs(prev => [...prev, `🩸 流血效果: ${currentMonster.name} 受到 ${bleedDamage} 点伤害`]);
          break;
        case 'poison':
          const poisonDamage = 8; // 固定毒药伤害
          setMonsterHp(prev => Math.max(0, prev - poisonDamage));
          setCombatLogs(prev => [...prev, `☠️ 中毒效果: ${currentMonster.name} 受到 ${poisonDamage} 点伤害`]);
          break;
      }
      
      // 减少状态持续时间
      setMonsterStatuses(prev => ({
        ...prev,
        [statusType]: {
          ...status,
          duration: status.duration - 1
        }
      }));
    });
  };
  
  // 更新技能冷却
  const updateCooldowns = () => {
    setSkillCooldowns(prev => {
      const newCooldowns = {...prev};
      
      Object.keys(newCooldowns).forEach(skillId => {
        if (newCooldowns[skillId] > 0) {
          newCooldowns[skillId]--;
        }
      });
      
      return newCooldowns;
    });
  };
  
  // 新增：处理掉落的函数
const handleDropProcessing = async () => {
    if (isProcessingDrops) return; // 防止重复调用
    
    try {
      setIsProcessingDrops(true);
      
      // 显示掉落处理信息
      setCombatLogs(prev => [...prev, '💎 正在计算战利品...']);
      
      // 获取所有被击败的怪物ID，增强兼容性
      const monsterIds = monsters.map(monster => {
        // 优先使用 _id，如果没有则使用 id
        const id = monster._id || monster.id;
        
        // 确保ID是字符串格式
        if (id && typeof id === 'object' && id.$oid) {
          // 处理特殊的ObjectId格式
          return id.$oid;
        }
        
        return typeof id === 'object' ? String(id) : id;
      }).filter(id => id); // 过滤掉无效的ID

      console.log('=== FRONTEND DROP DEBUG ===');
      console.log('原始怪物数据:', monsters);
      console.log('提取的ID:', monsterIds);
      console.log('有效ID数量:', monsterIds.length);
      console.log('怪物数量:', monsters.length);
      
      // 验证ID格式
      const invalidIds = monsterIds.filter(id => {
        // 检查是否为有效的ObjectId格式（24位hex字符串）
        return !id || typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id);
      });
      
      if (invalidIds.length > 0) {
        console.error('发现无效的怪物ID:', invalidIds);
        throw new Error(`发现 ${invalidIds.length} 个无效的怪物ID`);
      }
      
      if (monsterIds.length !== monsters.length) {
        console.warn(`怪物ID数量(${monsterIds.length})与怪物数量(${monsters.length})不匹配`);
        const missingIds = monsters.filter(monster => !monster._id && !monster.id);
        console.error('缺少ID的怪物:', missingIds);
        throw new Error('部分怪物缺少有效的ID');
      }
      
      console.log('请求payload:', JSON.stringify({ monsterIds }, null, 2));
      
      const response = await fetch('/api/cards/process-drops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          monsterIds: monsterIds
        })
      });
      
      if (!response.ok) {
        // 尝试获取错误详情
        let errorMessage = `掉落处理失败: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `掉落处理失败: ${errorData.error}`;
            if (errorData.details) {
              console.error('错误详情:', errorData.details);
            }
          }
        } catch (e) {
          console.error('无法解析错误响应:', e);
        }
        throw new Error(errorMessage);
      }
      
      const dropData = await response.json();
      
      if (dropData.success) {
        setDropResults(dropData.data);
        
        // 显示掉落结果in logs
        const logs = [];
        if (dropData.data.gold > 0) {
          logs.push(`💰 获得 ${dropData.data.gold} 金币`);
        }
        if (dropData.data.exp > 0) {
          logs.push(`✨ 获得 ${dropData.data.exp} 经验`);
        }
        if (dropData.data.items && dropData.data.items.length > 0) {
          logs.push(`🎒 获得物品: ${dropData.data.items.map(item => item.name).join(', ')}`);
        }
        if (dropData.data.cards && dropData.data.cards.length > 0) {
          logs.push(`🃏 获得任务卡片: ${dropData.data.cards.map(card => card.title).join(', ')}`);
        }
        
        setCombatLogs(prev => [...prev, ...logs]);
        
        // 显示掉落动画
        setShowDropAnimation(true);
        
        // 3秒后关闭动画并结束战斗
        setTimeout(() => {
          setShowDropAnimation(false);
          // 结束战斗，传递掉落结果
          onCombatEnd({ 
            result: 'victory', 
            remainingHp: playerHp,
            drops: dropData.data
          });
        }, 3000);
      } else {
        throw new Error(dropData.message || '掉落处理失败');
      }
    } catch (error) {
      console.error('掉落处理错误:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        monsters: monsters,
        monstersWithIds: monsters.map(m => ({ name: m.name, _id: m._id, id: m.id }))
      });
      
      setCombatLogs(prev => [...prev, `❌ 掉落处理出错: ${error.message}`]);
      
      // 即使掉落处理失败，也要结束战斗
      setTimeout(() => {
        onCombatEnd({ 
          result: 'victory', 
          remainingHp: playerHp
        });
      }, 1500);
    } finally {
      setIsProcessingDrops(false);
    }
  };
  
  // 处理回合制战斗
  useEffect(() => {
    if (skills && skills.length > 0) {
      const triggerTypes = {};
      skills.forEach(skill => {
        const trigger = skill.trigger || "未设置";
        triggerTypes[trigger] = (triggerTypes[trigger] || 0) + 1;
      });
    }
    
    if (combatEnded) return;
    
    // 玩家回合
    if (isPlayerTurn) {
      const timer = setTimeout(() => {
        // 增加回合计数
        setCurrentTurn(prev => prev + 1);
        
        // 处理状态效果
        processStatusEffects();
        
        // 根据职业计算伤害
        const baseDamage = classConfig.getDamage(playerStats);
        
        // 暴击检测
        const critChance = typeof classConfig.getCritChance === 'function' 
          ? classConfig.getCritChance(playerStats, isFirstAttack)
          : (playerStats.critRate || 5);
        
        const isCritical = Math.random() * 100 < critChance;
        let damage = baseDamage;
        
        if (isCritical) {
          damage = Math.floor(damage * 1.5);
        }
        
        // 触发攻击技能
        const attackSkillEffects = triggerSkills('onAttack', { isCritical });
        
        // 计算技能额外伤害
        let skillDamage = 0;
        attackSkillEffects.forEach(effect => {
          if (effect.effect === 'dealDamage') {
            skillDamage += effect.value;
          }
        });
        
        // 总伤害
        const totalDamage = damage + skillDamage;
        
        setShowDamage({ target: 'monster', value: totalDamage });
        setIsAttacking(true);
        
        setTimeout(() => {
          setIsAttacking(false);
          setShowDamage(null);
          
          const newMonsterHp = Math.max(0, monsterHp - totalDamage);
          setMonsterHp(newMonsterHp);
          
          // 创建日志消息
          let logMessage = `🗡️ 你攻击了 ${currentMonster.name}，造成了 ${totalDamage} 点伤害！`;
          if (isCritical) {
            logMessage = `CRITICAL! ${logMessage}`;
          }
          
          // 如果有技能触发，添加伤害分析
          if (skillDamage > 0) {
            logMessage += ` (技能: ${skillDamage}, 基础: ${damage})`;
          }
          
          setCombatLogs(prev => [...prev, logMessage]);
          
          // 检查怪物是否被击败
          if (newMonsterHp <= 0) {
            setCombatLogs(prev => [...prev, `💥 你击败了 ${currentMonster.name}！`]);
            
            // 检查是否所有怪物都被击败
            if (currentMonsterIndex >= monsters.length - 1) {
              // 所有怪物都被击败，处理掉落
              setCombatEnded(true);
              handleDropProcessing();
            } else {
              // 移至下一个怪物
              setCurrentMonsterIndex(prev => prev + 1);
              setMonsterHp(100);
              setIsPlayerTurn(true); // 玩家对新怪物先手
              setIsFirstAttack(true); // 重置首次攻击标志
              
              // 重置怪物状态
              setMonsterStatuses({});
            }
          } else {
            setIsFirstAttack(false); // 非首次攻击
            setIsPlayerTurn(false);
            
            // 更新技能冷却
            updateCooldowns();
          }
        }, 600);
      }, 1000);
      
      return () => clearTimeout(timer);
    } 
    // 怪物回合
    else {
      const timer = setTimeout(() => {
        // 闪避检测
        const baseEvasion = playerStats.evasion || 0;
        const bonusEvasion = actualPlayerClass === 'rogue' && classConfig.getEvasionBonus 
          ? classConfig.getEvasionBonus(playerStats) 
          : 0;
        
        const totalEvasion = baseEvasion + bonusEvasion;
        const isEvaded = Math.random() * 100 < totalEvasion;
        
        if (isEvaded) {
          // 闪避成功
          setCombatLogs(prev => [...prev, `EVADE! 👹 ${currentMonster.name} 的攻击被你闪避了！`]);
          
          // 触发受击闪避技能
          const evadeSkillEffects = triggerSkills('onReceiveHit', { evaded: true });
          
          setIsPlayerTurn(true);
        } else {
          // 计算怪物伤害
          const monsterDamage = Math.floor(((currentMonster.attack || 8) * (0.7 + Math.random() * 0.5)));
          
          // 触发受击技能
          const hitSkillEffects = triggerSkills('onReceiveHit', { evaded: false });
          
          // 计算减伤后的伤害
          const reducedDamage = classConfig.reduceDamage(monsterDamage, playerStats);
          setShowDamage({ target: 'player', value: reducedDamage });
          
          setTimeout(() => {
            setShowDamage(null);
            
            // 应用技能效果
            applySkillEffects(hitSkillEffects, 'player');
            
            const newPlayerHp = Math.max(0, playerHp - reducedDamage);
            setPlayerHp(newPlayerHp);
            
            // 日志显示原伤害和减免后伤害
            const damageReduction = monsterDamage - reducedDamage;
            let logMessage = `👹 ${currentMonster.name} 攻击了你，造成了 ${reducedDamage} 点伤害！`;
            
            setCombatLogs(prev => [...prev, logMessage]);
            
            if (damageReduction > 0) {
              setCombatLogs(prev => [...prev, `🛡️ 你的防御减免了 ${damageReduction} 点伤害`]);
            }
            
            // 检查血量低于阈值的技能
            if (newPlayerHp < playerStats.hp * 0.5) {
              const lowHpSkillEffects = triggerSkills('onHpBelow', { 
                hpPercentage: newPlayerHp / playerStats.hp 
              });
              
              // 应用低血量触发的技能效果
              applySkillEffects(lowHpSkillEffects, 'player');
            }
            
            // 检查玩家是否被击败 (HP为0)
            if (newPlayerHp <= 0) {
              setCombatLogs(prev => [...prev, `💀 你被 ${currentMonster.name} 击败了！`]);
              setCombatEnded(true);
              setTimeout(() => {
                // 在这里不是GameOver，而是自动结算
                onCombatEnd({ 
                  result: 'settlement', 
                  remainingHp: 0
                });
              }, 1500);
            } else {
              setIsPlayerTurn(true);
            }
          }, 600);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [
    isPlayerTurn, 
    currentMonsterIndex, 
    combatEnded, 
    currentMonster, 
    monsterHp, 
    playerHp, 
    playerStats, 
    onCombatEnd, 
    classConfig, 
    actualPlayerClass, 
    isFirstAttack,
    currentTurn,
    monsterStatuses,
    isProcessingDrops
  ]);
  
  // 渲染技能UI（这部分可以扩展为主动技能按钮）
  const renderSkillsUI = () => {
    if (!activeSkills || activeSkills.length === 0) return null;
    
    return (
      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>被动技能:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {activeSkills.map(skill => {
            const skillId = skill.id || skill._id;
            const isOnCooldown = skillCooldowns[skillId] > 0;
            
            return (
              <div key={skillId} style={{
                padding: '5px',
                backgroundColor: isOnCooldown ? '#e0e0e0' : '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                opacity: isOnCooldown ? 0.7 : 1
              }}>
                <span style={{ fontWeight: 'bold' }}>{skill.name}</span>
                {isOnCooldown && <span> (CD: {skillCooldowns[skillId]})</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // 新增：掉落动画组件
  const DropAnimation = () => {
    if (!showDropAnimation || !dropResults) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.5s ease-in'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            color: '#ffd700',
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🏆 战利品获得！
          </h2>
          
          {/* 金币和经验 */}
          {(dropResults.gold > 0 || dropResults.exp > 0) && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '30px',
              marginBottom: '20px'
            }}>
              {dropResults.gold > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '24px',
                  color: '#ffd700'
                }}>
                  <span style={{ fontSize: '36px', marginRight: '10px' }}>💰</span>
                  +{dropResults.gold}
                </div>
              )}
              {dropResults.exp > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '24px',
                  color: '#00bfff'
                }}>
                  <span style={{ fontSize: '36px', marginRight: '10px' }}>✨</span>
                  +{dropResults.exp}
                </div>
              )}
            </div>
          )}
          
          {/* 物品 */}
          {dropResults.items.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#4caf50', marginBottom: '10px' }}>获得物品</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '10px'
              }}>
                {dropResults.items.map((item, index) => (
                  <div key={index} style={{
                    backgroundColor: '#f0f8ff',
                    border: '2px solid #4caf50',
                    borderRadius: '8px',
                    padding: '10px',
                    animation: `bounceIn 0.6s ease-out ${index * 0.2}s both`
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>🎁</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 卡片 */}
          {dropResults.cards.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#9c27b0', marginBottom: '10px' }}>获得任务卡片</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '10px'
              }}>
                {dropResults.cards.map((card, index) => (
                  <div key={index} style={{
                    backgroundColor: '#f3e5f5',
                    border: '2px solid #9c27b0',
                    borderRadius: '8px',
                    padding: '10px',
                    animation: `bounceIn 0.6s ease-out ${index * 0.2}s both`
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>🃏</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      {card.bonus.experienceMultiplier > 1 && `经验 +${Math.round((card.bonus.experienceMultiplier - 1) * 100)}%`}
                      {card.bonus.goldMultiplier > 1 && ` 金币 +${Math.round((card.bonus.goldMultiplier - 1) * 100)}%`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div style={{
            marginTop: '20px',
            fontSize: '16px',
            color: '#666'
          }}>
            3秒后自动关闭...
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="combat-container" style={{
      border: '2px solid #444',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      maxWidth: '700px',
      margin: '0 auto',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
    }}>
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>
        ⚔️ 战斗 {currentMonsterIndex + 1}/{monsters.length} 
        <span style={{ marginLeft: '10px', fontSize: '0.8em', color: '#666' }}>
          ({classConfig.name})
        </span>
      </h3>
      
      <div className="combat-arena" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        position: 'relative',
        minHeight: '180px',
        backgroundColor: '#e8e8e8',
        borderRadius: '6px',
        marginBottom: '15px'
      }}>
        {/* 玩家 */}
        <div className={`player ${isAttacking && isPlayerTurn ? 'attacking' : ''}`} style={{
          textAlign: 'center',
          position: 'relative',
          transform: isAttacking && isPlayerTurn ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s ease-in-out'
        }}>
          <div style={{ 
            width: '80px', 
            height: '100px', 
            backgroundColor: actualPlayerClass === 'warrior' ? '#4c6ef5' : 
                             actualPlayerClass === 'mage' ? '#9c27b0' : 
                             actualPlayerClass === 'rogue' ? '#546e7a' : 
                             actualPlayerClass === 'archer' ? '#2e7d32' : '#4c6ef5',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
            margin: '0 auto',
            boxShadow: '0 3px 6px rgba(0,0,0,0.16)'
          }}>
            {actualPlayerClass === 'warrior' ? '⚔️' : 
             actualPlayerClass === 'mage' ? '🔮' : 
             actualPlayerClass === 'rogue' ? '🗡️' : 
             actualPlayerClass === 'archer' ? '🏹' : '👤'}
          </div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontWeight: 'bold' }}>你 ({classConfig.name})</div>
            <div className="health-bar" style={{
              width: '120px',
              height: '12px',
              backgroundColor: '#e74c3c',
              borderRadius: '6px',
              overflow: 'hidden',
              marginTop: '5px'
            }}>
              <div style={{
                width: `${(playerHp / playerStats.hp) * 100}%`,
                height: '100%',
                backgroundColor: '#2ecc71',
                transition: 'width 0.5s ease-out'
              }}></div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '3px' }}>
              HP: {playerHp}/{playerStats.hp}
            </div>
          </div>
          
          {showDamage && showDamage.target === 'player' && (
            <div className="damage-indicator" style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'red',
              fontWeight: 'bold',
              fontSize: '20px',
              animation: 'damage-float 0.8s ease-out'
            }}>
              -{showDamage.value}
            </div>
          )}
          
          {/* 玩家状态效果显示 */}
          {Object.keys(playerStatuses).length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '-25px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '5px'
            }}>
              {Object.entries(playerStatuses).map(([status, data]) => {
                // 只显示真正的状态效果，不显示技能使用标记
                if (status.startsWith('used_')) return null;
                
                let icon = '⚡';
                if (status === 'bleed') icon = '🩸';
                if (status === 'poison') icon = '☠️';
                if (status === 'confusion') icon = '😵';
                
                return (
                  <div key={status} style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '12px'
                  }}>
                    {icon}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* VS */}
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#777'
        }}>
          VS
        </div>
        
        {/* 怪物 */}
        <div className={`monster ${isAttacking && !isPlayerTurn ? 'attacking' : ''}`} style={{
          textAlign: 'center',
          position: 'relative',
          transform: isAttacking && !isPlayerTurn ? 'translateX(-20px)' : 'translateX(0)',
          transition: 'transform 0.2s ease-in-out'
        }}>
          <div style={{ 
            width: '90px', 
            height: '110px', 
            backgroundColor: currentMonster.type === 'boss' ? '#e74c3c' : '#444',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: 'white',
            margin: '0 auto',
            boxShadow: '0 3px 6px rgba(0,0,0,0.16)'
          }}>
            {currentMonster.type === 'boss' ? '👹' : '👾'}
          </div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontWeight: 'bold' }}>
              {currentMonster.name} {currentMonster.type === 'boss' && '(BOSS)'}
            </div>
            <div className="health-bar" style={{
              width: '120px',
              height: '12px',
              backgroundColor: '#e74c3c',
              borderRadius: '6px',
              overflow: 'hidden',
              marginTop: '5px'
            }}>
              <div style={{
                width: `${monsterHp}%`,
                height: '100%',
                backgroundColor: '#f39c12',
                transition: 'width 0.5s ease-out'
              }}></div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '3px' }}>
              HP: {monsterHp}/100
            </div>
          </div>
          
          {showDamage && showDamage.target === 'monster' && (
            <div className="damage-indicator" style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'red',
              fontWeight: 'bold',
              fontSize: '20px',
              animation: 'damage-float 0.8s ease-out'
            }}>
              -{showDamage.value}
            </div>
          )}
          
          {/* 怪物状态效果显示 */}
          {Object.keys(monsterStatuses).length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '-25px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '5px'
            }}>
              {Object.entries(monsterStatuses).map(([status, data]) => {
                let icon = '⚡';
                let bgColor = '#f5f5f5';
                
                if (status === 'bleed') {
                  icon = '🩸';
                  bgColor = '#ffebee';
                }
                if (status === 'poison') {
                  icon = '☠️';
                  bgColor = '#e8f5e9';
                }
                if (status === 'confusion') {
                  icon = '😵';
                  bgColor = '#fff8e1';
                }
                
                return (
                  <div key={status} style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: bgColor,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    position: 'relative'
                  }}>
                    {icon}
                    {data.duration && (
                      <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        backgroundColor: '#333',
                        color: 'white',
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        fontSize: '10px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        {data.duration}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* 技能UI */}
      {renderSkillsUI()}
      
      {/* 战斗日志 */}
      <div className="combat-logs" style={{
        maxHeight: '150px',
        overflowY: 'auto',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px',
        marginTop: '15px'
      }}>
        {combatLogs.map((log, index) => {
          // 检测特殊事件标记
          const isCritical = log.includes('CRITICAL!');
          const isEvade = log.includes('EVADE!');
          const isSkill = log.includes('发动技能') || log.includes('技能触发');
          const isStatus = log.includes('流血效果') || log.includes('中毒效果') || log.includes('开始流血') || log.includes('中毒了');
          
          // 移除标记文本，保留原始格式
          const displayLog = log
            .replace('CRITICAL! ', '')
            .replace('EVADE! ', '');
          
          return (
            <div key={index} style={{
              padding: '4px 0',
              borderBottom: index < combatLogs.length - 1 ? '1px solid #eee' : 'none',
              color: isCritical ? '#ff4d4d' : 
                    isEvade ? '#4caf50' : 
                    isSkill ? '#3f51b5' :
                    isStatus ? '#ff9800' : 'inherit',
              fontWeight: isCritical || isEvade || isSkill ? 'bold' : 'normal'
            }}>
              {displayLog}
              {isCritical && (
                <span style={{ 
                  marginLeft: '5px', 
                  color: '#ff4d4d',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  暴击!
                </span>
              )}
              {isEvade && (
                <span style={{ 
                  marginLeft: '5px', 
                  color: '#4caf50',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  闪避!
                </span>
              )}
            </div>
          );
        })}
        <div ref={logsEndRef} />
      </div>
      
      {/* 掉落动画 */}
      <DropAnimation />
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes damage-float {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
          100% {
            opacity: 0;
            transform: translateY(-20px) translateX(-50%);
          }
        }
        
        .player.attacking {
          animation: attack-right 0.5s ease-in-out;
        }
        
        .monster.attacking {
          animation: attack-left 0.5s ease-in-out;
        }
        
        @keyframes attack-right {
          0% { transform: translateX(0); }
          50% { transform: translateX(20px); }
          100% { transform: translateX(0); }
        }
        
        @keyframes attack-left {
          0% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default CombatSystem;