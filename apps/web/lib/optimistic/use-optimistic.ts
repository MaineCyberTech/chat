import { useCallback, useRef, useState } from "react";

export function useOptimistic<T extends { id: string }>(initialItems: T[] = []) {
  const [items, setItems] = useState<T[]>(initialItems);
  const pendingRef = useRef<Map<string, { tempId: string; rollback: () => void }>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  // Apply optimistic update with rollback capability
  const applyOptimistic = useCallback((tempId: string, optimisticItem: T, rollback: () => void) => {
    setItems((prev) => [...prev, optimisticItem]);
    pendingRef.current.set(tempId, { tempId, rollback });
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(tempId);
      return next;
    });
  }, []);

  // Confirm optimistic update (replace temp ID with real ID)
  const confirmOptimistic = useCallback((tempId: string, realId: string, finalItem: T) => {
    pendingRef.current.delete(tempId);
    setItems((prev) =>
      prev.map((item) => (item.id === tempId ? { ...finalItem, id: realId } : item)),
    );
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(tempId);
      return next;
    });
  }, []);

  // Rollback an optimistic update
  const rollbackOptimistic = useCallback((tempId: string, errorMsg?: string) => {
    const entry = pendingRef.current.get(tempId);
    if (entry) {
      entry.rollback();
      pendingRef.current.delete(tempId);
    }
    if (errorMsg) {
      setErrors((prev) => {
        const next = new Map(prev);
        next.set(tempId, errorMsg);
        return next;
      });
    }
  }, []);

  // Replace temp ID with server ID on realtime echo (dedup)
  const deduplicateEcho = useCallback((serverId: string, tempId?: string) => {
    if (tempId && pendingRef.current.has(tempId)) {
      pendingRef.current.delete(tempId);
      setItems((prev) =>
        prev.map((item) => (item.id === tempId ? { ...item, id: serverId } : item)),
      );
      return true;
    }
    // If no temp ID, check if the server message is already in the list
    let exists = false;
    setItems((prev) => {
      const found = prev.some((item) => item.id === serverId);
      exists = found;
      return prev;
    });
    return exists;
  }, []);

  // Update an item in-place (for edits)
  const updateItem = useCallback((itemId: string, updates: Partial<T>) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  }, []);

  // Remove an item (for deletes)
  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // Clear all pending (on disconnect)
  const clearPending = useCallback(() => {
    pendingRef.current.clear();
  }, []);

  return {
    items,
    setItems,
    errors,
    pending: pendingRef.current,
    applyOptimistic,
    confirmOptimistic,
    rollbackOptimistic,
    deduplicateEcho,
    updateItem,
    removeItem,
    clearPending,
  };
}
