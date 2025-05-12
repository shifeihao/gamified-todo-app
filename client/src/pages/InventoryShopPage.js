//📦 RPG风格前端页面组件：展示用户仓库与商店内容
// 文件：pages/InventoryShopPage.js
import React, { useEffect, useState } from "react";
import BackpackPanel from "../components/game/BackpackPanel";
import EquipmentPanel from "../components/game/EquipmentPanel";
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

const categories = ["全部", "武器", "防具", "消耗品", "材料"];

export default function InventoryShopPage() {
  const [inventory, setInventory] = useState([]);
  const [shop, setShop] = useState([]);
  const [equipment, setEquipment] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [gold, setGold] = useState(null);
  const { showSuccess, showError } = useToast();

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;
  const token = userInfo?.token || null;

  const categoryMap = {
    全部: "",
    武器: "weapon",
    防具: "armor",
    消耗品: "consumable",
    材料: "material",
  };

  const fetchData = async () => {
    try {
      const shopData = await getShopItems(token);
      setShop(shopData);
      const equipData = await getUserEquipment(token);
      console.log("🛡️ 当前装备数据：", equipData);
      setEquipment(equipData);
 

      if (token) {
        const inv = await getUserInventory(token);
        console.log("🎒 当前背包物品：", inv);
        setInventory(inv);

        const res = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGold(res.data.gold);
      }
    } catch (err) {
      setError(err.message);
      showError("获取商店数据失败");
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleBuy = async (itemId) => {
    try {
      if (!token) {
        showError("请先登录");
        return;
      }
      await buyItem(itemId, token);
      fetchData();
      showSuccess("购买成功！");
    } catch (err) {
      showError("购买失败: " + err.message);
    }
  };

  const handleEquip = async (inventoryItemId) => {
    try {
      await equipItem(inventoryItemId, token);
      fetchData();
      showSuccess("装备成功");
    } catch (err) {
      console.error("❌ 装备失败：", err);
      showError("装备失败: " + err.message);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "Pixel, Arial",
        background: "#f2f2f2",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ borderBottom: "2px solid #888" }}>
        🎒 用户背包
        {gold !== null && (
          <span style={{ float: "right", fontSize: "16px", color: "#333" }}>
            💰 Gold: {gold}
          </span>
        )}
      </h2>

      {/* 分类导航栏 */}
      <div style={{ marginBottom: "1rem" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              marginRight: "8px",
              padding: "6px 12px",
              borderRadius: "4px",
              backgroundColor: selectedCategory === cat ? "#333" : "#ddd",
              color: selectedCategory === cat ? "white" : "black",
              border: "none",
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 使用 BackpackPanel 渲染背包物品 */}
      {token && (
        <BackpackPanel
          inventory={inventory}
          selectedCategory={selectedCategory}
          onEquip={handleEquip}
        />
      )}

      {token && equipment && (
        <EquipmentPanel
          equipment={equipment}
          onRightClick={async (slot, item) => {
            try {
              await unequipItem(slot, token);
              showSuccess(`已卸下 ${item.item?.name}`);
              fetchData();
            } catch (err) {
              console.error("❌ 卸下失败", err);
              showError("卸下失败: " + err.message);
            }
          }}
        />
      )}

      <h2 style={{ marginTop: "3rem", borderBottom: "2px solid #888" }}>
        🛒 商店
      </h2>
      {shop.length === 0 ? (
        <p>商店暂无商品</p>
      ) : (
        <div
          style={{
            border: "2px solid #888",
            borderRadius: "6px",
            backgroundColor: "#fff",
            padding: "1rem",
            boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eee" }}>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  图标
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  物品名称
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  价格
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  库存
                </th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ccc" }}>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {shop.map((entry) => (
                <tr key={entry._id}>
                  <td style={{ padding: "8px" }}>
                    <img
                      src={`/Icon/Item/${entry.item.icon}.png`}
                      alt="icon"
                      width="32"
                      height="32"
                    />
                  </td>
                  <td style={{ padding: "8px" }}>
                    {entry.item?.name || "未知物品"}
                  </td>
                  <td style={{ padding: "8px" }}>{entry.price}</td>
                  <td style={{ padding: "8px" }}>{entry.quantity}</td>
                  <td style={{ padding: "8px" }}>
                    <button onClick={() => handleBuy(entry.item._id)}>
                      购买
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
    </div>
  );
}
