import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense, Category } from "@shared/schema";

export function SpendingChart() {
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const getCategoryByName = (categoryName: string) => {
    return categories?.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
  };

  const getChartData = () => {
    if (!expenses || !categories) return [];

    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = getCategoryByName(expense.category);
      if (!category) return acc;

      const amount = parseFloat(expense.amount);
      acc[category.name] = (acc[category.name] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, amount]) => {
      const category = getCategoryByName(name);
      return {
        name,
        value: amount,
        icon: category?.icon || '📋',
        color: category?.color || 'bg-gray-500',
        fill: getChartColor(category?.color || 'bg-gray-500')
      };
    }).sort((a, b) => b.value - a.value);
  };

  const getChartColor = (bgColor: string) => {
    const colorMap: Record<string, string> = {
      'bg-orange-100': '#fb923c',
      'bg-orange-500': '#f97316',
      'bg-blue-100': '#60a5fa',
      'bg-blue-500': '#3b82f6',
      'bg-green-100': '#4ade80',
      'bg-green-500': '#22c55e',
      'bg-purple-100': '#a78bfa',
      'bg-purple-500': '#8b5cf6',
      'bg-red-100': '#f87171',
      'bg-red-500': '#ef4444',
      'bg-pink-100': '#f472b6',
      'bg-pink-500': '#ec4899',
      'bg-gray-100': '#9ca3af',
      'bg-gray-500': '#6b7280',
      'bg-yellow-100': '#fbbf24',
      'bg-yellow-500': '#eab308',
      'bg-indigo-100': '#818cf8',
      'bg-indigo-500': '#6366f1',
      'bg-teal-100': '#2dd4bf',
      'bg-teal-500': '#14b8a6',
      'bg-cyan-100': '#22d3ee',
      'bg-cyan-500': '#06b6d4',
    };
    return colorMap[bgColor] || '#6b7280';
  };

  const chartData = getChartData();
  const totalSpending = chartData.reduce((sum, item) => sum + item.value, 0);

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Spending Breakdown</h3>
          <div className="text-center py-8">
            <p className="text-slate-500">No expenses to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Spending Breakdown</h3>
        
        {chartData.length > 0 && (
          <>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#1f2937' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(item.value)}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      {totalSpending > 0 ? Math.round((item.value / totalSpending) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Total Spending</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(totalSpending)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}