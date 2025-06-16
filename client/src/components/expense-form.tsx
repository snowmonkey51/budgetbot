import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { categoryIcons } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { InsertExpense } from "@shared/schema";

export function ExpenseForm() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createExpenseMutation = useMutation({
    mutationFn: async (expense: InsertExpense) => {
      const response = await apiRequest("POST", "/api/expenses", expense);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setDescription("");
      setAmount("");
      setCategory("");
      toast({
        title: "Expense Added",
        description: "Your expense has been successfully added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (!description.trim()) {
      toast({
        title: "Missing Description",
        description: "Please enter a description for the expense.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Missing Category",
        description: "Please select a category for the expense.",
        variant: "destructive",
      });
      return;
    }

    createExpenseMutation.mutate({
      description: description.trim(),
      amount: amount,
      category,
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Add New Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="expense-description" className="text-sm font-medium text-slate-700">
              Description
            </Label>
            <Input
              id="expense-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
              placeholder="e.g., Grocery shopping"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expense-amount" className="text-sm font-medium text-slate-700">
                Amount
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  $
                </span>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expense-category" className="text-sm font-medium text-slate-700">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">{categoryIcons.food} Food</SelectItem>
                  <SelectItem value="transport">{categoryIcons.transport} Transport</SelectItem>
                  <SelectItem value="shopping">{categoryIcons.shopping} Shopping</SelectItem>
                  <SelectItem value="bills">{categoryIcons.bills} Bills</SelectItem>
                  <SelectItem value="entertainment">{categoryIcons.entertainment} Entertainment</SelectItem>
                  <SelectItem value="health">{categoryIcons.health} Health</SelectItem>
                  <SelectItem value="other">{categoryIcons.other} Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={createExpenseMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
