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
              .sort((a, b) => {
                // First sort by category
                const categoryCompare = a.category.localeCompare(b.category);
                if (categoryCompare !== 0) return categoryCompare;
                // Then sort by description within the same category
                return a.description.localeCompare(b.description);
              })
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
                      <div className={`w-10 h-10 ${getCategoryByName(expense.category)?.color || 'bg-gray-100'} rounded-lg flex items-center justify-center flex-shrink-0`} style={{ boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)' }}>
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

      {/* Spendable Balance Card */}
      <div className="rounded-xl shadow-lg relative overflow-hidden h-40">
        {/* Dynamic background based on spending ratio */}
        <div 
          className="absolute inset-0 transition-all duration-700 ease-in-out"
          style={{
            background: (() => {
              if (!balance) return 'linear-gradient(135deg, #059669, #047857, #065f46)';
              
              const currentBalance = parseFloat(balance.amount);
              const spentRatio = totalExpenses / currentBalance;
              
              if (spentRatio <= 0.3) {
                // Bright green when less than 30% spent
                return 'linear-gradient(135deg, #10b981, #059669, #047857)';
              } else if (spentRatio <= 0.5) {
                // Green-yellow when 30-50% spent
                return 'linear-gradient(135deg, #84cc16, #65a30d, #4d7c0f)';
              } else if (spentRatio <= 0.7) {
                // Yellow-orange when 50-70% spent  
                return 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)';
              } else if (spentRatio <= 0.85) {
                // Orange when 70-85% spent
                return 'linear-gradient(135deg, #f97316, #ea580c, #c2410c)';
              } else if (spentRatio <= 0.95) {
                // Red-orange when 85-95% spent
                return 'linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)';
              } else {
                // Bright red when over 95%
                return 'linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)';
              }
            })()
          }}
        />
        
        {/* Animated dots pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-8 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-12 left-16 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-20 left-6 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-8 right-12 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-16 right-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Spending percentage indicator */}
        <div className="absolute top-3 left-4">
          <div className="bg-black bg-opacity-30 rounded-lg px-2.5 py-1.5">
            <div className="text-white text-xl font-bold flex items-center gap-1">
              {balance ? Math.round((totalExpenses / parseFloat(balance.amount)) * 100) : 0}%
              {balance && (totalExpenses / parseFloat(balance.amount)) > 0.8 && (
                <svg className="w-4 h-4 text-yellow-300 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="text-white text-xs opacity-90">USED</div>
          </div>
        </div>
        
        <div className="absolute top-3 right-4 text-right z-10 max-w-48">
          <h3 className="text-xs font-medium text-white text-opacity-90 mb-1">Spendable Balance</h3>
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            {formatCurrency(spendableBalance)}
          </div>
          <p className="text-xs text-white text-opacity-90 mt-1 leading-tight">
            After {formatCurrency(totalExpenses)} in expenses
            {balance && (
              <span className="block text-xs mt-0.5 opacity-80">
                {formatCurrency(parseFloat(balance.amount) - totalExpenses)} remaining
              </span>
            )}
          </p>
        </div>
        
        {/* Glowing bottom edge */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
      </div>
    </div>
  );
}