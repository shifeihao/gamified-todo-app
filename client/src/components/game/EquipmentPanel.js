// 🛡️ Pixel-style Equipment Panel with stats effects
// File: components/game/EquipmentPanel.js

import React from "react";

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

export default function EquipmentPanel({ equipment, onRightClick }) {
  const { slots } = equipment || {};

  return (
    <div style={{
      backgroundColor: "#ffffff",
      border: "2px solid transparent",
      borderRadius: "8px",
      padding: "20px"
    }}>
      <h3 style={{ 
        marginBottom: "20px",
        color: "#2c1810",
        borderBottom: "2px solid #4c2a85",
        paddingBottom: "10px",
        fontSize: "18px"
      }}>
        🛡️ Current Equipment
      </h3>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: "15px",
      }}>
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
              style={{
                width: "100px",
                height: "100px",
                backgroundColor: item ? "#4c2a85" : "#3a1f6b",
                borderRadius: "8px",
                position: "relative",
                cursor: item ? "pointer" : "default",
                border: "2px solid #5d3494",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                backgroundImage: item && item.icon ? `url(/Icon/Item/${item.icon}.png)` : "none",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center"
              }}
              onMouseOver={(e) => {
                if (item) {
                  e.target.style.backgroundColor = "#5d3494";
                  e.target.style.transform = "scale(1.05)";
                }
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = item ? "#4c2a85" : "#3a1f6b";
                e.target.style.transform = "scale(1)";
              }}
              title={
                item
                  ? `${item.name}\n${item.description || "No description"}\n` +
                    (effects ? 
                      Object.entries(effects)
                        .filter(([key, value]) => value > 0)
                        .map(([key, value]) => `${key}: +${value}`)
                        .join("\n") 
                      : "No stat bonuses")
                  : slotNames[slot]
              }
            >
              {/* Slot icon when empty */}
              {!item && (
                <div style={{
                  fontSize: "24px",
                  opacity: 0.7
                }}>
                  {slotIcons[slot]}
                </div>
              )}
              
              {/* Slot label */}
              <div style={{
                position: "absolute",
                bottom: "2px",
                left: "2px",
                right: "2px",
                backgroundColor: "rgba(44, 24, 16, 0.8)",
                color: "#ffffff",
                fontSize: "10px",
                padding: "2px 4px",
                borderRadius: "4px",
                textAlign: "center",
                fontWeight: "bold"
              }}>
                {slotNames[slot]}
              </div>
              
              {/* Quality indicator (if item has rarity) */}
              {item && item.rarity && (
                <div style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
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
      <div style={{
        marginTop: "20px",
        backgroundColor: "#f5f5f5",
        border: "2px solid #7e4ab8",
        borderRadius: "8px",
        padding: "15px"
      }}>
        <h4 style={{ 
          margin: "0 0 10px 0",
          color: "#2c1810",
          fontSize: "14px"
        }}>
          📊 Equipment Summary
        </h4>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "10px",
          fontSize: "12px"
        }}>
          {(() => {
            // Calculate total stats from all equipped items
            const totalStats = {
              attack: 0,
              defense: 0,
              magicPower: 0,
              speed: 0,
              hp: 0,
              critRate: 0,
              evasion: 0
            };
            
            Object.values(slots || {}).forEach(userInventoryItem => {
              if (userInventoryItem?.item) {
                const effects = getItemEffects(userInventoryItem.item);
                if (effects) {
                  Object.entries(effects).forEach(([stat, value]) => {
                    if (totalStats.hasOwnProperty(stat)) {
                      totalStats[stat] += value;
                    }
                  });
                }
              }
            });
            
            return Object.entries(totalStats)
              .filter(([stat, value]) => value > 0)
              .map(([stat, value]) => (
                <div key={stat} style={{
                  backgroundColor: "#3a1f6b",
                  color: "#e0e0e0",
                  padding: "6px",
                  borderRadius: "4px",
                  textAlign: "center"
                }}>
                  <div style={{ fontWeight: "bold" }}>
                    {stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </div>
                  <div>+{value}</div>
                </div>
              ));
          })()}
        </div>
        {Object.values(slots || {}).every(slot => !slot?.item) && (
          <p style={{ 
            textAlign: "center",
            color: "#666",
            fontStyle: "italic",
            margin: "10px 0"
          }}>
            No equipment equipped
          </p>
        )}
      </div>
    </div>
  );
}