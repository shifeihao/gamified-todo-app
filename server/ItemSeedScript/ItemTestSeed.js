
const seedItems = [
    // ⚔️ Weapons
    new WeaponItem({
      name: '铁剑',
      type: 'weapon',
      price: 120,
      icon: 'icon-sword',
      description: '一把普通的铁剑，适合新手战士。',
      weaponType: 'sword',
      stats: { attack: 12, magicPower: 0, critRate: 0.05, accuracy: 0.9 },
      slot: 'mainHand',
      allowedClasses: ['warrior']
    }),
    new WeaponItem({
      name: '学徒魔杖',
      type: 'weapon',
      price: 140,
      icon: 'icon-staff',
      description: '适合初学者的魔法法杖，附有微弱的魔力。',
      weaponType: 'staff',
      stats: { attack: 3, magicPower: 15, critRate: 0.02, accuracy: 0.95 },
      slot: 'mainHand',
      allowedClasses: ['mage']
    }),
    new WeaponItem({
      name: '精准短弓',
      type: 'weapon',
      price: 135,
      icon: 'icon-bow',
      description: '短小精悍的弓箭，提高命中率与暴击率。',
      weaponType: 'bow',
      stats: { attack: 9, magicPower: 0, critRate: 0.12, accuracy: 0.97 },
      slot: 'mainHand',
      allowedClasses: ['archer']
    }),
  
    // 🛡️ Armors
    new ArmorItem({
      name: '皮革护甲',
      type: 'armor',
      price: 90,
      icon: 'icon-leather',
      description: '轻便的皮甲，适合敏捷职业。',
      armorType: 'leather',
      stats: { defense: 5, magicResist: 2, evasion: 0.05 },
      slot: 'chest',
      allowedClasses: ['rogue', 'archer']
    }),
    new ArmorItem({
      name: '学徒长袍',
      type: 'armor',
      price: 100,
      icon: 'icon-cloth',
      description: '魔法师专用的长袍，提升魔抗和回避能力。',
      armorType: 'cloth',
      stats: { defense: 2, magicResist: 5, evasion: 0.1 },
      slot: 'chest',
      allowedClasses: ['mage']
    }),
    new ArmorItem({
      name: '铁制圆盾',
      type: 'armor',
      price: 110,
      icon: 'icon-shield',
      description: '结实的圆盾，提升物理防御力。',
      armorType: 'shield',
      stats: { defense: 8, magicResist: 1, evasion: 0.02 },
      slot: 'offHand',
      allowedClasses: ['warrior']
    }),
  
    // 💊 Consumables
    new ConsumableItem({
      name: '小型治疗药水',
      type: 'consumable',
      price: 50,
      icon: 'icon-heal',
      description: '当生命值低于30%时，自动恢复30点生命值。',
      effect: 'heal',
      potency: 30,
      trigger: 'onLowHp'
    }),
    new ConsumableItem({
      name: '攻击力强化剂',
      type: 'consumable',
      price: 65,
      icon: 'icon-buff-attack',
      description: '在本次探索中提升10%攻击力。',
      effect: 'buff-attack',
      potency: 0.10,
      trigger: 'onBattleStart'
    }),
  
    // 🔮 Materials
    new MaterialItem({
      name: '史莱姆凝胶',
      type: 'material',
      icon: 'icon-slime',
      description: '从史莱姆体内提取的材料，可用于基础炼金。',
      rarity: 'common',
      source: 'slime'
    }),
    new MaterialItem({
      name: '幽影结晶',
      type: 'material',
      icon: 'icon-crystal',
      description: '在幽影地带稀有采集到的魔力结晶。',
      rarity: 'rare',
      source: 'ghost'
    })
  ];
  

