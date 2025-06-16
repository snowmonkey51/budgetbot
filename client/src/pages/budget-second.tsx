import { BalanceForm } from "@/components/balance-form";
import { ExpenseFormSecond } from "@/components/expense-form-second";
import { ExpenseListSecond } from "@/components/expense-list-second";
import { SpendingChartSecond } from "@/components/spending-chart-second";
import { Wallet } from "lucide-react";

export default function BudgetSecond() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Left Panel */}
      <div className="lg:col-span-1 space-y-6">
        <BalanceForm />
        <ExpenseFormSecond />
        <SpendingChartSecond />
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-2">
        <ExpenseListSecond />
      </div>
    </div>
  );
}