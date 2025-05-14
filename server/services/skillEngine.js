export const triggerSkills = async (triggerType, character, context) => {
  // Get skills that match the trigger condition
  const skills = character.Skills.filter(skill =>
    skill.trigger === triggerType && checkTriggerCondition(skill, character, context)
  ).sort((a, b) => b.priority - a.priority); // Sort by priority
  
  // Apply skill effects
  const results = [];
  for (const skill of skills) {
    if (skill.once && skillHasBeenUsed(skill, character)) continue;
    if (skill.cooldown > 0 && isOnCooldown(skill, character)) continue;
    
    const result = await applySkillEffect(skill, character, context);
    results.push(result);
    
    // Track skill usage
    trackSkillUsage(skill, character);
  }
  
  return results;
};

// Call at various trigger points
// For example, at battle start
const battleStartEffects = await triggerSkills('onStartBattle', player, { monsters });

// When character receives damage
const damageReceivedEffects = await triggerSkills('onReceiveHit', player, {
  damage, attacker, currentHp
});