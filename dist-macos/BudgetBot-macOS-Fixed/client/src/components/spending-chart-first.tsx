import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense, Category } from "@shared/schema";
import { useEffect } from "react";

export function SpendingChartFirst() {
  const queryClient = useQueryClient();

  // Force invalidate cache on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
  }, [queryClient]);

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", "first-half", "chart"],
    queryFn: async () => {
      const response = await fetch("/api/expenses?period=first-half");
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const getCategoryByName = (categoryName: string) => {
    return categories?.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
  };

  const getChartData = () => {
    if (!expenses || !categories) return [];

    // Ensure we only get first-half expenses that are not cleared
    const firstHalfExpenses = expenses.filter(expense => 
      expense.period === 'first-half' && !expense.cleared
    );

    const spendingByCategory = firstHalfExpenses
      .reduce((acc, expense) => {
        const category = categories.find(cat => cat.name.toLowerCase() === expense.category.toLowerCase());
        const categoryName = category?.name || expense.category;
        const amount = parseFloat(expense.amount);
        
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            value: 0,
            color: category?.color || "#8884d8",
            icon: category?.icon || "📋"
          };
        }
        acc[categoryName].value += amount;
        return acc;
      }, {} as Record<string, { name: string; value: number; color: string; icon: string }>);

    return Object.values(spendingByCategory)
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const chartData = getChartData();

  // Color mapping for consistent chart colors
  const getChartColor = (categoryColor: string) => {
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
  };

  if (expensesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PieChartIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-900 mb-1">No spending data</h3>
          <p className="text-xs text-slate-500">Add some expenses to see your spending breakdown</p>
        </CardContent>
      </Card>
    );
  }

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Spending Breakdown
          </h3>
          <span className="text-sm text-slate-600">
            Total: <span className="font-medium text-slate-900">{formatCurrency(totalAmount)}</span>
          </span>
        </div>
        
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getChartColor(entry.color)} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                labelStyle={{ color: '#1f2937' }}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1">
          {chartData.slice(0, 4).map((item, index) => {
            const percentage = (item.value / totalAmount) * 100;
            return (
              <div key={item.name} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getChartColor(item.color) }}
                  />
                  <span className="text-slate-600">{item.icon} {item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-slate-900">{formatCurrency(item.value)}</span>
                  <span className="text-slate-500 ml-1">({percentage.toFixed(0)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}