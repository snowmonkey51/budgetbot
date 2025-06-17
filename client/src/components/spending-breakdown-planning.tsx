import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense, Category } from "@shared/schema";
import { useEffect } from "react";

export function SpendingBreakdownPlanning() {
  const queryClient = useQueryClient();

  // Force invalidate cache on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
  }, [queryClient]);

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", "planning", "chart"],
    queryFn: async () => {
      const response = await fetch("/api/expenses?period=planning");
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

    // Ensure we only get planning expenses that are not cleared
    const planningExpenses = expenses.filter(expense => 
      expense.period === 'planning' && !expense.cleared
    );

    const spendingByCategory = planningExpenses
      .reduce((acc, expense) => {
        const category = categories.find(cat => cat.name.toLowerCase() === expense.category.toLowerCase());
        const categoryName = category?.name || expense.category;
        const amount = parseFloat(expense.amount);
        
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            value: 0,
            color: category?.color || '#64748b',
            icon: category?.icon || '📊'
          };
        }
        acc[categoryName].value += amount;
        return acc;
      }, {} as Record<string, { name: string; value: number; color: string; icon: string }>);

    return Object.values(spendingByCategory).filter(item => item.value > 0);
  };

  const getChartColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'red': '#ef4444',
      'blue': '#3b82f6',
      'green': '#10b981',
      'yellow': '#f59e0b',
      'purple': '#8b5cf6',
      'pink': '#ec4899',
      'orange': '#f97316',
      'teal': '#14b8a6',
      'gray': '#6b7280',
      'indigo': '#6366f1'
    };
    return colorMap[color] || color;
  };

  const chartData = getChartData();

  if (expensesLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <PieChartIcon className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">Loading spending data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
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