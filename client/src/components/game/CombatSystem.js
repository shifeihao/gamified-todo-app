import React, { useState, useEffect, useRef } from 'react';

// Class combat configuration
const CLASS_COMBAT_CONFIG = {
  warrior: {
    name: 'Warrior',
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
    name: 'Mage',
    getDamage: (playerStats) => {
      return Math.floor((playerStats.magicPower || 10) * (0.9 + Math.random() * 0.6));
    },
    reduceDamage: (damage, playerStats) => {
      const defenseReduction = Math.floor((playerStats.defense || 5) * 0.2);
      return Math.max(1, damage - defenseReduction);
    },
    getCritChance: (playerStats) => {
      return (playerStats.critRate || 5) + 5; // Mage has slightly higher base crit rate
    }
  },
  rogue: {
    name: 'Rogue',
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
    name: 'Archer',
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

// Convert English class name to slug
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
  userInfo,
  onCombatEnd,
  skills = [],
  userToken // New: user token for API calls
}) => {
  const actualPlayerClass = playerClass || getClassSlugFromName(playerClassName);
  
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState(0);
  const [playerHp, setPlayerHp] = useState(playerStats.hp);
  const [monsterHp, setMonsterHp] = useState(monsters[0]?.stats?.hp || 100);
  const [combatLogs, setCombatLogs] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [combatEnded, setCombatEnded] = useState(false);
  const [showDamage, setShowDamage] = useState(null);
  const [isFirstAttack, setIsFirstAttack] = useState(true);
  const [currentTurn, setCurrentTurn] = useState(0);
  const maxPlayerHpRef = useRef(playerStats.hp);
  const [maxMonsterHp, setMaxMonsterHp] = useState(
    monsters[0]?.stats?.hp ?? 100
  );
 
  
  // Skill and status effect related states
  const [activeSkills, setActiveSkills] = useState(skills || []);
  const [skillCooldowns, setSkillCooldowns] = useState({});
  const [monsterStatuses, setMonsterStatuses] = useState({});
  const [playerStatuses, setPlayerStatuses] = useState({});
  const [skillTriggeredEffects, setSkillTriggeredEffects] = useState([]);
  
  // New: drop related states
  const [dropResults, setDropResults] = useState(null);
  const [showDropAnimation, setShowDropAnimation] = useState(false);
  const [isProcessingDrops, setIsProcessingDrops] = useState(false);
 
  const currentMonster = monsters[currentMonsterIndex];
  const logsEndRef = useRef(null);

  // Get current class configuration
  const classConfig = CLASS_COMBAT_CONFIG[actualPlayerClass] || CLASS_COMBAT_CONFIG.warrior;
  
  // Initialize combat state
  useEffect(() => {
  const hp = currentMonster?.stats?.hp ?? 100;
   setMonsterHp(hp);
    setMaxMonsterHp(hp);
  }, [currentMonster]);
  
  useEffect(() => {
    // Initialize skill cooldowns
    const initialCooldowns = {};
    activeSkills.forEach(skill => {
      initialCooldowns[skill.id || skill._id] = 0;
    });
    setSkillCooldowns(initialCooldowns);
    
    // Combat start log
    setCombatLogs([
      `Combat started! Class: ${classConfig.name}`,
      `Available skills: ${activeSkills.map(s => s.name).join(', ') || 'None'}`
    ]);
    
    // Trigger battle start skills
    triggerSkills('onStartBattle', null);
  }, [activeSkills, classConfig.name]);
  
  // Scroll to bottom of logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combatLogs]);

  useEffect(() => {
  setCurrentMonsterIndex(0);
  setIsPlayerTurn(true);
  setIsFirstAttack(true);
  setCurrentTurn(0);
  setMonsterStatuses({});
  const hp = monsters[0]?.stats?.hp ?? maxMonsterHp;
  setMonsterHp(hp);
  setMaxMonsterHp(hp);
}, [monsters]);
  
  // Skill trigger handler function
  const triggerSkills = (triggerType, context) => {
    // Filter out triggerable skills
    const triggeredSkills = activeSkills.filter(skill => {
      // Check skill trigger type match
      if (skill.trigger !== triggerType) return false;
      
      // Check if skill is on cooldown
      const skillId = skill.id || skill._id;
      if (skillCooldowns[skillId] > 0) return false;
      
      // Check if skill is one-time and already used
      if (skill.once && playerStatuses[`used_${skillId}`]) return false;
      
      // Check special trigger conditions
      if (triggerType === 'onHpBelow' && skill.triggerCondition?.hpBelow) {
        const hpPercentage = playerHp / playerStats.hp;
        if (hpPercentage > skill.triggerCondition.hpBelow) return false;
      }
      
      return true;
    });
    
    // Sort by priority
    triggeredSkills.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // Apply skill effects
    const effects = triggeredSkills.map(skill => {
      const skillId = skill.id || skill._id;
      
      // Set cooldown
      setSkillCooldowns(prev => ({ 
        ...prev, 
        [skillId]: skill.cooldown || 0 
      }));
      
      // Mark one-time skill as used
      if (skill.once) {
        setPlayerStatuses(prev => ({ 
          ...prev, 
          [`used_${skillId}`]: true 
        }));
      }
      
      // Create effect object
      const effectObj = {
        name: skill.name,
        effect: skill.effect,
        value: skill.effectValue,
        source: 'player',
        skillId
      };
     
      
      // Add to logs
      let logMessage = '';
      switch (skill.effect) {
        case 'dealDamage':
          logMessage = `🔥 Activated skill "${skill.name}", dealt ${skill.effectValue} damage!`;
          break;
        case 'gainShield':
          logMessage = `🛡️ Activated skill "${skill.name}", gained ${skill.effectValue} shield!`;
          break;
        case 'heal':
          logMessage = `💚 Activated skill "${skill.name}", healed ${skill.effectValue} HP!`;
          break;
        case 'buffAttack':
          logMessage = `⚔️ Activated skill "${skill.name}", attack increased by ${skill.effectValue}!`;
          break;
        case 'debuffEnemy':
          logMessage = `⬇️ Activated skill "${skill.name}", enemy attribute reduced by ${skill.effectValue}!`;
          break;
        default:
          logMessage = `✨ Activated skill "${skill.name}"!`;
      }
      
      setCombatLogs(prev => [...prev, logMessage]);
      
      // Special status effect handling
      if (skill.triggerCondition?.applyStatus) {
        const statusType = skill.triggerCondition.applyStatus;
        setMonsterStatuses(prev => ({
          ...prev,
          [statusType]: {
            duration: 3, // Default 3 turns
            source: 'player'
          }
        }));
        
        // Add status effect log
        let statusMessage = '';
        switch (statusType) {
          case 'bleed':
            statusMessage = `🩸 ${currentMonster.name} starts bleeding!`;
            break;
          case 'poison':
            statusMessage = `☠️ ${currentMonster.name} is poisoned!`;
            break;
          case 'confusion':
            statusMessage = `😵 ${currentMonster.name} is confused!`;
            break;
          default:
            statusMessage = `⚡ ${currentMonster.name} is affected by ${statusType}!`;
        }
        
        setCombatLogs(prev => [...prev, statusMessage]);
      }
      
      return effectObj;
    });
    
    setSkillTriggeredEffects(effects);
    return effects;
  };
   const getPlayerAvatar = () => {
          if (userInfo?.images && userInfo?.gender) {
            const spritePath = userInfo.images[userInfo.gender]?.sprite;
            if (spritePath) {
              return (
                <img 
                  src={`/icon/characters/${spritePath}`}
                  alt={`${actualPlayerClass} ${userInfo.gender}`}
                  className="w-4/5 h-4/5 object-contain"
                  onError={(e) => {
                    // Handle image loading failure
                    console.log('Player avatar loading failed, using emoji fallback');
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = getEmojiAvatar();
                  }}
                />
              );
            }
          }
    
        // Otherwise use emoji fallback
        return getEmojiAvatar();
      };
      const getEmojiAvatar = () => {
        const emojiMap = {
          'warrior': '⚔️',
          'mage': '🔮',
          'rogue': '🗡️',
          'archer': '🏹'
        };
        
        return `<span style="font-size: 24px; color: white;">${emojiMap[actualPlayerClass] || '👤'}</span>`;
      };
  
  // Apply skill effects
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
          // Shield effect - simplified as HP increase
          setPlayerHp(prev => Math.min(playerStats.hp, prev + effect.value));
          break;
        case 'heal':
          setPlayerHp(prev => Math.min(playerStats.hp, prev + effect.value));
          break;
        // Other effects can be extended...
      }
    });
  };
  
  // Process status effects
  const processStatusEffects = () => {
    // Process monster status effects
    Object.entries(monsterStatuses).forEach(([statusType, status]) => {
      if (status.duration <= 0) {
        // Remove expired status
        setMonsterStatuses(prev => {
          const newStatuses = {...prev};
          delete newStatuses[statusType];
          return newStatuses;
        });
        return;
      }
      
      // Apply status effects
      switch (statusType) {
        case 'bleed':
          const bleedDamage = Math.floor(5 + (currentTurn * 1.5)); // Bleed damage increases with turns
          setMonsterHp(prev => Math.max(0, prev - bleedDamage));
          setCombatLogs(prev => [...prev, `🩸 Bleed effect: ${currentMonster.name} takes ${bleedDamage} damage`]);
          break;
        case 'poison':
          const poisonDamage = 8; // Fixed poison damage
          setMonsterHp(prev => Math.max(0, prev - poisonDamage));
          setCombatLogs(prev => [...prev, `☠️ Poison effect: ${currentMonster.name} takes ${poisonDamage} damage`]);
          break;
      }
      
      // Reduce status duration
      setMonsterStatuses(prev => ({
        ...prev,
        [statusType]: {
          ...status,
          duration: status.duration - 1
        }
      }));
    });
  };
  
  // Update skill cooldowns
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
  
  // New: handle drop processing function
  const handleDropProcessing = async () => {
    if (isProcessingDrops) return; // Prevent duplicate calls
    
    try {
      setIsProcessingDrops(true);
      
      // Show drop processing info
      setCombatLogs(prev => [...prev, '💎 Calculating loot...']);
      
      // Get all defeated monster IDs, enhanced compatibility
      const monsterIds = monsters.map(monster => {
        // Prioritize _id, use id if not available
        const id = monster._id || monster.id;
        
        // Ensure ID is in string format
        if (id && typeof id === 'object' && id.$oid) {
          // Handle special ObjectId format
          return id.$oid;
        }
        
        return typeof id === 'object' ? String(id) : id;
      }).filter(id => id); // Filter out invalid IDs

      console.log('=== FRONTEND DROP DEBUG ===');
      console.log('Original monster data:', monsters);
      console.log('Extracted IDs:', monsterIds);
      console.log('Valid ID count:', monsterIds.length);
      console.log('Monster count:', monsters.length);
      
      // Validate ID format
      const invalidIds = monsterIds.filter(id => {
        // Check if valid ObjectId format (24-character hex string)
        return !id || typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id);
      });
      
      if (invalidIds.length > 0) {
        console.error('Found invalid monster IDs:', invalidIds);
        throw new Error(`Found ${invalidIds.length} invalid monster IDs`);
      }
      
      if (monsterIds.length !== monsters.length) {
        console.warn(`Monster ID count(${monsterIds.length}) doesn't match monster count(${monsters.length})`);
        const missingIds = monsters.filter(monster => !monster._id && !monster.id);
        console.error('Monsters missing IDs:', missingIds);
        throw new Error('Some monsters lack valid IDs');
      }
      
      console.log('Request payload:', JSON.stringify({ monsterIds }, null, 2));
      
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
        // Try to get error details
        let errorMessage = `Drop processing failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `Drop processing failed: ${errorData.error}`;
            if (errorData.details) {
              console.error('Error details:', errorData.details);
            }
          }
        } catch (e) {
          console.error('Cannot parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      const dropData = await response.json();
      
      if (dropData.success) {
        setDropResults(dropData.data);
        
        // Show drop results in logs
        const logs = [];
        if (dropData.data.gold > 0) {
          logs.push(`💰 Gained ${dropData.data.gold} gold`);
        }
        if (dropData.data.exp > 0) {
          logs.push(`✨ Gained ${dropData.data.exp} experience`);
        }
        if (dropData.data.items && dropData.data.items.length > 0) {
          logs.push(`🎒 Gained items: ${dropData.data.items.map(item => item.name).join(', ')}`);
        }
        if (dropData.data.cards && dropData.data.cards.length > 0) {
          logs.push(`🃏 Gained quest cards: ${dropData.data.cards.map(card => card.title).join(', ')}`);
        }
        
        setCombatLogs(prev => [...prev, ...logs]);
        
        // Show drop animation
        setShowDropAnimation(true);
        
        // Close animation and end combat after 3 seconds
        setTimeout(() => {
          setShowDropAnimation(false);
          // End combat, pass drop results
          onCombatEnd({ 
            result: 'victory', 
            remainingHp: playerHp,
            drops: dropData.data
          });
        }, 3000);
      } else {
        throw new Error(dropData.message || 'Drop processing failed');
      }
    } catch (error) {
      console.error('Drop processing error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        monsters: monsters,
        monstersWithIds: monsters.map(m => ({ name: m.name, _id: m._id, id: m.id }))
      });
      
      setCombatLogs(prev => [...prev, `❌ Drop processing error: ${error.message}`]);
      
      // End combat even if drop processing fails
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
  // Handle turn-based combat
  
  useEffect(() => {
    if (skills && skills.length > 0) {
      const triggerTypes = {};
      skills.forEach(skill => {
        const trigger = skill.trigger || "Not set";
        triggerTypes[trigger] = (triggerTypes[trigger] || 0) + 1;
      });
    }
    
    if (combatEnded) return;
    
    // Player turn
    if (isPlayerTurn) {
      const timer = setTimeout(() => {
        // Increase turn count
        setCurrentTurn(prev => prev + 1);
        
        // Process status effects
        processStatusEffects();
        
        // Calculate damage based on class
        const baseDamage = classConfig.getDamage(playerStats);
        
        // Critical hit detection
        const critChance = typeof classConfig.getCritChance === 'function' 
          ? classConfig.getCritChance(playerStats, isFirstAttack)
          : (playerStats.critRate || 5);
        
        const isCritical = Math.random() * 100 < critChance;
        let damage = baseDamage;
        
        if (isCritical) {
          damage = Math.floor(damage * 1.5);
        }
        
        // Trigger attack skills
        const attackSkillEffects = triggerSkills('onAttack', { isCritical });
        
        // Calculate skill additional damage
        let skillDamage = 0;
        attackSkillEffects.forEach(effect => {
          if (effect.effect === 'dealDamage') {
            skillDamage += effect.value;
          }
        });
        
        // Total damage
        const totalDamage = damage + skillDamage;
        
        setShowDamage({ target: 'monster', value: totalDamage });
        setIsAttacking(true);
        
        setTimeout(() => {
          setIsAttacking(false);
          setShowDamage(null);
          
          const newMonsterHp = Math.max(0, monsterHp - totalDamage);
          setMonsterHp(newMonsterHp);
          
          // Create log message
          let logMessage = `🗡️ You attacked ${currentMonster.name}, dealing ${totalDamage} damage!`;
          if (isCritical) {
            logMessage = `CRITICAL! ${logMessage}`;
          }
          
          // If skills triggered, add damage breakdown
          if (skillDamage > 0) {
            logMessage += ` (Skill: ${skillDamage}, Base: ${damage})`;
          }
          
          setCombatLogs(prev => [...prev, logMessage]);
          
          // Check if monster is defeated
          if (newMonsterHp <= 0) {
            setCombatLogs(prev => [...prev, `💥 You defeated ${currentMonster.name}!`]);
            
            // Check if all monsters are defeated
            if (currentMonsterIndex >= monsters.length - 1) {
              // All monsters defeated, process drops
              setCombatEnded(true);
              handleDropProcessing();
            } else {
              // Move to next monster
              setCurrentMonsterIndex(prev => prev + 1);
              setMonsterHp(monsters[currentMonsterIndex + 1]?.stats?.hp|| 100);
              
              setIsPlayerTurn(true); // Player goes first against new monster
              setIsFirstAttack(true); // Reset first attack flag
              
              // Reset monster statuses
              setMonsterStatuses({});
            }
          } else {
            setIsFirstAttack(false); // Not first attack
            setIsPlayerTurn(false);
            
            // Update skill cooldowns
            updateCooldowns();
          }
        }, 600);
      }, 1000);
      
      return () => clearTimeout(timer);
    } 
    // Monster turn
    else {
      const timer = setTimeout(() => {
        // Evasion detection
        const baseEvasion = playerStats.evasion || 0;
        const bonusEvasion = actualPlayerClass === 'rogue' && classConfig.getEvasionBonus 
          ? classConfig.getEvasionBonus(playerStats) 
          : 0;
        
        const totalEvasion = baseEvasion + bonusEvasion;
        const isEvaded = Math.random() * 100 < totalEvasion;
        
        if (isEvaded) {
          // Evasion successful
          setCombatLogs(prev => [...prev, `EVADE! 👹 ${currentMonster.name}'s attack was evaded!`]);
          
          // Trigger evasion skills
          const evadeSkillEffects = triggerSkills('onReceiveHit', { evaded: true });
          
          setIsPlayerTurn(true);
        } else {
          // Calculate monster damage
          const monsterDamage = Math.floor(((currentMonster.stats.attack || 8) * (0.7 + Math.random() * 0.5)));
          
          // Trigger hit skills
          const hitSkillEffects = triggerSkills('onReceiveHit', { evaded: false });
          
          // Calculate damage after reduction
          const reducedDamage = classConfig.reduceDamage(monsterDamage, playerStats);
          setShowDamage({ target: 'player', value: reducedDamage });
          
          setTimeout(() => {
            setShowDamage(null);
            
            // Apply skill effects
            applySkillEffects(hitSkillEffects, 'player');
            
            const newPlayerHp = Math.max(0, playerHp - reducedDamage);
            setPlayerHp(newPlayerHp);
            
            // Log shows original damage and reduced damage
            const damageReduction = monsterDamage - reducedDamage;
            let logMessage = `👹 ${currentMonster.name} attacked you, dealing ${reducedDamage} damage!`;
            
            setCombatLogs(prev => [...prev, logMessage]);
            
            if (damageReduction > 0) {
              setCombatLogs(prev => [...prev, `🛡️ Your defense reduced ${damageReduction} damage`]);
            }
            
            // Check low HP threshold skills
            if (newPlayerHp < playerStats.hp * 0.5) {
              const lowHpSkillEffects = triggerSkills('onHpBelow', { 
                hpPercentage: newPlayerHp / playerStats.hp 
              });
              
              // Apply low HP triggered skill effects
              applySkillEffects(lowHpSkillEffects, 'player');
            }
            
            // Check if player is defeated (HP is 0)
            if (newPlayerHp <= 0) {
              setCombatLogs(prev => [...prev, `💀 You were defeated by ${currentMonster.name}!`]);
              setCombatEnded(true);
              setTimeout(() => {
                // Here it's not GameOver, but auto settlement
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
  
  // Render skills UI (can be extended to active skill buttons)
  const renderSkillsUI = () => {
    if (!activeSkills || activeSkills.length === 0) return null;
    
    return (
      <div className="mt-4 p-3 bg-[#4c2a85] rounded-lg text-sm border-2 border-[#5d3494] text-[#e0e0e0]">
        <div className="font-bold mb-2 text-white text-center">
          ⚡ Passive Skills
        </div>
        <div className="flex flex-wrap gap-2">
          {activeSkills.map(skill => {
            const skillId = skill.id || skill._id;
            const isOnCooldown = skillCooldowns[skillId] > 0;
            
            return (
              <div 
                key={skillId} 
                className={`px-2.5 py-1.5 border-2 rounded-md text-[#e0e0e0] ${
                  isOnCooldown 
                    ? 'bg-[#2c1810] border-[#666] opacity-60' 
                    : 'bg-[#3a1f6b] border-[#7e4ab8]'
                }`}
              >
                <span className="font-bold">{skill.name}</span>
                {isOnCooldown && (
                  <span className="text-[#b89be6]"> (CD: {skillCooldowns[skillId]})</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // New: Drop animation component
  const DropAnimation = () => {
    if (!showDropAnimation || !dropResults) return null;
    
    return (
      <div className="fixed inset-0 bg-[#2c1810] bg-opacity-95 flex justify-center items-center z-50 font-mono animate-fade-in">
        <div className="bg-[#3a1f6b] rounded-xl p-8 border-3 border-[#5d3494] max-w-md w-11/12 text-center text-[#e0e0e0]">
          <h2 className="text-[#ffa726] mb-5 text-2xl font-bold text-shadow-lg">
            🏆 Loot Obtained!
          </h2>
          
          {/* Gold and experience */}
          {(dropResults.gold > 0 || dropResults.exp > 0) && (
            <div className="flex justify-center gap-8 mb-5">
              {dropResults.gold > 0 && (
                <div className="flex items-center text-2xl text-[#ffa726] bg-[#2c1810] px-4 py-2 rounded-lg border-2 border-[#ffa726]">
                  <span className="text-4xl mr-2">💰</span>
                  +{dropResults.gold}
                </div>
              )}
              {dropResults.exp > 0 && (
                <div className="flex items-center text-2xl text-[#81c784] bg-[#2c1810] px-4 py-2 rounded-lg border-2 border-[#81c784]">
                  <span className="text-4xl mr-2">✨</span>
                  +{dropResults.exp}
                </div>
              )}
            </div>
          )}
          
          {/* Items */}
          {dropResults.items && dropResults.items.length > 0 && (
            <div className="mb-5">
              <h3 className="text-white mb-2 text-lg">Items Obtained</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                {dropResults.items.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-[#2c1810] border-2 border-[#4caf50] rounded-lg p-2 animate-bounce-in"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="text-2xl mb-1">🎁</div>
                    <div className="text-sm font-bold text-white">
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Cards */}
          {dropResults.cards && dropResults.cards.length > 0 && (
            <div className="mb-5">
              <h3 className="text-white mb-2 text-lg">Quest Cards Obtained</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
                {dropResults.cards.map((card, index) => (
                  <div 
                    key={index} 
                    className="bg-[#2c1810] border-2 border-[#9c27b0] rounded-lg p-2 animate-bounce-in"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="text-2xl mb-1">🃏</div>
                    <div className="text-sm font-bold text-white">
                      {card.title}
                    </div>
                    <div className="text-xs text-[#b89be6] mt-1">
                      {card.bonus && card.bonus.experienceMultiplier > 1 && `EXP +${Math.round((card.bonus.experienceMultiplier - 1) * 100)}%`}
                      {card.bonus && card.bonus.goldMultiplier > 1 && ` Gold +${Math.round((card.bonus.goldMultiplier - 1) * 100)}%`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-5 text-base text-[#b89be6]">
            Auto-closing in 3 seconds...
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="border-3 border-[#5d3494] rounded-xl p-5 bg-[#3a1f6b] max-w-3xl mx-auto font-mono text-[#e0e0e0]">
      <h3 className="text-center mt-0 text-white text-shadow-sm">
        ⚔️ Combat {currentMonsterIndex + 1}/{monsters.length} 
        <span className="ml-2 text-sm text-[#b89be6]">
          ({classConfig.name})
        </span>
      </h3>
      
      <div className="flex justify-between items-center p-5 relative min-h-[180px] bg-[#2c1810] rounded-lg mb-4 border-2 border-[#4c2a85] px-8">
        {/* Player */}
        <div className={`text-center relative transition-transform duration-200 ease-in-out ${
          isAttacking && isPlayerTurn ? 'transform translate-x-5' : 'transform translate-x-0'
        }`}>
          <div className={`w-20 h-24 rounded-lg flex items-center justify-center text-2xl text-white mx-auto border-2 border-[#7e4ab8] overflow-hidden ${
            actualPlayerClass === 'warrior' ? 'bg-[#4c6ef5]' :
            actualPlayerClass === 'mage' ? 'bg-[#9c27b0]' :
            actualPlayerClass === 'rogue' ? 'bg-[#546e7a]' :
            actualPlayerClass === 'archer' ? 'bg-[#2e7d32]' : 'bg-[#4c6ef5]'
          }`}>
            {getPlayerAvatar()}
          </div>
          <div className="mt-2">
            <div className="font-bold text-white">{userInfo.name}</div>
            <div className="w-30 h-3 bg-[#d32f2f] rounded-md overflow-hidden mt-1 border border-[#7e4ab8]">
              <div 
                className="h-full bg-[#4caf50] transition-all duration-500 ease-out"
                style={{ width: `${(playerHp / maxPlayerHpRef.current) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs mt-1 text-[#b89be6]">
              HP: {playerHp}/{maxPlayerHpRef.current}
            </div>
          </div>
          
          {showDamage && showDamage.target === 'player' && (
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[#f44336] font-bold text-xl animate-damage-float text-shadow-lg">
              -{showDamage.value}
            </div>
          )}
          
          {/* Player status effects display */}
          {Object.keys(playerStatuses).length > 0 && (
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1">
              {Object.entries(playerStatuses).map(([status, data]) => {
                // Only show real status effects, not skill usage markers
                if (status.startsWith('used_')) return null;
                
                let icon = '⚡';
                if (status === 'bleed') icon = '🩸';
                if (status === 'poison') icon = '☠️';
                if (status === 'confusion') icon = '😵';
                
                return (
                  <div key={status} className="w-5 h-5 rounded-full bg-[#4c2a85] flex justify-center items-center text-xs border border-[#7e4ab8]">
                    {icon}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* VS */}
        <div className="text-2xl font-bold text-[#b89be6]">
          VS
        </div>
        
        {/* Monster */}
        <div className={`text-center relative transition-transform duration-200 ease-in-out ${
          isAttacking && !isPlayerTurn ? 'transform -translate-x-5' : 'transform translate-x-0'
        }`}>
          {/* Monster avatar */}
          <div className={`w-20 h-24 rounded-lg flex items-center justify-center mx-auto border-2 border-[#7e4ab8] overflow-hidden ${
            currentMonster.type === 'boss' ? 'bg-[#d32f2f]' : 'bg-[#5d3494]'
          }`}>
            {currentMonster.icon ? (
              <img
                src={`/Icon/Monster/${currentMonster.icon}.png`}
                alt={currentMonster.name}
                className="max-w-full max-h-full"
              />
            ) : (
              currentMonster.type === 'boss' ? '👹' : '👾'
            )}
          </div>

          <div className="mt-2">
            <div className="font-bold text-white">
              {currentMonster.name} {currentMonster.type === 'boss' && '(BOSS)'}
            </div>
            <div className="w-30 h-3 bg-[#d32f2f] rounded-md overflow-hidden mt-1 border border-[#7e4ab8]">
              <div 
                className="h-full bg-[#ff9800] transition-all duration-500 ease-out"
                style={{ width: `${(monsterHp / maxMonsterHp) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs mt-1 text-[#b89be6]">
              HP: {monsterHp}/{maxMonsterHp}
            </div>
          </div>
          
          {showDamage && showDamage.target === 'monster' && (
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[#f44336] font-bold text-xl animate-damage-float text-shadow-lg">
              -{showDamage.value}
            </div>
          )}
          
          {/* Monster status effects display */}
          {Object.keys(monsterStatuses).length > 0 && (
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1">
              {Object.entries(monsterStatuses).map(([status, data]) => {
                let icon = '⚡';
                let bgColor = 'bg-[#4c2a85]';
                
                if (status === 'bleed') {
                  icon = '🩸';
                  bgColor = 'bg-[#d32f2f]';
                }
                if (status === 'poison') {
                  icon = '☠️';
                  bgColor = 'bg-[#2e7d32]';
                }
                if (status === 'confusion') {
                  icon = '😵';
                  bgColor = 'bg-[#ff9800]';
                }
                
                return (
                  <div key={status} className={`w-5 h-5 rounded-full ${bgColor} flex justify-center items-center text-xs border border-[#7e4ab8] relative`}>
                    {icon}
                    {data.duration && (
                      <span className="absolute -top-2 -right-2 bg-[#2c1810] text-white rounded-full w-3.5 h-3.5 text-xs flex justify-center items-center border border-[#7e4ab8]">
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
      
      {/* Skills UI */}
      {renderSkillsUI()}
      
      {/* Combat logs */}
      <div className="max-h-36 overflow-y-auto bg-[#2c1810] border-2 border-[#5d3494] rounded-lg p-2 mt-4">
        {combatLogs.map((log, index) => {
          // Detect special event markers
          const isCritical = log.includes('CRITICAL!');
          const isEvade = log.includes('EVADE!');
          const isSkill = log.includes('Activated skill') || log.includes('skill triggered');
          const isStatus = log.includes('Bleed effect') || log.includes('Poison effect') || log.includes('starts bleeding') || log.includes('is poisoned');
          
          // Remove marker text, keep original format
          const displayLog = log
            .replace('CRITICAL! ', '')
            .replace('EVADE! ', '');
          
          return (
            <div key={index} className={`py-1 border-b last:border-b-0 border-[#4c2a85] ${
              isCritical ? 'text-[#f44336] font-bold' : 
              isEvade ? 'text-[#4caf50] font-bold' : 
              isSkill ? 'text-[#2196f3] font-bold' :
              isStatus ? 'text-[#ff9800]' : 'text-[#e0e0e0]'
            }`}>
              {displayLog}
              {isCritical && (
                <span className="ml-1 text-[#f44336] text-xs font-bold">
                  Critical!
                </span>
              )}
              {isEvade && (
                <span className="ml-1 text-[#4caf50] text-xs font-bold">
                  Evaded!
                </span>
              )}
            </div>
          );
        })}
        <div ref={logsEndRef} />
      </div>
      
      {/* Drop animation */}
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
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        
        .animate-bounce-in {
          animation: bounceIn 0.6s ease-out both;
        }
        
        .animate-damage-float {
          animation: damage-float 0.8s ease-out;
        }
        
        .text-shadow-sm {
          text-shadow: 1px 1px 0px #2c1810;
        }
        
        .text-shadow-lg {
          text-shadow: 2px 2px 0px #2c1810;
        }
      `}</style>
    </div>
  );
};

export default CombatSystem;