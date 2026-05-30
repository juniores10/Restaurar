import { useState, useCallback } from 'react';

const STORAGE_KEY = 'dashboard-card-order';

const DEFAULT_ORDER = [
  'system-overview',
  'production-alerts',
  'absenteeism-alerts',
  'employee-status',
  'maintenance-stats',
  'absenteeism-metrics',
  'birthdays',
  'vacations',
];

export function useDashboardOrder() {
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const merged = [...parsed];
          DEFAULT_ORDER.forEach(id => {
            if (!merged.includes(id)) merged.push(id);
          });
          return merged.filter(id => DEFAULT_ORDER.includes(id));
        }
      }
    } catch {
      // ignore
    }
    return [...DEFAULT_ORDER];
  });

  const moveCard = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setOrder(prev => {
      const newOrder = [...prev];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
      return newOrder;
    });
  }, []);

  const isCustomOrder = order.some((id, i) => id !== DEFAULT_ORDER[i]);

  const resetOrder = useCallback(() => {
    const defaultCopy = [...DEFAULT_ORDER];
    setOrder(defaultCopy);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCopy));
  }, []);

  return { order, moveCard, resetOrder, isCustomOrder };
}
