//📦 Pixel-style Inventory & Shop Page
// File: pages/InventoryShopPage.js
import React, { useEffect, useState } from "react";
import BackpackPanel from "../components/game/BackpackPanel";
import EquipmentPanel from "../components/game/EquipmentPanel";
import { getItemEffects } from '../components/game/EquipmentPanel';
import {
  getUserInventory,
  getShopItems,
  buyItem,
  equipItem,
  unequipItem,
  getUserEquipment,
} from "../services/inventoryShopService";
import axios from "axios";
import { useToast } from "../contexts/ToastContext";

const categories = ["All", "Weapons", "Armor", "Consumables", "Materials"];

export default function InventoryShopPage({ onEquipmentChange }) {
  const [inventory, setInventory] = useState([]);
  const [shop, setShop] = useState([]);
  const [equipment, setEquipment] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [gold, setGold] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { showSuccess, showError } = useToast();

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;
  const token = userInfo?.token || null;

  const categoryMap = {
    All: "",
    Weapons: "weapon",
    Armor: "armor",
    Consumables: "consumable",
    Materials: "material",
  };

  const fetchData = async () => {
    try {
      const shopData = await getShopItems(token);
      setShop(shopData);
      const equipData = await getUserEquipment(token);
      console.log("🛡️ Current Equipment:", equipData);
      setEquipment(equipData);

      if (token) {
        const inv = await getUserInventory(token);
        console.log("🎒 Current Inventory:", inv);
        setInventory(inv);

        const res = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGold(res.data.gold);
      }
    } catch (err) {
      setError(err.message);
      showError("Failed to load shop data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleBuy = async (itemId) => {
    try {
      if (!token) {
        showError("Please login first");
        return;
      }
      await buyItem(itemId, token);
      fetchData();
      showSuccess("Purchase successful!");
    } catch (err) {
      showError("Purchase failed: " + err.message);
    }
  };

  const handleEquip = async (inventoryItemId) => {
    try {
      await equipItem(inventoryItemId, token);
      fetchData();
      onEquipmentChange?.();
      showSuccess("Equipment equipped successfully");
    } catch (err) {
      console.error("❌ Equipment failed:", err);
      showError("Equipment failed: " + err.message);
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

    // 创建属性效果描述
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
        style={{
          position: "fixed",
          left: mousePos.x + 10,
          top: mousePos.y - 10,
          backgroundColor: "#2c1810",
          color: "#e0e0e0",
          padding: "12px",
          borderRadius: "8px",
          border: "2px solid #7e4ab8",
          fontFamily: "Courier New, monospace",
          fontSize: "14px",
          minWidth: "200px",
          maxWidth: "300px",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ 
          fontWeight: "bold", 
          color: "#ffffff",
          marginBottom: "8px"
        }}>
          {hoveredItem.item?.name || "Unknown Item"}
        </div>
        <div style={{ 
          color: "#b89be6",
          marginBottom: "10px",
          lineHeight: "1.4"
        }}>
          {hoveredItem.item?.description || "No description available"}
        </div>
        <div style={{ 
          borderTop: "1px solid #7e4ab8",
          paddingTop: "8px",
          color: "#ffa726"
        }}>
          ---
        </div>
        <div style={{ 
          marginTop: "8px",
          color: hasEffects ? "#4caf50" : "#999999",
          lineHeight: "1.4"
        }}>
          {hasEffects ? effectStrings.join(", ") : "No stat bonuses"}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: "20px",
      fontFamily: "Courier New, monospace",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh",
      color: "#2c1810"
    }}>
      {/* Inventory Section */}
      <div style={{
        marginBottom: "30px",
        backgroundColor: "#ffffff",
        border: "3px solid #7e4ab8",
        borderRadius: "12px",
        padding: "20px"
      }}>
        <h2 style={{ 
          borderBottom: "2px solid #4c2a85",
          marginBottom: "20px",
          paddingBottom: "10px",
          color: "#2c1810",
          position: "relative"
        }}>
          🎒 Inventory
          {gold !== null && (
            <span style={{ 
              position: "absolute",
              right: "0",
              fontSize: "16px", 
              color: "#2c1810",
              backgroundColor: "#ffa726",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "2px solid #ff8f00"
            }}>
              💰 {gold} Gold
            </span>
          )}
        </h2>

        {/* Category Navigation */}
        <div style={{ marginBottom: "20px" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                marginRight: "8px",
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: selectedCategory === cat ? "#4c2a85" : "#5d3494",
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                fontFamily: "Courier New, monospace",
                fontWeight: "bold",
                fontSize: "14px",
                transition: "all 0.2s ease",
                border: "2px solid transparent"
              }}
              onMouseOver={(e) => {
                if (selectedCategory !== cat) {
                  e.target.style.backgroundColor = "#7e4ab8";
                  e.target.style.transform = "translateY(-1px)";
                }
              }}
              onMouseOut={(e) => {
                if (selectedCategory !== cat) {
                  e.target.style.backgroundColor = "#5d3494";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Inventory Panel */}
        {token && (
          <BackpackPanel
            inventory={inventory}
            selectedCategory={selectedCategory}
            onEquip={handleEquip}
          />
        )}
      </div>

      {/* Equipment Section */}
      {token && equipment && (
        <div style={{
          marginBottom: "30px",
          backgroundColor: "#ffffff",
          border: "3px solid #7e4ab8",
          borderRadius: "12px",
          padding: "20px"
        }}>
          <EquipmentPanel
            equipment={equipment}
            onRightClick={async (slot, item) => {
              try {
                await unequipItem(slot, token);
                showSuccess(`Unequipped ${item.item?.name || "item"}`);
                fetchData();
                onEquipmentChange?.();
              } catch (err) {
                console.error("❌ Unequip failed", err);
                showError("Unequip failed: " + err.message);
              }
            }}
          />
        </div>
      )}

      {/* Shop Section */}
      <div style={{
        backgroundColor: "#ffffff",
        border: "3px solid #7e4ab8",
        borderRadius: "12px",
        padding: "20px"
      }}>
        <h2 style={{ 
          borderBottom: "2px solid #4c2a85",
          marginBottom: "20px",
          paddingBottom: "10px",
          color: "#2c1810"
        }}>
          🛒 Shop
        </h2>

        {shop.length === 0 ? (
          <p style={{ 
            textAlign: "center",
            color: "#666",
            fontStyle: "italic",
            padding: "40px"
          }}>
            No items available in shop
          </p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "15px"
          }}>
            {shop.map((entry) => (
              <div 
                key={entry._id} 
                style={{
                  backgroundColor: "#3a1f6b",
                  border: "2px solid #5d3494",
                  borderRadius: "8px",
                  padding: "15px",
                  color: "#e0e0e0",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => handleMouseEnter(e, entry)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#5d3494";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#3a1f6b";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px"
                }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#2c1810",
                    borderRadius: "8px",
                    marginRight: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundImage: entry.item.icon ? `url(/Icon/Item/${entry.item.icon}.png)` : "none",
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    border: "2px solid #7e4ab8"
                  }}>
                    {!entry.item.icon && "📦"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: "bold",
                      fontSize: "16px",
                      marginBottom: "4px"
                    }}>
                      {entry.item?.name || "Unknown Item"}
                    </div>
                    <div style={{ 
                      fontSize: "12px",
                      color: "#b89be6"
                    }}>
                      Stock: {entry.quantity}
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{
                    backgroundColor: "#ffa726",
                    color: "#2c1810",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    border: "1px solid #ff8f00"
                  }}>
                    {entry.price} Gold
                  </span>
                  <button 
                    onClick={() => handleBuy(entry.item._id)}
                    style={{
                      backgroundColor: "#4caf50",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontFamily: "Courier New, monospace",
                      fontWeight: "bold",
                      border: "2px solid #388e3c",
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = "#388e3c";
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = "#4caf50";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          color: "#e74c3c", 
          fontWeight: "bold",
          textAlign: "center",
          marginTop: "20px",
          backgroundColor: "#ffebee",
          padding: "10px",
          borderRadius: "6px",
          border: "2px solid #e57373"
        }}>
          {error}
        </div>
      )}

      {/* Tooltip */}
      {renderTooltip()}
    </div>
  );
}