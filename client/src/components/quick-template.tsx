import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

interface QuickTemplateProps {
  period: "first-half" | "second-half";
}

export function QuickTemplate({ period }: QuickTemplateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [expenses, setExpenses] = useState([
    { description: "", amount: "", category: "bills", notes: "" }
  ]);
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"]
  });

  const createAndLoadMutation = useMutation({
    mutationFn: async () => {
      // Create template
      const templateResponse = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: templateName, period })
      });
      const template = await templateResponse.json();

      // Add items to template
      for (const expense of expenses) {
        if (expense.description && expense.amount) {
          await fetch(`/api/templates/${template.id}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: expense.description,
              amount: expense.amount,
              category: expense.category,
              notes: expense.notes
            })
          });
        }
      }

      // Load template (create expenses)
      await fetch(`/api/templates/${template.id}/load`, {
        method: "POST"
      });

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template created and loaded successfully" });
      setIsDialogOpen(false);
      setTemplateName("");
      setExpenses([{ description: "", amount: "", category: "bills", notes: "" }]);
    }
  });

  const addExpense = () => {
    setExpenses([...expenses, { description: "", amount: "", category: "bills", notes: "" }]);
  };

  const updateExpense = (index: number, field: string, value: string) => {
    const newExpenses = [...expenses];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    setExpenses(newExpenses);
  };

  const removeExpense = (index: number) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <FileText className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create & Load Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Monthly Bills"
            />
          </div>

          <div className="space-y-3">
            <Label>Expenses</Label>
            {expenses.map((expense, index) => (
              <div key={index} className="space-y-2 p-3 border rounded-lg">
                <div className="flex gap-2">
                  <Input
                    placeholder="Description"
                    value={expense.description}
                    onChange={(e) => updateExpense(index, "description", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Amount"
                    value={expense.amount}
                    onChange={(e) => updateExpense(index, "amount", e.target.value)}
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExpense(index)}
                    disabled={expenses.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={expense.category}
                      onValueChange={(value) => updateExpense(index, "category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name.toLowerCase()}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  placeholder="Notes (optional)"
                  value={expense.notes}
                  onChange={(e) => updateExpense(index, "notes", e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addExpense}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Expense
            </Button>
          </div>

          <Button
            onClick={() => createAndLoadMutation.mutate()}
            disabled={!templateName || createAndLoadMutation.isPending}
            className="w-full"
          >
            Create & Load Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}