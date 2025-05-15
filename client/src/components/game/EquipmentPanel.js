import React, { useState } from "react";

const slotOrder = [
  "head",
  "chest", 
  "legs",
  "hands",
  "feet",
  "mainHand",
  "offHand",
  "accessory",
];

const slotNames = {
  head: "Head",
  chest: "Chest",
  legs: "Legs",
  hands: "Hands",
  feet: "Feet",
  mainHand: "Main Hand",
  offHand: "Off Hand",
  accessory: "Accessory",
};

const slotIcons = {
  head: "🪖",
  chest: "🧥",
  legs: "👖",
  hands: "🧤",
  feet: "👢",
  mainHand: "⚔️",
  offHand: "🛡️",
  accessory: "💍",
};

// Helper function to get item stats/effects
export const getItemEffects = (item) => {
  if (!item) return null;
  
  // Default stats if not present
  return {
    attack: item.stats?.attack || item.attack || 0,
    defense: item.stats?.defense || item.defense || 0,
    magicPower: item.stats?.magicPower || item.magicPower || 0,
    speed: item.stats?.speed || item.speed || 0,
    hp: item.stats?.hp || item.hp || 0,
    // Add other potential stats
    critRate: item.stats?.critRate || item.critRate || 0,
    evasion: item.stats?.evasion || item.evasion || 0,
  };
};

export function computeTotalStats(slots) {
  const total = {
    attack: 0, defense: 0, magicPower: 0,
    speed: 0, hp: 0, critRate: 0, evasion: 0
  };

  Object.values(slots || {}).forEach(slot => {
    if (!slot || !slot.item) return;
    const { item } = slot;
    const eff = getItemEffects(item);
    Object.entries(eff).forEach(([k,v]) => {
      if (typeof total[k] === 'number') total[k] += v;
    });
  });

  return total;
}

export default function EquipmentPanel({ equipment, onRightClick }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { slots } = equipment || {};
  const totalStats = computeTotalStats(slots);

  const handleMouseEnter = (e, item) => {
    setHoveredItem(item);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const renderTooltip = () => {
    if (!hoveredItem) return null;

    const effects = getItemEffects(hoveredItem.item) || {};
    const effectStrings = [];
    
    Object.entries(effects).forEach(([stat, value]) => {
      if (value !== 0) {
        effectStrings.push(`${stat}: ${value > 0 ? '+' : ''}${value}`);
      }
    });

    const hasEffects = effectStrings.length > 0;

    return (
      <div
        className="fixed bg-[#2c1810] text-[#e0e0e0] p-3 rounded-lg border-2 border-[#7e4ab8] font-mono text-sm min-w-[200px] max-w-[300px] z-[1000] shadow-lg"
        style={{
          left: mousePos.x + 10,
          top: mousePos.y - 10,
        }}
      >
        <div className="font-bold text-white mb-2">
          {hoveredItem.item?.name || "Unknown Item"}
        </div>
        <div className="text-[#b89be6] mb-2.5 leading-relaxed">
          {hoveredItem.item?.description || "No description available"}
        </div>
        <div className="border-t border-[#7e4ab8] pt-2 text-[#ffa726]">
          ---
        </div>
        <div className={`mt-2 leading-relaxed ${hasEffects ? 'text-[#4caf50]' : 'text-[#999999]'}`}>
          {hasEffects ? effectStrings.join(", ") : "No stat bonuses"}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border-2 border-transparent rounded-lg p-5 relative">
      <h3 className="mb-5 text-[#2c1810] border-b-2 border-[#4c2a85] pb-2.5 text-lg">
        🛡️ Current Equipment
      </h3>
      
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4">
        {slotOrder.map((slot) => {
          const userInventoryItem = slots?.[slot];
          const item = userInventoryItem?.item;
          const effects = getItemEffects(item);
          
          return (
            <div
              key={slot}
              onDoubleClick={() => {
                if (item) onRightClick(slot, userInventoryItem);
              }}
              onMouseEnter={item ? (e) => handleMouseEnter(e, userInventoryItem) : undefined}
              onMouseMove={item ? handleMouseMove : undefined}
              onMouseLeave={item ? handleMouseLeave : undefined}
              className={`w-[100px] h-[100px] ${item ? 'bg-[#4c2a85] cursor-pointer hover:bg-[#5d3494] hover:scale-105' : 'bg-[#3a1f6b]'} rounded-lg relative border-2 border-[#5d3494] flex items-center justify-center transition-all duration-200 bg-contain bg-no-repeat bg-center`}
              style={{
                backgroundImage: item && item.icon ? `url(/Icon/Item/${item.icon}.png)` : "none",
              }}
            >
              {/* Slot icon when empty */}
              {!item && (
                <div className="text-2xl opacity-70">
                  {slotIcons[slot]}
                </div>
              )}
              
              {/* Slot label */}
              <div className="absolute bottom-0.5 left-0.5 right-0.5 bg-[#2c1810]/80 text-white text-xs px-1 py-0.5 rounded text-center font-bold">
                {slotNames[slot]}
              </div>
              
              {/* Quality indicator (if item has rarity) */}
              {item && item.rarity && (
                <div 
                  className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: 
                      item.rarity === "legendary" ? "#ffd700" :
                      item.rarity === "epic" ? "#9c27b0" :
                      item.rarity === "rare" ? "#2196f3" :
                      item.rarity === "uncommon" ? "#4caf50" : "#9e9e9e"
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Equipment Summary */}
      <div className="mt-5 bg-[#f5f5f5] border-2 border-[#7e4ab8] rounded-lg p-4">
        <h4 className="m-0 mb-2.5 text-[#2c1810] text-sm">
          📊 Equipment Summary
        </h4>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5 text-xs">
          {Object.entries(totalStats)
            .filter(([stat, value]) => value > 0)
            .map(([stat, value]) => (
              <div key={stat} className="bg-[#3a1f6b] text-[#e0e0e0] p-1.5 rounded text-center">
                <div className="font-bold">
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </div>
                <div>+{value}</div>
              </div>
            ))
          }
        </div>
        {Object.values(slots || {}).every(slot => !slot?.item) && (
          <p className="text-center text-[#666] italic my-2.5">
            No equipment equipped
          </p>
        )}
      </div>

      {/* Tooltip */}
      {renderTooltip()}
    </div>
  );
}