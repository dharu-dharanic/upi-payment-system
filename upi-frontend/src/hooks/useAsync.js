import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils';

// Generic async hook with loading/error handling
export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const execute = useCallback(async (asyncFn, { successMsg, onSuccess } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      if (successMsg) toast.success(successMsg);
      if (onSuccess)  onSuccess(result);
      return result;
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
      // throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
}

// Paginated list hook
export function usePagination(fetchFn) {
  const [data, setData]       = useState([]);
  const [page, setPage]       = useState(0);
  const [totalPages, setTotal]= useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await fetchFn(p);
      const result = res.data.data;
      setData(result.content || []);
      setTotal(result.totalPages || 0);
      setPage(p);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  return { data, page, totalPages, loading, load, setPage };
}
