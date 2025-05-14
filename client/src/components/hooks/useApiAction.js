import { useState } from 'react';

/**
 * useApiAction
 * Abstract single API operation process：
 * - Automatically manage loading & error states
 * - Trigger refresh and prompt after execution
 *
 * @param {Function} actionFn - Specific API call function (args) => Promise
 * @param {Object} options
 * @param {Function} [options.onSuccess] - Callback after success (for example, display a prompt)
 * @param {Function} [options.onError] - Callback after failure (receive error information)
 * @param {Function} [options.refresh] - Function to refresh the list after the operation is completed
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
      const input = params[0]; //  Get the first parameter as input data
// Success prompt & refresh
      if (onSuccess) onSuccess(result, input); //  Transparent input
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

