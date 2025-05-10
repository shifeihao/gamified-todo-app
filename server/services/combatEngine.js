// services/combatEngine.js
import { Monster } from '../models/Monster.js';
import { Skill } from '../models/Skill.js';

export const executeCombat = async (monsterIds, stats, currentHp) => {
  console.log('======= COMBAT ENGINE START =======');
  console.log('Monster IDs to fight:', monsterIds);
  console.log('Initial player HP:', currentHp);
  console.log('Player stats:', {
    level: stats.dungeonLevel || 1,
    attack: stats.assignedStats?.attack || 0,
    defense: stats.assignedStats?.defense || 0,
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
    speed: m.stats?.speed || 'unknown',
    skillsCount: m.skills?.length || 0
  })));

  const logs = [];
  let hp = currentHp ?? 100;
  let totalExp = 0;
  let totalGold = 0;
  let roundCounter = 0;

  // 获取玩家属性
  const playerAttack = stats.assignedStats?.attack || 10;
  const playerDefense = stats.assignedStats?.defense || 5;
  const playerSpeed = stats.assignedStats?.speed || 5;
  const playerCritRate = stats.assignedStats?.critRate || 0; // 百分比
  const playerEvasion = stats.assignedStats?.evasion || 0;   // 百分比

  // 创建详细的战斗日志
  logs.push(`=== Combat Start ===`);
  logs.push(`Your HP: ${hp}`);

  // 处理每个怪物
  for (const monster of monsters) {
    roundCounter++;
    console.log(`\n----- Round ${roundCounter}: Fighting ${monster.name} -----`);
    
    const mName = monster.name || 'Unknown Monster';
    const mHp = monster.stats?.hp || 50;
    const mAttack = monster.stats?.attack || 10;
    const mSpeed = monster.stats?.speed || 5;
    const mCritRate = monster.stats?.critRate || 0;
    const mEvasion = monster.stats?.evasion || 0;
    
    logs.push(`Encountered ${mName} (HP: ${mHp}, ATK: ${mAttack}, SPD: ${mSpeed})`);
    console.log(`Monster stats: HP=${mHp}, ATK=${mAttack}, SPD=${mSpeed}, CRIT=${mCritRate}%, EVA=${mEvasion}%`);
    
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
    let playerTurn = playerSpeed >= mSpeed; // 速度高的先行动
    
    console.log(`Initial turn: ${playerTurn ? 'Player' : 'Monster'} goes first (Speed ${playerSpeed} vs ${mSpeed})`);
    logs.push(`${playerTurn ? 'You' : mName} moves first!`);
    
    // 局部战斗循环
    while (monsterCurrentHp > 0 && hp > 0) {
      turnCounter++;
      console.log(`Turn ${turnCounter}`);
      
      if (playerTurn) {
        // 玩家回合
        console.log('Player turn');
        
        // 基础伤害
        let playerDamage = Math.floor(playerAttack * 0.8);
        
        // 暴击检测
        const isCritical = Math.random() * 100 < playerCritRate;
        if (isCritical) {
          playerDamage = Math.floor(playerDamage * 1.5); // 暴击伤害1.5倍
          console.log(`Player scores a critical hit! Damage ${playerDamage/1.5} -> ${playerDamage}`);
          logs.push(`CRITICAL! 🗡️ 你攻击了 ${mName}，造成了 ${playerDamage} 点伤害！`);
        } else {
          logs.push(`🗡️ 你攻击了 ${mName}，造成了 ${playerDamage} 点伤害！`);
        }
        
        // 减少怪物HP
        monsterCurrentHp -= playerDamage;
        console.log(`Monster HP: ${monsterCurrentHp + playerDamage} -> ${monsterCurrentHp}`);
        
        // 检查怪物是否被击败
        if (monsterCurrentHp <= 0) {
          console.log(`Monster defeated in ${turnCounter} turns`);
          logs.push(`You defeated ${mName}!`);
          break;
        }
        
      } else {
        // 怪物回合
        console.log('Monster turn');
        
        // 闪避检测
        const isEvaded = Math.random() * 100 < playerEvasion;
        if (isEvaded) {
          console.log(`Player evaded the attack! (${playerEvasion}% chance)`);
          logs.push(`EVADE! 👹 ${mName} 的攻击被你闪避了！`);
        } else {
          // 技能或攻击处理（简化：只选最高优先级技能）
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
              console.log(`Monster scores a critical hit! Damage ${damage/1.5} -> ${damage}`);
            } else {
              console.log(`Normal attack damage calculation: ${mAttack} * 0.6 = ${damage}`);
            }
          }
          
          // 减去防御值
          const reducedDamage = Math.max(1, damage - Math.floor(playerDefense * 0.3));
          const damageReduction = damage - reducedDamage;

          if (isMonsterCrit) {
            logs.push(`CRITICAL! 👹 ${mName} 攻击了你，造成了 ${reducedDamage} 点伤害！`);
          } else {
            logs.push(`👹 ${mName} 攻击了你，造成了 ${reducedDamage} 点伤害！`);
          }

          
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
  console.log('Survived:', true);
  console.log('Final HP:', hp);
  console.log('Total EXP gained:', totalExp);
  console.log('Total Gold gained:', totalGold);
  console.log('Log entries created:', logs.length);
  console.log('Final logs:', logs);
  
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
      monstersCount: monsters.length,
      monsterIds: monsterIds,
      foundMonsters: monsters.map(m => m.name),
      rounds: roundCounter
    }
  };
};