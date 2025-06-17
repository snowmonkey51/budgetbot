import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Edit } from "lucide-react";
import type { Balance } from "@shared/schema";

export function BalanceForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balance, isLoading } = useQuery<Balance | null>({
    queryKey: ["/api/balance"],
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest("PUT", "/api/balance", { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setIsEditing(false);
      toast({
        title: "Balance Updated",
        description: "Your balance has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update balance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      });
      return;
    }
    updateBalanceMutation.mutate(amount);
  };

  const startEditing = () => {
    setAmount(balance?.amount || "0");
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-700 border-blue-600 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Current Balance</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={startEditing}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="balance-amount" className="text-sm font-medium text-white">
                Available Balance
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 text-lg font-medium">
                  $
                </span>
                <Input
                  id="balance-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 text-2xl font-semibold bg-white/90 text-slate-900"
                  placeholder="0.00"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-sm font-medium rounded-lg"
                disabled={updateBalanceMutation.isPending}
              >
                {updateBalanceMutation.isPending ? "Updating..." : "Update Balance"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={updateBalanceMutation.isPending}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-sm font-medium rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {balance ? formatCurrency(balance.amount) : "$0.00"}
            </div>
            <p className="text-sm text-white/70">
              Last updated: {balance ? new Date(balance.updatedAt).toLocaleString() : "Never"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
