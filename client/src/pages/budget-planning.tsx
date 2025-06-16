import { BalanceForm } from "@/components/balance-form";
import { ExpenseFormPlanning } from "@/components/expense-form-planning";
import { ExpenseListPlanning } from "@/components/expense-list-planning";
import { SpendingChartPlanning } from "@/components/spending-chart-planning";
import { QuickTemplate } from "@/components/quick-template";
import { TemplateLoader } from "@/components/template-loader";
import { CategoryManager } from "@/components/category-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PieChart, Receipt, TrendingUp, Calendar } from "lucide-react";

export default function BudgetPlanning() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Forms and Actions */}
      <div className="lg:col-span-1 space-y-6">
        {/* Balance Management */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Balance Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceForm />
          </CardContent>
        </Card>

        {/* Add Expense */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Add Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseFormPlanning />
          </CardContent>
        </Card>

        {/* Template Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Template Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickTemplate period="planning" />
            <TemplateLoader period="planning" />
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryManager />
          </CardContent>
        </Card>
      </div>

      {/* Middle Column - Expense List */}
      <div className="lg:col-span-1">
        <ExpenseListPlanning />
      </div>

      {/* Right Column - Analytics */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Spending Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChartPlanning />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}