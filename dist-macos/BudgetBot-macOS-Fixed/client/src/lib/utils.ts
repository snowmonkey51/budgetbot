import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 5) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export const categoryIcons: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  shopping: '🛒',
  bills: '💳',
  entertainment: '🎬',
  health: '🏥',
  other: '📋',
};

export const categoryColors: Record<string, string> = {
  food: 'bg-orange-500',
  transport: 'bg-blue-500',
  shopping: 'bg-green-500',
  bills: 'bg-purple-500',
  entertainment: 'bg-red-500',
  health: 'bg-pink-500',
  other: 'bg-gray-500',
};

export const categoryBackgroundColors: Record<string, string> = {
  food: 'bg-orange-50 hover:bg-orange-100',
  transport: 'bg-blue-50 hover:bg-blue-100',
  shopping: 'bg-green-50 hover:bg-green-100',
  bills: 'bg-purple-50 hover:bg-purple-100',
  entertainment: 'bg-red-50 hover:bg-red-100',
  health: 'bg-pink-50 hover:bg-pink-100',
  other: 'bg-gray-50 hover:bg-gray-100',
};

export function getCategoryColor(categoryColor: string): string {
  const colorMap: Record<string, string> = {
    'bg-orange-100': '#fed7aa',
    'bg-orange-500': '#f97316',
    'bg-blue-100': '#dbeafe',
    'bg-blue-500': '#3b82f6',
    'bg-green-100': '#dcfce7',
    'bg-green-500': '#22c55e',
    'bg-purple-100': '#e9d5ff',
    'bg-purple-500': '#a855f7',
    'bg-red-100': '#fee2e2',
    'bg-red-500': '#ef4444',
    'bg-pink-100': '#fce7f3',
    'bg-pink-500': '#ec4899',
    'bg-gray-100': '#f3f4f6',
    'bg-gray-500': '#6b7280',
    'bg-yellow-100': '#fef3c7',
    'bg-yellow-500': '#eab308',
    'bg-indigo-100': '#e0e7ff',
    'bg-indigo-500': '#6366f1',
    'bg-teal-100': '#ccfbf1',
    'bg-teal-500': '#14b8a6',
  };
  return colorMap[categoryColor] || '#8884d8';
}
