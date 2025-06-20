import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import type { Expense, Balance, Category } from "@shared/schema";

export function SpendingChartPlanning() {
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", "planning"],
    queryFn: async () => {
      const response = await fetch("/api/expenses?period=planning");
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    }
  });

  const { data: balance } = useQuery<Balance | null>({
    queryKey: ["/api/balance"]
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"]
  });

  // Calculate spending by category
  const spendingByCategory = expenses.reduce((acc, expense) => {
    if (expense.cleared) return acc;
    
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

  const chartData = Object.values(spendingByCategory);
  const totalSpent = chartData.reduce((sum, item) => sum + item.value, 0);
  const currentBalance = balance ? parseFloat(balance.amount) : 0;
  const spendableBalance = currentBalance - totalSpent;
  const spendingPercentage = currentBalance > 0 ? (totalSpent / currentBalance) * 100 : 0;

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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{data.icon}</span>
            <span className="font-medium">{data.name}</span>
          </div>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-semibold">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-semibold">{((data.value / totalSpent) * 100).toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Spending Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PieChartIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No spending data</h3>
            <p className="text-slate-500 text-sm">Add some planning expenses to see your spending breakdown.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Spending Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pie Chart */}
          <div className="h-64">
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
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getChartColor(entry.color)}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>


        </div>
      </CardContent>
    </Card>
  );
}