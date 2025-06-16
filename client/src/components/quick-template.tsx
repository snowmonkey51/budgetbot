import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface QuickTemplateProps {
  period: "first-half" | "second-half";
}

export function QuickTemplate({ period }: QuickTemplateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [expenses, setExpenses] = useState([
    { description: "", amount: "", category: "bills" }
  ]);
  const { toast } = useToast();

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
              category: expense.category
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
      setExpenses([{ description: "", amount: "", category: "bills" }]);
    }
  });

  const addExpense = () => {
    setExpenses([...expenses, { description: "", amount: "", category: "bills" }]);
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
          Quick Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
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
              <div key={index} className="flex gap-2">
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
                  className="w-20"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExpense(index)}
                  disabled={expenses.length === 1}
                >
                  ×
                </Button>
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