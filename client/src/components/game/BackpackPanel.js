import React, { useState } from "react";
import { getItemEffects } from './EquipmentPanel';

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
  const [contextMenu, setContextMenu] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    <div className="relative">
      {filteredInventory.length === 0 ? (
        <div className="text-center p-10 bg-[#3a1f6b] rounded-lg text-[#b89be6] border-2 border-[#5d3494]">
          <p className="italic">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2.5 bg-[#2c1810] p-4 rounded-lg border-2 border-[#5d3494]">
          {filteredInventory.map((entry) => (
            <div
              key={entry._id}
              onDoubleClick={() => onEquip(entry._id)}
              onContextMenu={(e) => handleRightClick(e, entry._id)}
              onMouseEnter={(e) => handleMouseEnter(e, entry)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-20 h-20 bg-[#4c2a85] rounded-lg relative cursor-pointer border-2 border-[#7e4ab8] transition-all duration-200 flex items-center justify-center bg-contain bg-no-repeat bg-center hover:bg-[#5d3494] hover:scale-105"
              style={{
                backgroundImage: entry.item.icon ? `url(/Icon/Item/${entry.item.icon}.png)` : "none",
              }}
            >
              {!entry.item.icon && (
                <span className="text-2xl">📦</span>
              )}
              
              {/* Quantity Badge */}
              <div className="absolute bottom-0.5 right-0.5 bg-[#e74c3c] text-white text-xs px-1 py-0.5 rounded font-bold border border-[#c0392b]">
                {entry.quantity}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-[#3a1f6b] border-2 border-[#5d3494] rounded-md py-2 z-[9999] shadow-lg text-[#e0e0e0] font-mono"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div
            onClick={handleEquipClick}
            className="px-4 py-2 cursor-pointer whitespace-nowrap text-sm transition-colors duration-200 hover:bg-[#5d3494]"
          >
            ⚔️ Equip
          </div>
          <div
            onClick={() => setContextMenu(null)}
            className="px-4 py-2 cursor-pointer whitespace-nowrap text-sm transition-colors duration-200 hover:bg-[#5d3494]"
          >
            ❌ Cancel
          </div>
        </div>
      )}

      {/* Tooltip */}
      {renderTooltip()}
    </div>
  );
}