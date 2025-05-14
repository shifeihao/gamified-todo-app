// 🎒 Pixel-style Backpack Component with Context Menu
// File: components/game/BackpackPanel.js

import React, { useState } from "react";

const categoryMap = {
  All: "",
  Weapons: "weapon",
  Armor: "armor",
  Consumables: "consumable",
  Materials: "material",
};

export default function BackpackPanel({
  inventory,
  selectedCategory,
  onEquip,
}) {
  const [contextMenu, setContextMenu] = useState(null); // { x, y, itemId }

  const filteredInventory =
    selectedCategory === "All"
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
        <div style={{
          textAlign: "center",
          padding: "40px",
          backgroundColor: "#3a1f6b",
          borderRadius: "8px",
          color: "#b89be6",
          border: "2px solid #5d3494"
        }}>
          <p style={{ fontStyle: "italic" }}>No items found</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            gap: "10px",
            backgroundColor: "#2c1810",
            padding: "15px",
            borderRadius: "8px",
            border: "2px solid #5d3494"
          }}
        >
          {filteredInventory.map((entry) => (
            <div
              key={entry._id}
              title={`${entry.item.name}\n${entry.item.description || "No description"}`}
              onDoubleClick={() => {
                onEquip(entry._id);
              }}
              onContextMenu={(e) => handleRightClick(e, entry._id)}
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#4c2a85",
                borderRadius: "8px",
                position: "relative",
                cursor: "pointer",
                border: "2px solid #7e4ab8",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundImage: entry.item.icon ? `url(/Icon/Item/${entry.item.icon}.png)` : "none",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center"
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#5d3494";
                e.target.style.transform = "scale(1.05)";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#4c2a85";
                e.target.style.transform = "scale(1)";
              }}
            >
              {!entry.item.icon && (
                <span style={{ fontSize: "24px" }}>📦</span>
              )}
              
              {/* Quantity Badge */}
              <div style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                backgroundColor: "#e74c3c",
                color: "white",
                fontSize: "10px",
                padding: "2px 4px",
                borderRadius: "4px",
                fontWeight: "bold",
                border: "1px solid #c0392b"
              }}>
                {entry.quantity}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: "#3a1f6b",
            border: "2px solid #5d3494",
            borderRadius: "6px",
            padding: "8px 0",
            zIndex: 9999,
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            color: "#e0e0e0",
            fontFamily: "Courier New, monospace"
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div
            onClick={handleEquipClick}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: "14px",
              transition: "background-color 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#5d3494";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            ⚔️ Equip
          </div>
          <div
            onClick={() => setContextMenu(null)}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: "14px",
              transition: "background-color 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#5d3494";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            ❌ Cancel
          </div>
        </div>
      )}
    </div>
  );
}