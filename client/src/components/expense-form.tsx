import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CategoryManager } from "./category-manager";
import { Plus, Settings, ChevronDown, ChevronUp } from "lucide-react";
import type { InsertExpense, Category } from "@shared/schema";

export function ExpenseForm() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expense: InsertExpense) => {
      const response = await apiRequest("POST", "/api/expenses", expense);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDescription("");
      setAmount("");
      setCategory("");
      setNotes("");
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
      notes: notes.trim() || null,
    });
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
            >
              <h2 className="text-lg font-semibold text-slate-900">Add New Expense</h2>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 px-6 pb-6">
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

          <div className="grid grid-cols-2 gap-4">
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
                  className="pl-8 h-10"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="expense-category" className="text-sm font-medium text-slate-700">
                  Category
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600 p-1 h-6 w-6">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Manage Categories</DialogTitle>
                    </DialogHeader>
                    <CategoryManager />
                  </DialogContent>
                </Dialog>
              </div>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select..." />
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

            <div>
              <Label htmlFor="expense-notes" className="text-sm font-medium text-slate-700">
                Notes (optional)
              </Label>
              <Textarea
                id="expense-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 h-20"
                placeholder="Add any additional notes..."
              />
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
