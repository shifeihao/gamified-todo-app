import { useState } from 'react';

/**
 * useApiAction
 * 抽象单次 API 操作流程：
 * - 自动管理 loading & error 状态
 * - 执行后触发刷新和提示
 *
 * @param {Function} actionFn - 具体的 API 调用函数 (args) => Promise
 * @param {Object} options
 * @param {Function} [options.onSuccess] - 成功后的回调 (例如显示提示)
 * @param {Function} [options.onError] - 失败后的回调 (接收错误信息)
 * @param {Function} [options.refresh] - 操作完成后刷新列表的函数
 * @returns {{execute: ((function(...[*]): Promise<*|undefined>)|*), loading: boolean, error: string}}
 */
export function useApiAction(actionFn, { onSuccess, onError, refresh } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const execute  = async (...params) => {
    setLoading(true);
    setError('');
    try {
      const result = await actionFn(...params);
      const input = params[0]; //  拿到第一个参数作为 input 数据
      // 成功提示 & 刷新
      if (onSuccess) onSuccess(result, input); //  透传 input
      if (refresh) await refresh();
      return result;
    } catch (err) {
      console.error(err);
      const msg = err.message || 'operation failed';
      setError(msg);
      if (onError) onError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}

