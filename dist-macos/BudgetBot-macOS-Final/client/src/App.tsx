import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Settings } from "lucide-react";
import { useState } from "react";
import { Calculator } from "@/components/calculator";
import Budget from "@/pages/budget";
import BudgetSecond from "@/pages/budget-second";
import BudgetPlanning from "@/pages/budget-planning";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
// Robot icon for macOS distribution - no external assets needed

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-50 to-slate-100 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-lg">
                  🤖
                </div>
                <h1 className="text-xl font-bold text-slate-700 tracking-widest uppercase relative transform hover:scale-105 transition-transform duration-300">
                  BudgetBot
                </h1>
              </div>
              
              {/* Navigation Tabs */}
              <Tabs value={location} className="w-auto">
                <TabsList className="grid w-full grid-cols-4 h-10 p-1 bg-slate-100 rounded-lg">
                  <TabsTrigger 
                    value="/" 
                    asChild
                    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all duration-200 text-sm font-medium rounded-md h-8 px-2"
                  >
                    <Link href="/" className="flex items-center justify-center h-full w-full">First Half (1-15)</Link>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="/second-half" 
                    asChild
                    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all duration-200 text-sm font-medium rounded-md h-8 px-2"
                  >
                    <Link href="/second-half" className="flex items-center justify-center h-full w-full">Second Half (16-31)</Link>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="/planning" 
                    asChild
                    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all duration-200 text-sm font-medium rounded-md h-8 px-2"
                  >
                    <Link href="/planning" className="flex items-center justify-center h-full w-full">Planning</Link>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="/settings" 
                    asChild
                    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all duration-200 text-sm font-medium rounded-md h-8 px-2"
                  >
                    <Link href="/settings" className="flex items-center justify-center h-full w-full gap-1">
                      <Settings className="h-3 w-3" />
                      Settings
                    </Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-500">
                Last updated: <span>Just now</span>
              </div>
              <button
                onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md"
                title="Calculator"
              >
                <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Calculator Component */}
      <Calculator 
        isOpen={isCalculatorOpen} 
        onToggle={() => setIsCalculatorOpen(!isCalculatorOpen)} 
      />
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
      <Route path="/planning">
        <AppLayout>
          <BudgetPlanning />
        </AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout>
          <SettingsPage />
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
