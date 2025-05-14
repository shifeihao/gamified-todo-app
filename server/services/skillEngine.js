export const triggerSkills = async (triggerType, character, context) => {
  // 获取符合触发条件的技能
  const skills = character.Skills.filter(
    (skill) =>
      skill.trigger === triggerType &&
      checkTriggerCondition(skill, character, context)
  ).sort((a, b) => b.priority - a.priority); // 按优先级排序

  // 应用技能效果
  const results = [];
  for (const skill of skills) {
    if (skill.once && skillHasBeenUsed(skill, character)) continue;
    if (skill.cooldown > 0 && isOnCooldown(skill, character)) continue;

    const result = await applySkillEffect(skill, character, context);
    results.push(result);

    // 记录技能使用
    trackSkillUsage(skill, character);
  }

  return results;
};

// 在各个触发点调用
// 例如，在战斗开始时
const battleStartEffects = await triggerSkills("onStartBattle", player, {
  monsters,
});

// 角色受到伤害时
const damageReceivedEffects = await triggerSkills("onReceiveHit", player, {
  damage,
  attacker,
  currentHp,
});
