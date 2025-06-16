import { BalanceForm } from "@/components/balance-form";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseListSecond } from "@/components/expense-list-second";
import { SpendingChart } from "@/components/spending-chart";
import { Wallet } from "lucide-react";

export default function BudgetSecond() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Left Panel */}
      <div className="lg:col-span-1 space-y-6">
        <BalanceForm />
        <ExpenseForm />
        <SpendingChart />
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-2">
        <ExpenseListSecond />
      </div>
    </div>
  );
}