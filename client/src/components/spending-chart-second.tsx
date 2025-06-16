import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PieChart, TrendingUp } from "lucide-react";
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

  if (expensesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Spending Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Spending Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No expenses to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group expenses by category and calculate totals (only non-cleared expenses)
  const categoryTotals = expenses
    .filter(expense => !expense.cleared)
    .reduce((acc, expense) => {
      const category = expense.category;
      const amount = parseFloat(expense.amount);
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

  // Sort categories by spending amount
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6); // Show top 6 categories

  const totalSpending = sortedCategories.reduce((sum, [, amount]) => sum + amount, 0);

  if (totalSpending === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Spending Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">All expenses are cleared</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Spending Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedCategories.map(([categoryName, amount]) => {
          const category = getCategoryByName(categoryName);
          const percentage = (amount / totalSpending) * 100;
          
          return (
            <div key={categoryName} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category?.icon || '📋'}</span>
                  <span className="font-medium text-slate-700">{categoryName}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-900">{formatCurrency(amount)}</span>
                  <span className="text-xs text-slate-500 ml-1">({percentage.toFixed(0)}%)</span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${category?.color?.replace('100', '500') || 'bg-gray-500'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        
        {sortedCategories.length > 0 && (
          <div className="pt-3 mt-4 border-t border-slate-200">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-700">Total Spending</span>
              <span className="text-slate-900">{formatCurrency(totalSpending)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}