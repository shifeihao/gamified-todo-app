// 🎽 RPG风格装备栏组件：显示当前穿戴的装备并支持右键卸下
// 文件路径：components/game/EquipmentPanel.js

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
  head: "头部",
  chest: "胸部",
  legs: "腿部",
  hands: "手部",
  feet: "脚部",
  mainHand: "主手",
  offHand: "副手",
  accessory: "饰品",
};

export default function EquipmentPanel({ equipment, onRightClick }) {
  const { slots } = equipment || {};

  return (
    <div
      style={{
        border: "2px solid #aaa",
        borderRadius: "8px",
        padding: "1rem",
        marginTop: "2rem",
        background: "#fafafa",
      }}
    >
      <h3 style={{ marginBottom: "0.5rem" }}>🛡️ 当前装备</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
          gap: "10px",
        }}
      >
        {slotOrder.map((slot) => {
          const userInventoryItem = slots?.[slot];
          const item = userInventoryItem?.item;
          return (
            <div
              key={slot}
              onDoubleClick={() => {
                onRightClick(slot, item);
              }}
              style={{
                width: "100%",
                height: "80px",
                background: "#ddd",
                borderRadius: "6px",
                position: "relative",
                backgroundImage: item
                  ? `url(/Icon/Item/${item.icon}.png)`
                  : "none",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                cursor: item ? "pointer" : "default",
              }}
              title={
                item ? `${item.name}\n${item.description}` : slotNames[slot]
              }
            >
              {!item && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "4px",
                    left: "4px",
                    fontSize: "12px",
                    color: "#444",
                  }}
                >
                  {slotNames[slot]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
