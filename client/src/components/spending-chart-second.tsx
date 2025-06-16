import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense, Category } from "@shared/schema";

export function SpendingChartSecond() {
  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", "second-half"],
    queryFn: async () => {
      const response = await fetch("/api/expenses?period=second-half");
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const getCategoryByName = (categoryName: string) => {
    return categories?.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
  };

  const getChartData = () => {
    if (!expenses || !categories) return [];

    const categoryTotals = expenses
      .filter(expense => !expense.cleared)
      .reduce((acc, expense) => {
        const category = getCategoryByName(expense.category);
        if (!category) return acc;

        const amount = parseFloat(expense.amount);
        acc[category.name] = (acc[category.name] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .filter(([, amount]) => amount > 0)
      .map(([name, amount]) => {
        const category = getCategoryByName(name);
        return {
          name,
          value: amount,
          color: category?.color || '#94a3b8',
          icon: category?.icon || '📋'
        };
      })
      .sort((a, b) => b.value - a.value);
  };

  const chartData = getChartData();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Spending Breakdown
        </h3>
        
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        <div className="space-y-2">
          {chartData.slice(0, 4).map((item, index) => {
            const percentage = (item.value / totalAmount) * 100;
            return (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
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