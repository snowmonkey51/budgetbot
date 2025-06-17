import { CategoryManager } from "@/components/category-manager";
import { TemplateManager } from "@/components/template-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Tags, FileText } from "lucide-react";

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-6 w-6 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <p className="text-sm text-slate-600">
                Manage expense categories used across all budget periods
              </p>
            </CardHeader>
            <CardContent>
              <CategoryManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Management</CardTitle>
              <p className="text-sm text-slate-600">
                Create and manage expense templates for quick budget setup
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">First Half Templates</h3>
                  <TemplateManager period="first-half" />
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Second Half Templates</h3>
                  <TemplateManager period="second-half" />
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Planning Templates</h3>
                  <TemplateManager period="planning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}