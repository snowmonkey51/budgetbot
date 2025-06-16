import { BalanceForm } from "@/components/balance-form";
import { ExpenseFormFirst } from "@/components/expense-form-first";
import { ExpenseList } from "@/components/expense-list";
import { SpendingChartFirst } from "@/components/spending-chart-first";
import { TemplateManager } from "@/components/template-manager";
import { Wallet } from "lucide-react";

export default function Budget() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Left Panel */}
      <div className="lg:col-span-1 space-y-6">
        <BalanceForm />
        <ExpenseFormFirst />
        <SpendingChartFirst />
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-2">
        <ExpenseList />
      </div>
    </div>
  );
}
