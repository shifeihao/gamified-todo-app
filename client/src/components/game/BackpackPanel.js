// 🎒 RPG风格背包组件（支持右键菜单）
// 文件路径：components/game/BackpackPanel.js

import React, { useState } from "react";

const categoryMap = {
  全部: "",
  武器: "weapon",
  防具: "armor",
  消耗品: "consumable",
  材料: "material",
};

export default function BackpackPanel({
  inventory,
  selectedCategory,
  onEquip,
}) {
  const [contextMenu, setContextMenu] = useState(null); // { x, y, itemId }

  const filteredInventory =
    selectedCategory === "全部"
      ? inventory.filter((entry) => !entry.equipped)
      : inventory.filter(
          (entry) =>
            entry.item.type === categoryMap[selectedCategory] && !entry.equipped
        );

  const handleRightClick = (e, itemId) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemId });
  };

  const handleEquipClick = () => {
    if (contextMenu?.itemId) {
      onEquip(contextMenu.itemId);
      setContextMenu(null);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {filteredInventory.length === 0 ? (
        <p>暂无物品</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: "10px",
            background: "#e0e0e0",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          {filteredInventory.map((entry) => (
            <div
              key={entry._id}
              title={`${entry.item.name}\n${entry.item.description}`}
              onDoubleClick={() => {
                onEquip(entry._id);
              }}
              style={{
                width: "100px",
                height: "100px",
                backgroundImage: `url(/Icon/Item/${entry.item.icon}.png)` || "",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                border: "1px solid #aaa",
                borderRadius: "4px",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  bottom: "2px",
                  right: "4px",
                  background: "rgba(0,0,0,0.5)",
                  color: "white",
                  fontSize: "12px",
                  padding: "2px 4px",
                  borderRadius: "4px",
                }}
              >
                {entry.quantity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <ul
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "4px 0",
            zIndex: 9999,
            boxShadow: "2px 2px 8px rgba(0,0,0,0.2)",
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <li
            onClick={handleEquipClick}
            style={{
              padding: "6px 16px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: "14px",
            }}
          >
            装备
          </li>
          <li
            onClick={() => setContextMenu(null)}
            style={{
              padding: "6px 16px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: "14px",
            }}
          >
            取消
          </li>
        </ul>
      )}
    </div>
  );
}
