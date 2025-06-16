import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, Edit, Trash2, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Template, TemplateItem, Category } from "@shared/schema";

interface TemplateLoaderProps {
  period: "first-half" | "second-half";
  onTemplateLoaded?: () => void;
}

export function TemplateLoader({ period, onTemplateLoaded }: TemplateLoaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<(Template & { items: TemplateItem[] }) | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedItems, setEditedItems] = useState<TemplateItem[]>([]);
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/templates", period],
    queryFn: async () => {
      const response = await fetch(`/api/templates?period=${period}`);
      return response.json();
    }
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"]
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

  const updateTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!editingTemplate) return;
      
      // Update template name
      await fetch(`/api/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedName })
      });

      // Update all template items
      for (const item of editedItems) {
        if (item.id) {
          await fetch(`/api/template-items/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: item.description,
              amount: item.amount,
              category: item.category,
              notes: item.notes
            })
          });
        } else {
          // New item
          await fetch(`/api/templates/${editingTemplate.id}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: item.description,
              amount: item.amount,
              category: item.category,
              notes: item.notes
            })
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template updated successfully" });
      setEditingTemplate(null);
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template deleted successfully" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await fetch(`/api/template-items/${itemId}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template item deleted successfully" });
    }
  });

  const startEditingTemplate = (template: Template & { items: TemplateItem[] }) => {
    setEditingTemplate(template);
    setEditedName(template.name);
    setEditedItems([...template.items]);
  };

  const updateEditedItem = (index: number, field: keyof TemplateItem, value: string) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedItems(newItems);
  };

  const addEditedItem = () => {
    setEditedItems([
      ...editedItems,
      {
        id: 0, // Temporary ID for new items
        templateId: editingTemplate?.id || 0,
        description: "",
        amount: "",
        category: "bills",
        notes: null
      }
    ]);
  };

  const removeEditedItem = async (index: number) => {
    const item = editedItems[index];
    if (item.id && item.id > 0) {
      // Delete from database if it exists
      await deleteItemMutation.mutateAsync(item.id);
    }
    // Remove from local state
    const newItems = editedItems.filter((_, i) => i !== index);
    setEditedItems(newItems);
  };

  if (isLoading || templates.length === 0) {
    return null;
  }

  return (
    <>
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditingTemplate(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => loadTemplateMutation.mutate(template.id)}
                      disabled={loadTemplateMutation.isPending}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Load
                    </Button>
                  </div>
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

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Template name"
                />
              </div>

              <div className="space-y-3">
                <Label>Template Items</Label>
                {editedItems.map((item, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateEditedItem(index, "description", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => updateEditedItem(index, "amount", e.target.value)}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEditedItem(index)}
                        disabled={editedItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value={item.category}
                          onValueChange={(value) => updateEditedItem(index, "category", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name.toLowerCase()}>
                                {category.icon} {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Notes (optional)"
                      value={item.notes || ""}
                      onChange={(e) => updateEditedItem(index, "notes", e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addEditedItem}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => updateTemplateMutation.mutate()}
                  disabled={!editedName || updateTemplateMutation.isPending}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingTemplate(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}