// services/combatEngine.js
import { Monster } from '../models/Monster.js';
import { Skill } from '../models/Skill.js';

// 简化版职业配置
const CLASS_COMBAT_CONFIG = {
  warrior: {
    name: '战士',
    // 战士使用物理攻击力
    getDamage: (stats) => {
      return Math.floor(stats.assignedStats?.attack * 0.8);
    },
    // 战士减伤更多
    reduceDamage: (damage, stats) => {
      return Math.max(1, damage - Math.floor(stats.assignedStats?.defense * 0.35));
    }
  },
  mage: {
    name: '法师',
    // 法师使用魔法力 - 提高基础系数至1.2
    getDamage: (stats) => {
      return Math.floor(stats.assignedStats?.magicPower * 1.2);
    },
    // 法师物理减伤较少
    reduceDamage: (damage, stats) => {
      return Math.max(1, damage - Math.floor(stats.assignedStats?.defense * 0.2));
    }
  },
  rogue: {
    name: '盗贼',
    // 盗贼攻击力+速度加成
    getDamage: (stats) => {
      const speedBonus = Math.floor((stats.assignedStats?.speed || 5) * 0.2);
      return Math.floor(stats.assignedStats?.attack * 0.7 + speedBonus);
    },
    // 盗贼有额外闪避
    getEvasionBonus: (stats) => {
      return (stats.assignedStats?.speed || 0) * 0.5;
    },
    reduceDamage: (damage, stats) => {
      return Math.max(1, damage - Math.floor(stats.assignedStats?.defense * 0.25));
    }
  },
  archer: {
    name: '弓手',
    // 弓手攻击力+暴击加成
    getDamage: (stats) => {
      const critBonus = Math.floor((stats.assignedStats?.critRate || 5) * 0.3);
      return Math.floor(stats.assignedStats?.attack * 0.75 + critBonus);
    },
    // 弓手首次攻击暴击率提高
    getFirstAttackCritBonus: () => {
      return 20; // +20%暴击率
    },
    reduceDamage: (damage, stats) => {
      return Math.max(1, damage - Math.floor(stats.assignedStats?.defense * 0.25));
    }
  }
};

export const executeCombat = async (monsterIds, stats, currentHp) => {
  console.log('======= COMBAT ENGINE START =======');
  console.log('Monster IDs to fight:', monsterIds);
  console.log('Initial player HP:', currentHp);
  
  // 详细输出玩家职业信息
  console.log('Player class info:', {
    classSlug: stats.classSlug || 'not set',
    className: stats.className || 'not set'
  });
  
  // 获取玩家职业 - 尝试从classSlug或className推断
  let playerClass = 'warrior'; // 默认职业
  
  if (stats.classSlug && CLASS_COMBAT_CONFIG[stats.classSlug]) {
    playerClass = stats.classSlug;
    console.log(`Using class from stats.classSlug: ${playerClass}`);
  } 
  // 如果没有classSlug，尝试从className推断
  else if (stats.className) {
    const classNameLower = stats.className.toLowerCase();
    if (classNameLower.includes('mage') || classNameLower.includes('法师')) {
      playerClass = 'mage';
      console.log(`Inferred 'mage' class from className: ${stats.className}`);
    } else if (classNameLower.includes('rogue') || classNameLower.includes('盗贼')) {
      playerClass = 'rogue'; 
      console.log(`Inferred 'rogue' class from className: ${stats.className}`);
    } else if (classNameLower.includes('archer') || classNameLower.includes('弓手')) {
      playerClass = 'archer';
      console.log(`Inferred 'archer' class from className: ${stats.className}`);
    } else {
      console.log(`Using default 'warrior' class (couldn't infer from: ${stats.className})`);
    }
  } else {
    console.warn('No class information found in stats, using default warrior class');
  }
  
  const classConfig = CLASS_COMBAT_CONFIG[playerClass] || CLASS_COMBAT_CONFIG.warrior;
  
  console.log(`Player class: ${classConfig.name} (${playerClass})`);
  console.log('Player stats:', {
    level: stats.dungeonLevel || 1,
    attack: stats.assignedStats?.attack || 0,
    defense: stats.assignedStats?.defense || 0,
    magicPower: stats.assignedStats?.magicPower || 0,
    speed: stats.assignedStats?.speed || 0,
    critRate: stats.assignedStats?.critRate || 0,
    evasion: stats.assignedStats?.evasion || 0,
    skills: stats.Skills?.length || 0
  });

  // 查找所有相关怪物
  const monsters = await Monster.find({ _id: { $in: monsterIds } }).populate('skills');
  console.log(`Found ${monsters.length} of ${monsterIds.length} monsters`);
  
  // 检查是否有怪物
  if (monsters.length === 0) {
    console.warn('No monsters found for combat! IDs:', monsterIds);
    return {
      survived: true,
      remainingHp: currentHp,
      logs: ['No monsters encountered.'],
      gainedExp: 0,
      goldGain: 0
    };
  }

  // 记录找到的怪物
  console.log('Monsters found:', monsters.map(m => ({
    id: m._id.toString(),
    name: m.name,
    hp: m.stats?.hp || 'unknown',
    attack: m.stats?.attack || 'unknown',
    defense: m.stats?.defense || 'unknown',
    magicResist: m.stats?.magicResist || 'unknown',
    speed: m.stats?.speed || 'unknown',
    skillsCount: m.skills?.length || 0
  })));

  const logs = [];
  let hp = currentHp ?? 100;
  let totalExp = 0;
  let totalGold = 0;
  let roundCounter = 0;

  // 获取玩家基础属性
  const playerCritRate = stats.assignedStats?.critRate || 0; // 百分比
  const baseEvasion = stats.assignedStats?.evasion || 0;     // 百分比
  
  // 根据职业计算额外闪避（盗贼特性）
  let playerEvasion = baseEvasion;
  if (playerClass === 'rogue' && classConfig.getEvasionBonus) {
    playerEvasion += classConfig.getEvasionBonus(stats);
    console.log(`Rogue evasion bonus: +${classConfig.getEvasionBonus(stats).toFixed(1)}% (Total: ${playerEvasion.toFixed(1)}%)`);
  }

  // 创建详细的战斗日志
  logs.push(`=== Combat Start ===`);
  logs.push(`Your HP: ${hp}`);
  logs.push(`Class: ${classConfig.name}`);

  // 处理每个怪物
  for (const monster of monsters) {
    roundCounter++;
    console.log(`\n----- Round ${roundCounter}: Fighting ${monster.name} -----`);
    
    const mName = monster.name || 'Unknown Monster';
    const mHp = monster.stats?.hp || 50;
    const mAttack = monster.stats?.attack || 10;
    const mDefense = monster.stats?.defense || 5;
    const mMagicResist = monster.stats?.magicResist || 5;
    const mSpeed = monster.stats?.speed || 5;
    const mCritRate = monster.stats?.critRate || 0;
    const mEvasion = monster.stats?.evasion || 0;
    
    logs.push(`Encountered ${mName} (HP: ${mHp})`);
    console.log(`Monster stats: HP=${mHp}, ATK=${mAttack}, DEF=${mDefense}, M.RES=${mMagicResist}, SPD=${mSpeed}, CRIT=${mCritRate}%, EVA=${mEvasion}%`);
    
    // 检查怪物技能
    console.log(`Monster has ${monster.skills?.length || 0} skills`);
    if (monster.skills && monster.skills.length > 0) {
      console.log('Available skills:', monster.skills.map(s => ({
        name: s.name,
        effect: s.effect,
        value: s.effectValue,
        priority: s.priority
      })));
    }
    
    // 怪物实际HP
    let monsterCurrentHp = mHp;
    let turnCounter = 0;
    
    // 速度高的先行动
    let playerTurn = (stats.assignedStats?.speed || 0) >= mSpeed;
    
    // 弓手总是先手（简化版职业特性）
    if (playerClass === 'archer') {
      playerTurn = true;
      console.log('Archer always strikes first!');
      logs.push(`As an archer, you take the first shot!`);
    } else {
      console.log(`Initial turn: ${playerTurn ? 'Player' : 'Monster'} goes first (Speed comparison)`);
      logs.push(`${playerTurn ? 'You' : mName} moves first!`);
    }
    
    // 用于弓手首次攻击特性
    let isFirstPlayerAttack = true;
    
    // 局部战斗循环
    while (monsterCurrentHp > 0 && hp > 0) {
      turnCounter++;
      console.log(`Turn ${turnCounter}`);
      
      if (playerTurn) {
        // 玩家回合
        console.log('Player turn');
        
        // 根据职业获取基础伤害
        let playerDamage = classConfig.getDamage(stats);
        console.log(`Base ${playerClass} damage: ${playerDamage}`);
        
        // 弓手首次攻击暴击率加成
        let critChance = playerCritRate;
        if (playerClass === 'archer' && isFirstPlayerAttack && classConfig.getFirstAttackCritBonus) {
          critChance += classConfig.getFirstAttackCritBonus();
          console.log(`Archer first attack bonus: +${classConfig.getFirstAttackCritBonus()}% crit chance (Total: ${critChance}%)`);
        }
        
        // 暴击检测
        const isCritical = Math.random() * 100 < critChance;
        if (isCritical) {
          playerDamage = Math.floor(playerDamage * 1.5); // 暴击伤害1.5倍
          console.log(`Player scores a critical hit! Damage: ${playerDamage}`);
          logs.push(`CRITICAL! 🗡️ 你攻击了 ${mName}，造成了 ${playerDamage} 点伤害！`);
        } else {
          logs.push(`🗡️ 你攻击了 ${mName}，造成了 ${playerDamage} 点伤害！`);
        }
        
        // 计算怪物实际受到的伤害（根据物理/魔法防御）
        let finalDamage = playerDamage;
        if (playerClass === 'mage') {
          // 法师伤害受魔法抗性影响 - 减轻抗性影响，最多只减免50%的抗性值
          const magicResistReduction = Math.floor(playerDamage * (mMagicResist / 200)); // 除以200而不是100，减轻抗性效果
          finalDamage = Math.max(1, playerDamage - magicResistReduction);
          if (magicResistReduction > 0) {
            console.log(`Monster magic resist reduced damage: ${playerDamage} -> ${finalDamage}`);
            logs.push(`${mName}的魔法抗性减免了${magicResistReduction}点伤害`);
          }
          
          // 法师的暴击有额外效果
          if (isCritical) {
            // 暴击时无视30%的魔法抗性
            const penetrationBonus = Math.floor(magicResistReduction * 0.3);
            if (penetrationBonus > 0) {
              finalDamage += penetrationBonus;
              console.log(`Critical hit magic penetration bonus: +${penetrationBonus} damage`);
              logs.push(`魔法穿透！你的法术无视了部分魔法抗性！`);
            }
          }
        } else {
          // 物理攻击受怪物防御影响
          const defenseReduction = Math.floor(mDefense * 0.3);
          finalDamage = Math.max(1, playerDamage - defenseReduction);
          if (defenseReduction > 0) {
            console.log(`Monster defense reduced damage: ${playerDamage} -> ${finalDamage}`);
          }
        }
        
        // 减少怪物HP
        monsterCurrentHp -= finalDamage;
        console.log(`Monster HP: ${monsterCurrentHp + finalDamage} -> ${monsterCurrentHp}`);
        
        // 检查怪物是否被击败
        if (monsterCurrentHp <= 0) {
          console.log(`Monster defeated in ${turnCounter} turns`);
          logs.push(`You defeated ${mName}!`);
          break;
        }
        
        // 标记非首次攻击
        isFirstPlayerAttack = false;
        
      } else {
        // 怪物回合
        console.log('Monster turn');
        
        // 闪避检测
        const isEvaded = Math.random() * 100 < playerEvasion;
        if (isEvaded) {
          console.log(`Player evaded the attack! (${playerEvasion.toFixed(1)}% chance)`);
          logs.push(`EVADE! 👹 ${mName} 的攻击被你闪避了！`);
        } else {
          // 技能或攻击处理（选最高优先级技能）
          const usableSkills = (monster.skills || []).filter(s => s.effect === 'dealDamage');
          console.log(`Monster has ${usableSkills.length} usable damage skills`);
          
          const selectedSkill = usableSkills.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
          
          // 计算伤害
          let damage = 0;
          if (selectedSkill) {
            // 技能伤害
            damage = Math.round(selectedSkill.effectValue * 0.9);
            console.log(`Skill damage calculation: ${selectedSkill.effectValue} * 0.9 = ${damage}`);
            logs.push(`${mName} used ${selectedSkill.name}, dealt ${damage} damage!`);
          } else {
            // 普通攻击
            damage = Math.floor(mAttack * 0.6);
            
            // 怪物暴击检测
            const isMonsterCrit = Math.random() * 100 < mCritRate;
            if (isMonsterCrit) {
              damage = Math.floor(damage * 1.5);
              console.log(`Monster scores a critical hit! Damage: ${damage}`);
              logs.push(`CRITICAL! 👹 ${mName} 攻击了你，造成了 ${damage} 点伤害！`);
            } else {
              console.log(`Normal attack damage: ${damage}`);
              logs.push(`👹 ${mName} 攻击了你，造成了 ${damage} 点伤害！`);
            }
          }
          
          // 根据职业减伤计算实际伤害
          const reducedDamage = classConfig.reduceDamage(damage, stats);
          const damageReduction = damage - reducedDamage;
          
          if (damageReduction > 0) {
            console.log(`Damage reduced by defense: ${damage} -> ${reducedDamage} (${damageReduction} blocked)`);
            logs.push(`Your defense blocked ${damageReduction} damage.`);
          }
          
          // 更新玩家HP
          const oldHp = hp;
          hp -= reducedDamage;
          console.log(`Player HP: ${oldHp} - ${reducedDamage} = ${hp}`);
          logs.push(`Your HP: ${hp}/${currentHp}`);
          
          // 检查玩家是否被击败
          if (hp <= 0) {
            console.log('Player defeated!');
            logs.push(`You were defeated by ${mName}...`);
            break;
          }
        }
      }
      
      // 切换回合
      playerTurn = !playerTurn;
    }
    
    // 如果玩家被击败，结束整场战斗
    if (hp <= 0) {
      logs.push(`=== Combat End: Defeat ===`);
      
      console.log('======= COMBAT ENGINE RESULT: DEFEAT =======');
      console.log('Final logs:', logs);
      
      return {
        survived: false,
        remainingHp: 0,
        logs,
        gainedExp: 0,  // 失败不获得经验
        goldGain: 0    // 失败不获得金币
      };
    }
    
    // 计算经验和金币
    const expGain = monster.expDrop || 0;
    const goldGain = monster.goldDrop || 0;
    totalExp += expGain;
    totalGold += goldGain;
    
    console.log(`Rewards: EXP +${expGain}, Gold +${goldGain}`);
    if (expGain > 0 || goldGain > 0) {
      logs.push(`You gained ${expGain} EXP and ${goldGain} gold.`);
    }
  }
  
  // 战斗胜利
  logs.push(`=== Combat End: Victory ===`);
  logs.push(`You survived all encounters.`);
  logs.push(`Total: ${totalExp} EXP and ${totalGold} gold.`);
  
  console.log('======= COMBAT ENGINE RESULT: VICTORY =======');
  console.log('Class used for combat:', playerClass);
  console.log('Survived:', true);
  console.log('Final HP:', hp);
  console.log('Total EXP gained:', totalExp);
  console.log('Total Gold gained:', totalGold);
  console.log('Log entries created:', logs.length);
  
  // 更新玩家状态
  const oldExp = stats.dungeonExp || 0;
  const oldGold = stats.gold || 0;
  stats.dungeonExp = oldExp + totalExp;
  stats.gold = oldGold + totalGold;
  
  console.log(`Updated player stats: EXP ${oldExp} -> ${stats.dungeonExp}, Gold ${oldGold} -> ${stats.gold}`);
  
  // 返回包含所有详细信息的结果
  return {
    survived: true,
    remainingHp: hp,
    logs,
    gainedExp: totalExp,
    goldGain: totalGold,
    // 调试信息
    debug: {
      initialHp: currentHp,
      playerClass: playerClass,
      monstersCount: monsters.length,
      monsterIds: monsterIds,
      foundMonsters: monsters.map(m => m.name),
      rounds: roundCounter
    }
  };
};