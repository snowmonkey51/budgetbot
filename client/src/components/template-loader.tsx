import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Template, TemplateItem } from "@shared/schema";

interface TemplateLoaderProps {
  period: "first-half" | "second-half";
  onTemplateLoaded?: () => void;
}

export function TemplateLoader({ period, onTemplateLoaded }: TemplateLoaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/templates", period],
    queryFn: async () => {
      const response = await fetch(`/api/templates?period=${period}`);
      return response.json();
    }
  });

  const loadTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/templates/${templateId}/load`, {
        method: "POST",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Template loaded successfully" });
      setIsDialogOpen(false);
      onTemplateLoaded?.();
    }
  });

  if (isLoading || templates.length === 0) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <FileText className="w-4 h-4 mr-2" />
          Load Template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Load Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {templates.map((template: Template & { items: TemplateItem[] }) => (
            <div key={template.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{template.name}</h4>
                <Button
                  size="sm"
                  onClick={() => loadTemplateMutation.mutate(template.id)}
                  disabled={loadTemplateMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Load
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                {template.items.length} items - Total: $
                {template.items.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)}
              </div>
              <div className="mt-2 space-y-1">
                {template.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-xs text-gray-500">
                    • {item.description} - ${item.amount}
                  </div>
                ))}
                {template.items.length > 3 && (
                  <div className="text-xs text-gray-400">
                    ... and {template.items.length - 3} more items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}