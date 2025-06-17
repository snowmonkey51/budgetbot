import { BalanceForm } from "@/components/balance-form";
import { ExpenseFormPlanning } from "@/components/expense-form-planning";
import { ExpenseListPlanning } from "@/components/expense-list-planning";
import { QuickTemplate } from "@/components/quick-template";
import { TemplateLoader } from "@/components/template-loader";
import { Wallet } from "lucide-react";

export default function BudgetPlanning() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Left Panel */}
      <div className="lg:col-span-1 space-y-6">
        <BalanceForm period="planning" />
        <ExpenseFormPlanning />
        <div className="flex gap-2">
          <QuickTemplate period="planning" />
          <TemplateLoader period="planning" />
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-2">
        <ExpenseListPlanning />
      </div>
    </div>
  );
}