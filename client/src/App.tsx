import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet } from "lucide-react";
import Budget from "@/pages/budget";
import BudgetSecond from "@/pages/budget-second";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Navigation */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-slate-900">Budget Tracker</h1>
              </div>
              
              {/* Navigation Tabs */}
              <Tabs value={location} className="w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="/" asChild>
                    <Link href="/">First Half (1-15)</Link>
                  </TabsTrigger>
                  <TabsTrigger value="/second-half" asChild>
                    <Link href="/second-half">Second Half (16-31)</Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="text-sm text-slate-500">
              Last updated: <span>Just now</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <AppLayout>
          <Budget />
        </AppLayout>
      </Route>
      <Route path="/second-half">
        <AppLayout>
          <BudgetSecond />
        </AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
