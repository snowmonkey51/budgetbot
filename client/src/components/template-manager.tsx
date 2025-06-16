import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Template, TemplateItem, InsertTemplate, InsertTemplateItem, Category } from "@shared/schema";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  period: z.enum(["first-half", "second-half"])
});

const templateItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().optional()
});

interface TemplateManagerProps {
  period: "first-half" | "second-half";
  onTemplateLoaded?: () => void;
}

export function TemplateManager({ period, onTemplateLoaded }: TemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<(Template & { items: TemplateItem[] }) | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null);
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

  const createTemplateMutation = useMutation({
    mutationFn: async (template: InsertTemplate) => {
      return apiRequest("/api/templates", "POST", template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Template created successfully" });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...template }: { id: number } & Partial<InsertTemplate>) => {
      return apiRequest(`/api/templates/${id}`, "PUT", template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      toast({ title: "Template updated successfully" });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/templates/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template deleted successfully" });
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ templateId, ...item }: { templateId: number } & InsertTemplateItem) => {
      return apiRequest(`/api/templates/${templateId}/items`, "POST", item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsItemDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Template item added successfully" });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...item }: { id: number } & Partial<InsertTemplateItem>) => {
      return apiRequest(`/api/template-items/${id}`, "PUT", item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsItemDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Template item updated successfully" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/template-items/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template item deleted successfully" });
    }
  });

  const loadTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return apiRequest(`/api/templates/${templateId}/load`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Template loaded successfully" });
      onTemplateLoaded?.();
    }
  });

  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      period: period
    }
  });

  const itemForm = useForm<z.infer<typeof templateItemSchema>>({
    resolver: zodResolver(templateItemSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      notes: ""
    }
  });

  const onCreateTemplate = (data: z.infer<typeof templateSchema>) => {
    createTemplateMutation.mutate(data);
  };

  const onUpdateTemplate = (data: z.infer<typeof templateSchema>) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, ...data });
    }
  };

  const onAddItem = (data: z.infer<typeof templateItemSchema>) => {
    if (selectedTemplate) {
      addItemMutation.mutate({ templateId: selectedTemplate.id, ...data });
    }
  };

  const onUpdateItem = (data: z.infer<typeof templateItemSchema>) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, ...data });
    }
  };

  const openEditTemplate = (template: Template & { items: TemplateItem[] }) => {
    setSelectedTemplate(template);
    templateForm.reset({
      name: template.name,
      period: template.period as "first-half" | "second-half"
    });
    setIsEditDialogOpen(true);
  };

  const openEditItem = (item: TemplateItem) => {
    setEditingItem(item);
    itemForm.reset({
      description: item.description,
      amount: item.amount,
      category: item.category,
      notes: item.notes || ""
    });
    setIsItemDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-4">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Templates</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
            </DialogHeader>
            <Form {...templateForm}>
              <form onSubmit={templateForm.handleSubmit(onCreateTemplate)} className="space-y-4">
                <FormField
                  control={templateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Monthly Bills" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createTemplateMutation.isPending}>
                  Create Template
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map((template: Template & { items: TemplateItem[] }) => (
          <div key={template.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{template.name}</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadTemplateMutation.mutate(template.id)}
                  disabled={loadTemplateMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Load
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditTemplate(template)}
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
              </div>
            </div>

            <div className="space-y-2">
              {template.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex-1">
                    <span className="font-medium">{item.description}</span>
                    <span className="text-sm text-gray-600 ml-2">${item.amount}</span>
                    <span className="text-sm text-gray-600 ml-2">({item.category})</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditItem(item)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteItemMutation.mutate(item.id)}
                      disabled={deleteItemMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedTemplate(template);
                  setEditingItem(null);
                  itemForm.reset();
                  setIsItemDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(onUpdateTemplate)} className="space-y-4">
              <FormField
                control={templateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Monthly Bills" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateTemplateMutation.isPending}>
                Update Template
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(editingItem ? onUpdateItem : onAddItem)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Electric Bill" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name.toLowerCase()}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={editingItem ? updateItemMutation.isPending : addItemMutation.isPending}>
                {editingItem ? "Update Item" : "Add Item"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}