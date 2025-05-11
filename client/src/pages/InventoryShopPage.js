// 📦 RPG风格前端页面组件：展示用户仓库与商店内容
// 文件：pages/InventoryShopPage.js
import React, { useEffect, useState } from 'react';
import {
  getUserInventory,
  getShopItems,
  buyItem
} from '../services/inventoryShopService';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

const categories = ['全部', '武器', '防具', '消耗品', '材料'];

export default function InventoryShopPage() {
  const [inventory, setInventory] = useState([]);
  const [shop, setShop] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [gold, setGold] = useState(null);
  const { showSuccess, showError } = useToast();

  const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
  const token = userInfo?.token || null;

  const categoryMap = {
    '全部': '',
    '武器': 'weapon',
    '防具': 'armor',
    '消耗品': 'consumable',
    '材料': 'material'
  };

  const filteredInventory = selectedCategory === '全部'
    ? inventory
    : inventory.filter(entry => entry.item.type === categoryMap[selectedCategory]);

  useEffect(() => {
    async function fetchData() {
      try {
        const shopData = await getShopItems(token);
        setShop(shopData);
        if (token) {
          const inv = await getUserInventory(token);
          setInventory(inv);

          const res = await axios.get('/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setGold(res.data.gold);
        }
      } catch (err) {
        setError(err.message);
        showError('获取商店数据失败');
      }
    }
    fetchData();
  }, [token]);

  const handleBuy = async (itemId) => {
    try {
      if (!token) {
        showError('请先登录');
        return;
      }
      await buyItem(itemId, token);
      const updatedInventory = await getUserInventory(token);
      setInventory(updatedInventory);
      const res = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGold(res.data.gold);
      showSuccess('购买成功！');
    } catch (err) {
      showError('购买失败: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Pixel, Arial', background: '#f2f2f2', minHeight: '100vh' }}>
      <h2 style={{ borderBottom: '2px solid #888' }}>🎒 用户背包 {gold !== null && <span style={{ float: 'right', fontSize: '16px', color: '#333' }}>💰 Gold: {gold}</span>}</h2>

      {/* 分类导航栏 */}
      <div style={{ marginBottom: '1rem' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              marginRight: '8px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: selectedCategory === cat ? '#333' : '#ddd',
              color: selectedCategory === cat ? 'white' : 'black',
              border: 'none',
              cursor: 'pointer'
            }}>
            {cat}
          </button>
        ))}
      </div>

      {!token ? (
        <p style={{ color: 'gray' }}>（未登录，无法查看）</p>
      ) : filteredInventory.length === 0 ? (
        <p>暂无物品</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '10px',
          background: '#e0e0e0',
          padding: '10px',
          borderRadius: '6px'
        }}>
          {filteredInventory.map(entry => (
            <div
              key={entry._id}
              title={`${entry.item.name}\n${entry.item.description}`}
              style={{
                width: '100px',
                height: '100px',
                backgroundImage: `url(/Icon/Item/${entry.item.icon}.png)` || '',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                border: '1px solid #aaa',
                borderRadius: '4px',
                position: 'relative'
              }}>
              <span style={{
                position: 'absolute',
                bottom: '2px',
                right: '4px',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                fontSize: '12px',
                padding: '2px 4px',
                borderRadius: '4px'
              }}>{entry.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: '3rem', borderBottom: '2px solid #888' }}>🛒 商店</h2>
      {shop.length === 0 ? <p>商店暂无商品</p> : (
        <div style={{
          border: '2px solid #888',
          borderRadius: '6px',
          backgroundColor: '#fff',
          padding: '1rem',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#eee' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>图标</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>物品名称</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>价格</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>库存</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {shop.map(entry => (
                <tr key={entry._id}>
                  <td style={{ padding: '8px' }}>
                    <img src={`/Icon/Item/${entry.item.icon}.png`} alt="icon" width="32" height="32" />
                  </td>
                  <td style={{ padding: '8px' }}>{entry.item?.name || '未知物品'}</td>
                  <td style={{ padding: '8px' }}>{entry.price}</td>
                  <td style={{ padding: '8px' }}>{entry.quantity}</td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => handleBuy(entry.item._id)}>购买</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
    </div>
  );
}
