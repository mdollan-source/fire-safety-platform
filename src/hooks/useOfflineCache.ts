'use client';

import { useState, useEffect, useCallback } from 'react';
import { cacheData, getCachedData, getCachedCollection } from '@/lib/offline/db';
import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineCache<T>(
  collection: string,
  documentId?: string,
  fetchFn?: () => Promise<T | T[]>
) {
  const [data, setData] = useState<T | T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const { isOnline } = useNetworkStatus();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isOnline && fetchFn) {
        // Online: fetch from network and update cache
        const freshData = await fetchFn();
        setData(freshData);
        setFromCache(false);

        // Cache the data
        if (documentId && !Array.isArray(freshData)) {
          await cacheData(collection, documentId, freshData);
        } else if (Array.isArray(freshData)) {
          // Cache each item in the array
          for (const item of freshData) {
            if ((item as any).id) {
              await cacheData(collection, (item as any).id, item);
            }
          }
        }
      } else {
        // Offline: load from cache
        let cachedData: any;
        if (documentId) {
          cachedData = await getCachedData(collection, documentId);
        } else {
          cachedData = await getCachedCollection(collection);
        }

        if (cachedData) {
          setData(cachedData);
          setFromCache(true);
        } else if (!isOnline) {
          throw new Error('No cached data available while offline');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [collection, documentId, fetchFn, isOnline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refetch = useCallback(() => {
    return loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    fromCache,
    refetch,
  };
}
