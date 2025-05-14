// services/combatEngine.js
import { Monster } from '../models/Monster.js';
import { Skill } from '../models/Skill.js';

// Simplified class configuration
const CLASS_COMBAT_CONFIG = {
  warrior: {
    name: 'Warrior',
    // Warrior uses physical attack power
    getDamage: (stats) => {
      return Math.floor(stats.assignedStats?.attack * 0.8);
    },
    // Warrior reduces more damage
    reduceDamage: (damage, stats) => {
      return Math.max(1, damage - Math.floor(stats.assignedStats?.defense * 0.35));
    }
  },
  mage: {
    name: 'Mage',
    // Mage uses magic power - increased base coefficient to 1.2
    getDamage: (stats) => {
      return Math.floor(stats.assignedStats?.magicPower * 1.2);
    },
    // Mage has less physical damage reduction
    reduceDamage: (damage, stats) => {
      return Math.max(1, damage - Math.floor(stats.assignedStats?.defense * 0.2));
    }
  },
  rogue: {
    name: 'Rogue',
    // Rogue attack power + speed bonus
    getDamage: (stats) => {
      const speedBonus = Math.floor((stats.assignedStats?.speed || 5) * 0.2);
      return Math.floor(stats.assignedStats?.attack * 0.7 + speedBonus);
    },
    // Rogue has additional evasion
    getEvasionBonus: (stats) => {
      return (stats.assignedStats?.speed || 0) * 0.5;
    },
    reduceDamage: (damage, stats) => {
      return Math.max(1, damage - Math.floor(stats.assignedStats?.defense * 0.25));
    }
  },
  archer: {
    name: 'Archer',
    // Archer attack power + crit bonus
    getDamage: (stats) => {
      const critBonus = Math.floor((stats.assignedStats?.critRate || 5) * 0.3);
      return Math.floor(stats.assignedStats?.attack * 0.75 + critBonus);
    },
    // Archer first attack increases crit rate
    getFirstAttackCritBonus: () => {
      return 20; // +20% crit rate
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
  
  // Detailed output of player class information
  console.log('Player class info:', {
    classSlug: stats.classSlug || 'not set',
    className: stats.className || 'not set'
  });
  
  // Get player class - try to infer from classSlug or className
  let playerClass = 'warrior'; // Default class
  
  if (stats.classSlug && CLASS_COMBAT_CONFIG[stats.classSlug]) {
    playerClass = stats.classSlug;
    console.log(`Using class from stats.classSlug: ${playerClass}`);
  } 
  // If no classSlug, try to infer from className
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

  // Find all related monsters
  const monsters = await Monster.find({ _id: { $in: monsterIds } }).populate('skills');
  console.log(`Found ${monsters.length} of ${monsterIds.length} monsters`);
  
  // Check if there are monsters
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

  // Record found monsters
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

  // Get player base stats
  const playerCritRate = stats.assignedStats?.critRate || 0; // Percentage
  const baseEvasion = stats.assignedStats?.evasion || 0;     // Percentage
  
  // Calculate additional evasion based on class (rogue trait)
  let playerEvasion = baseEvasion;
  if (playerClass === 'rogue' && classConfig.getEvasionBonus) {
    playerEvasion += classConfig.getEvasionBonus(stats);
    console.log(`Rogue evasion bonus: +${classConfig.getEvasionBonus(stats).toFixed(1)}% (Total: ${playerEvasion.toFixed(1)}%)`);
  }

  // Create detailed combat log
  logs.push(`=== Combat Start ===`);
  logs.push(`Your HP: ${hp}`);
  logs.push(`Class: ${classConfig.name}`);

  // Process each monster
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
    
    // Check monster skills
    console.log(`Monster has ${monster.skills?.length || 0} skills`);
    if (monster.skills && monster.skills.length > 0) {
      console.log('Available skills:', monster.skills.map(s => ({
        name: s.name,
        effect: s.effect,
        value: s.effectValue,
        priority: s.priority
      })));
    }
    
    // Monster actual HP
    let monsterCurrentHp = mHp;
    let turnCounter = 0;
    
    // Higher speed goes first
    let playerTurn = (stats.assignedStats?.speed || 0) >= mSpeed;
    
    // Archer always goes first (simplified class trait)
    if (playerClass === 'archer') {
      playerTurn = true;
      console.log('Archer always strikes first!');
      logs.push(`As an archer, you take the first shot!`);
    } else {
      console.log(`Initial turn: ${playerTurn ? 'Player' : 'Monster'} goes first (Speed comparison)`);
      logs.push(`${playerTurn ? 'You' : mName} moves first!`);
    }
    
    // For archer first attack trait
    let isFirstPlayerAttack = true;
    
    // Local combat loop
    while (monsterCurrentHp > 0 && hp > 0) {
      turnCounter++;
      console.log(`Turn ${turnCounter}`);
      
      if (playerTurn) {
        // Player turn
        console.log('Player turn');
        
        // Get base damage based on class
        let playerDamage = classConfig.getDamage(stats);
        console.log(`Base ${playerClass} damage: ${playerDamage}`);
        
        // Archer first attack crit rate bonus
        let critChance = playerCritRate;
        if (playerClass === 'archer' && isFirstPlayerAttack && classConfig.getFirstAttackCritBonus) {
          critChance += classConfig.getFirstAttackCritBonus();
          console.log(`Archer first attack bonus: +${classConfig.getFirstAttackCritBonus()}% crit chance (Total: ${critChance}%)`);
        }
        
        // Critical hit detection
        const isCritical = Math.random() * 100 < critChance;
        if (isCritical) {
          playerDamage = Math.floor(playerDamage * 1.5); // Critical damage 1.5x
          console.log(`Player scores a critical hit! Damage: ${playerDamage}`);
          logs.push(`CRITICAL! 🗡️ You attacked ${mName}, dealing ${playerDamage} damage!`);
        } else {
          logs.push(`🗡️ You attacked ${mName}, dealing ${playerDamage} damage!`);
        }
        
        // Calculate actual damage to monster (based on physical/magic defense)
        let finalDamage = playerDamage;
        if (playerClass === 'mage') {
          // Mage damage affected by magic resistance - reduced resistance effect, max only reduces 50% of resistance value
          const magicResistReduction = Math.floor(playerDamage * (mMagicResist / 200)); // Divide by 200 instead of 100, reducing resistance effect
          finalDamage = Math.max(1, playerDamage - magicResistReduction);
          if (magicResistReduction > 0) {
            console.log(`Monster magic resist reduced damage: ${playerDamage} -> ${finalDamage}`);
            logs.push(`${mName}'s magic resistance reduced ${magicResistReduction} damage`);
          }
          
          // Mage's critical hit has additional effect
          if (isCritical) {
            // Critical hit ignores 30% of magic resistance
            const penetrationBonus = Math.floor(magicResistReduction * 0.3);
            if (penetrationBonus > 0) {
              finalDamage += penetrationBonus;
              console.log(`Critical hit magic penetration bonus: +${penetrationBonus} damage`);
              logs.push(`Magic penetration! Your spell ignored part of the magic resistance!`);
            }
          }
        } else {
          // Physical attack affected by monster defense
          const defenseReduction = Math.floor(mDefense * 0.3);
          finalDamage = Math.max(1, playerDamage - defenseReduction);
          if (defenseReduction > 0) {
            console.log(`Monster defense reduced damage: ${playerDamage} -> ${finalDamage}`);
          }
        }
        
        // Reduce monster HP
        monsterCurrentHp -= finalDamage;
        console.log(`Monster HP: ${monsterCurrentHp + finalDamage} -> ${monsterCurrentHp}`);
        
        // Check if monster is defeated
        if (monsterCurrentHp <= 0) {
          console.log(`Monster defeated in ${turnCounter} turns`);
          logs.push(`You defeated ${mName}!`);
          break;
        }
        
        // Mark as non-first attack
        isFirstPlayerAttack = false;
        
      } else {
        // Monster turn
        console.log('Monster turn');
        
        // Evasion detection
        const isEvaded = Math.random() * 100 < playerEvasion;
        if (isEvaded) {
          console.log(`Player evaded the attack! (${playerEvasion.toFixed(1)}% chance)`);
          logs.push(`EVADE! 👹 ${mName}'s attack was evaded by you!`);
        } else {
          // Skill or attack handling (choose highest priority skill)
          const usableSkills = (monster.skills || []).filter(s => s.effect === 'dealDamage');
          console.log(`Monster has ${usableSkills.length} usable damage skills`);
          
          const selectedSkill = usableSkills.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
          
          // Calculate damage
          let damage = 0;
          if (selectedSkill) {
            // Skill damage
            damage = Math.round(selectedSkill.effectValue * 0.9);
            console.log(`Skill damage calculation: ${selectedSkill.effectValue} * 0.9 = ${damage}`);
            logs.push(`${mName} used ${selectedSkill.name}, dealt ${damage} damage!`);
          } else {
            // Normal attack
            damage = Math.floor(mAttack * 0.6);
            
            // Monster critical hit detection
            const isMonsterCrit = Math.random() * 100 < mCritRate;
            if (isMonsterCrit) {
              damage = Math.floor(damage * 1.5);
              console.log(`Monster scores a critical hit! Damage: ${damage}`);
              logs.push(`CRITICAL! 👹 ${mName} attacked you, dealing ${damage} damage!`);
            } else {
              console.log(`Normal attack damage: ${damage}`);
              logs.push(`👹 ${mName} attacked you, dealing ${damage} damage!`);
            }
          }
          
          // Calculate actual damage based on class damage reduction
          const reducedDamage = classConfig.reduceDamage(damage, stats);
          const damageReduction = damage - reducedDamage;
          
          if (damageReduction > 0) {
            console.log(`Damage reduced by defense: ${damage} -> ${reducedDamage} (${damageReduction} blocked)`);
            logs.push(`Your defense blocked ${damageReduction} damage.`);
          }
          
          // Update player HP
          const oldHp = hp;
          hp -= reducedDamage;
          console.log(`Player HP: ${oldHp} - ${reducedDamage} = ${hp}`);
          logs.push(`Your HP: ${hp}/${currentHp}`);
          
          // Check if player is defeated
          if (hp <= 0) {
            console.log('Player defeated!');
            logs.push(`You were defeated by ${mName}...`);
            break;
          }
        }
      }
      
      // Switch turns
      playerTurn = !playerTurn;
    }
    
    // If player is defeated, end the entire combat
    if (hp <= 0) {
      logs.push(`=== Combat End: Defeat ===`);
      
      console.log('======= COMBAT ENGINE RESULT: DEFEAT =======');
      console.log('Final logs:', logs);
      
      return {
        survived: false,
        remainingHp: 0,
        logs,
        gainedExp: 0,  // No EXP gain on failure
        goldGain: 0    // No gold gain on failure
      };
    }
    
    // Calculate experience and gold
    const expGain = monster.expDrop || 0;
    const goldGain = monster.goldDrop || 0;
    totalExp += expGain;
    totalGold += goldGain;
    
    console.log(`Rewards: EXP +${expGain}, Gold +${goldGain}`);
    if (expGain > 0 || goldGain > 0) {
      logs.push(`You gained ${expGain} EXP and ${goldGain} gold.`);
    }
  }
  
  // Combat victory
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
  
  // Update player stats
  const oldExp = stats.dungeonExp || 0;
  const oldGold = stats.gold || 0;
  stats.dungeonExp = oldExp + totalExp;
  stats.gold = oldGold + totalGold;
  
  console.log(`Updated player stats: EXP ${oldExp} -> ${stats.dungeonExp}, Gold ${oldGold} -> ${stats.gold}`);
  
  // Return result with all detailed information
  return {
    survived: true,
    remainingHp: hp,
    logs,
    gainedExp: totalExp,
    goldGain: totalGold,
    // Debug information
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