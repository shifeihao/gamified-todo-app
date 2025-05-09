// services/combatEngine.js
import { Monster } from '../models/Monster.js';
import { Skill } from '../models/Skill.js';

// 增强版：自动战斗执行逻辑，包含详细调试信息
export const executeCombat = async (monsterIds, stats, currentHp) => {
  console.log('======= COMBAT ENGINE START =======');
  console.log('Monster IDs to fight:', monsterIds);
  console.log('Initial player HP:', currentHp);
  console.log('Player stats:', {
    level: stats.dungeonLevel || 1,
    attack: stats.assignedStats?.attack || 0,
    defense: stats.assignedStats?.defense || 0,
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
    skillsCount: m.skills?.length || 0
  })));

  const logs = [];
  let hp = currentHp ?? 100;
  let totalExp = 0;
  let totalGold = 0;
  let roundCounter = 0;

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
    
    logs.push(`Encountered ${mName} (HP: ${mHp}, ATK: ${mAttack})`);
    console.log(`Monster stats: HP=${mHp}, ATK=${mAttack}`);
    
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
    
    // 技能或攻击处理（简化：只选最高优先级技能）
    const usableSkills = (monster.skills || []).filter(s => s.effect === 'dealDamage');
    console.log(`Monster has ${usableSkills.length} usable damage skills`);
    
    const selectedSkill = usableSkills.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
    if (selectedSkill) {
      console.log(`Monster will use skill: ${selectedSkill.name}`);
    } else {
      console.log('Monster will use normal attack');
    }
    
    // 计算伤害
    let damage = 0;
    if (selectedSkill) {
      // 技能伤害
      damage = Math.round(selectedSkill.effectValue * 0.9);
      console.log(`Skill damage calculation: ${selectedSkill.effectValue} * 0.9 = ${damage}`);
      logs.push(`${mName} used ${selectedSkill.name}, dealt ${damage} damage!`);
    } else {
      // 普通攻击
      damage = Math.floor(monster.stats.attack * 0.6);
      console.log(`Normal attack damage calculation: ${monster.stats.attack} * 0.6 = ${damage}`);
      logs.push(`${mName} attacked normally, dealt ${damage} damage.`);
    }
    
    // 更新玩家HP
    const oldHp = hp;
    hp -= damage;
    console.log(`Player HP: ${oldHp} - ${damage} = ${hp}`);
    logs.push(`Your HP: ${hp}/${currentHp}`);
    
    // 计算经验和金币
    const expGain = monster.expDrop || 0;
    const goldGain = monster.goldDrop || 0;
    totalExp += expGain;
    totalGold += goldGain;
    
    console.log(`Rewards: EXP +${expGain}, Gold +${goldGain}`);
    
    // 检查玩家是否被击败
    if (hp <= 0) {
      console.log('Player defeated!');
      logs.push(`You were defeated by ${mName}...`);
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
    
    // 简单的玩家攻击回合
    const playerAttack = stats.assignedStats?.attack || 10;
    const playerDamage = Math.floor(playerAttack * 0.8);
    logs.push(`You attacked ${mName}, dealt ${playerDamage} damage.`);
    console.log(`Player attacks for ${playerDamage} damage`);
    
    logs.push(`You defeated ${mName}!`);
    console.log(`Monster ${mName} defeated`);
  }
  
  // 战斗胜利
  logs.push(`=== Combat End: Victory ===`);
  logs.push(`You survived all encounters.`);
  logs.push(`Gained ${totalExp} EXP and ${totalGold} gold.`);
  
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