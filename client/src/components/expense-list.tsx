import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Edit, Trash2, Check, X, Receipt, Calendar } from "lucide-react";
import type { Expense, Balance, Category } from "@shared/schema";

export function ExpenseList() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: balance } = useQuery<Balance | null>({
    queryKey: ["/api/balance"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Expense> }) => {
      const response = await apiRequest("PUT", `/api/expenses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingId(null);
      toast({
        title: "Expense Updated",
        description: "The expense has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setEditDescription(expense.description);
    setEditAmount(expense.amount);
    setEditCategory(expense.category);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDescription("");
    setEditAmount("");
    setEditCategory("");
  };

  const saveEdit = () => {
    if (!editDescription.trim() || !editAmount || !editCategory) {
      toast({
        title: "Invalid Data",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive",
      });
      return;
    }

    updateExpenseMutation.mutate({
      id: editingId!,
      data: {
        description: editDescription.trim(),
        amount: editAmount,
        category: editCategory,
      },
    });
  };

  const calculateTotalExpenses = () => {
    if (!expenses) return 0;
    return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  };

  const calculateSpendableBalance = () => {
    if (!balance || !expenses) return 0;
    const currentBalance = parseFloat(balance.amount);
    const totalExpenses = calculateTotalExpenses();
    return currentBalance - totalExpenses;
  };

  const getCategoryByName = (categoryName: string) => {
    return categories?.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalExpenses = calculateTotalExpenses();
  const spendableBalance = calculateSpendableBalance();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              1st-15th Expenses
            </h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-500">
                Total: <span className="font-medium text-slate-900">{formatCurrency(totalExpenses)}</span>
              </span>
            </div>
          </div>
        </CardContent>

        <div className="divide-y divide-slate-100">
          {expenses && expenses.length > 0 ? (
            expenses.map((expense) => (
              <div key={expense.id} className={`p-4 transition-colors ${getCategoryByName(expense.category)?.color || 'bg-gray-50'} hover:opacity-80`}</div>
                {editingId === expense.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${getCategoryByName(editCategory)?.color || 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                        <span className="text-lg">{getCategoryByName(editCategory)?.icon || '📋'}</span>
                      </div>
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center space-x-3 ml-13">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="pl-8 w-24"
                          placeholder="0.00"
                        />
                      </div>
                      <Select value={editCategory} onValueChange={setEditCategory}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories && categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name.toLowerCase()}>
                              <div className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={saveEdit}
                          disabled={updateExpenseMutation.isPending}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditing}
                          disabled={updateExpenseMutation.isPending}
                          className="text-slate-600 hover:text-slate-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${getCategoryByName(expense.category)?.color || 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                        <span className="text-lg">{getCategoryByName(expense.category)?.icon || '📋'}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{expense.description}</h3>
                        <p className="text-sm text-slate-500">{formatDate(expense.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-slate-900">-{formatCurrency(expense.amount)}</span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(expense)}
                          className="text-slate-400 hover:text-blue-600 p-1"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          disabled={deleteExpenseMutation.isPending}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No expenses yet</h3>
              <p className="text-slate-500">Start by adding your first expense using the form on the left.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Spendable Balance Card */}
      <div className="rounded-xl shadow-lg p-6 text-white bg-gradient-to-r from-green-600 to-green-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-opacity-90">Spendable Balance</h3>
          <div className="text-opacity-75">💰</div>
        </div>
        <div className="text-3xl font-bold">
          {formatCurrency(spendableBalance)}
        </div>
        <p className="text-sm text-opacity-90 mt-1">
          After {formatCurrency(totalExpenses)} in expenses
        </p>
      </div>
    </div>
  );
}
