import { BalanceForm } from "@/components/balance-form";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { CategoryManager } from "@/components/category-manager";
import { Wallet } from "lucide-react";

export default function Budget() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Budget Tracker</h1>
            </div>
            <div className="text-sm text-slate-500">
              Last updated: <span>Just now</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-1 space-y-6">
            <BalanceForm />
            <ExpenseForm />
            <CategoryManager />
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2">
            <ExpenseList />
          </div>
        </div>
      </main>
    </div>
  );
}
