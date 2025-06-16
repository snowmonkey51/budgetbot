import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Edit, Trash2, Check, X, Receipt, Calendar, Eraser } from "lucide-react";
import type { Expense, Balance, Category } from "@shared/schema";

export function ExpenseListPlanning() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", "planning"],
    queryFn: async () => {
      const response = await fetch("/api/expenses?period=planning");
      if (!response.ok) throw new Error("Failed to fetch expenses");
      return response.json();
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", "planning"] });
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
      const response = await apiRequest("DELETE", `/api/expenses/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", "planning"] });
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

  const toggleClearedMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PATCH", `/api/expenses/${id}/toggle-cleared`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", "planning"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update expense status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      if (!expenses || expenses.length === 0) return;
      
      // Delete all expenses for this period
      await Promise.all(
        expenses.map(expense => 
          apiRequest("DELETE", `/api/expenses/${expense.id}`)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", "planning"] });
      toast({
        title: "Success",
        description: "All expenses have been cleared.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear expenses. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setEditDescription(expense.description);
    setEditAmount(expense.amount);
    setEditCategory(expense.category);
    setEditNotes(expense.notes || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDescription("");
    setEditAmount("");
    setEditCategory("");
    setEditNotes("");
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
        notes: editNotes.trim() || null,
      },
    });
  };

  const calculateTotalExpenses = () => {
    if (!expenses) return 0;
    return expenses
      .filter(expense => !expense.cleared)
      .reduce((total, expense) => total + parseFloat(expense.amount), 0);
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

  const getCategoryBackgroundColor = (categoryName: string) => {
    const category = getCategoryByName(categoryName);
    
    if (!category?.color) {
      return 'bg-gray-50 hover:bg-gray-100';
    }
    
    // Map the category colors to predefined background colors
    const colorMap: Record<string, string> = {
      'bg-orange-100': 'bg-orange-50 hover:bg-orange-100',
      'bg-orange-500': 'bg-orange-50 hover:bg-orange-100',
      'bg-blue-100': 'bg-blue-50 hover:bg-blue-100',
      'bg-blue-500': 'bg-blue-50 hover:bg-blue-100',
      'bg-green-100': 'bg-green-50 hover:bg-green-100',
      'bg-green-500': 'bg-green-50 hover:bg-green-100',
      'bg-purple-100': 'bg-purple-50 hover:bg-purple-100',
      'bg-purple-500': 'bg-purple-50 hover:bg-purple-100',
      'bg-red-100': 'bg-red-50 hover:bg-red-100',
      'bg-red-500': 'bg-red-50 hover:bg-red-100',
      'bg-pink-100': 'bg-pink-50 hover:bg-pink-100',
      'bg-pink-500': 'bg-pink-50 hover:bg-pink-100',
      'bg-gray-100': 'bg-gray-50 hover:bg-gray-100',
      'bg-gray-500': 'bg-gray-50 hover:bg-gray-100',
      'bg-yellow-100': 'bg-yellow-50 hover:bg-yellow-100',
      'bg-yellow-500': 'bg-yellow-50 hover:bg-yellow-100',
      'bg-indigo-100': 'bg-indigo-50 hover:bg-indigo-100',
      'bg-indigo-500': 'bg-indigo-50 hover:bg-indigo-100',
      'bg-teal-100': 'bg-teal-50 hover:bg-teal-100',
      'bg-teal-500': 'bg-teal-50 hover:bg-teal-100',
      'bg-cyan-100': 'bg-cyan-50 hover:bg-cyan-100',
      'bg-cyan-500': 'bg-cyan-50 hover:bg-cyan-100',
      'bg-emerald-100': 'bg-emerald-50 hover:bg-emerald-100',
      'bg-emerald-500': 'bg-emerald-50 hover:bg-emerald-100',
      'bg-lime-100': 'bg-lime-50 hover:bg-lime-100',
      'bg-lime-500': 'bg-lime-50 hover:bg-lime-100',
      'bg-amber-100': 'bg-amber-50 hover:bg-amber-100',
      'bg-amber-500': 'bg-amber-50 hover:bg-amber-100',
      'bg-rose-100': 'bg-rose-50 hover:bg-rose-100',
      'bg-rose-500': 'bg-rose-50 hover:bg-rose-100',
      'bg-violet-100': 'bg-violet-50 hover:bg-violet-100',
      'bg-violet-500': 'bg-violet-50 hover:bg-violet-100',
      'bg-fuchsia-100': 'bg-fuchsia-50 hover:bg-fuchsia-100',
      'bg-fuchsia-500': 'bg-fuchsia-50 hover:bg-fuchsia-100',
      'bg-sky-100': 'bg-sky-50 hover:bg-sky-100',
      'bg-sky-500': 'bg-sky-50 hover:bg-sky-100',
      'bg-slate-100': 'bg-slate-50 hover:bg-slate-100',
      'bg-slate-500': 'bg-slate-50 hover:bg-slate-100',
    };
    
    return colorMap[category.color] || 'bg-gray-50 hover:bg-gray-100';
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
              Planning Expenses
            </h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-500">
                Total: <span className="font-medium text-slate-900">{formatCurrency(totalExpenses)}</span>
              </span>
              {expenses && expenses.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={clearAllMutation.isPending}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Eraser className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all planning expenses. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => clearAllMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete All Expenses
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>

        <div className="divide-y divide-slate-100">
          {expenses && expenses.length > 0 ? (
            expenses
              .sort((a, b) => a.category.localeCompare(b.category))
              .map((expense) => (
              <div key={expense.id} className={`p-4 transition-colors ${getCategoryBackgroundColor(expense.category)} ${expense.cleared ? 'opacity-50' : ''}`}>
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
                    </div>
                    <div className="ml-13">
                      <Textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Notes (optional)"
                        className="h-16 text-sm"
                      />
                    </div>
                    <div className="ml-13">
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={saveEdit}
                          disabled={updateExpenseMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 ${getCategoryByName(expense.category)?.color || 'bg-gray-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <span className="text-lg">{getCategoryByName(expense.category)?.icon || '📋'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{expense.description}</p>
                            <div className="flex items-center space-x-2 text-xs text-slate-500">
                              <span className="capitalize">{expense.category}</span>
                              <span>•</span>
                              <span>{formatDate(expense.createdAt)}</span>
                              {expense.notes && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{expense.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-semibold text-slate-900">{formatCurrency(parseFloat(expense.amount))}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        checked={Boolean(expense.cleared)}
                        onCheckedChange={() => toggleClearedMutation.mutate(expense.id)}
                        disabled={toggleClearedMutation.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExpenseMutation.mutate(expense.id)}
                        disabled={deleteExpenseMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No expenses yet</h3>
              <p className="text-slate-500">Start by adding your first planning expense.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}