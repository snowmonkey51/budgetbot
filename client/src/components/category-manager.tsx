import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Trash2, Plus, Settings } from "lucide-react";
import type { Category, InsertCategory } from "@shared/schema";

const emojiOptions = [
  "🍽️", "🚗", "🛒", "💳", "🎬", "🏥", "📋", "🏠", "✈️", "🎓",
  "👔", "🎮", "📱", "⚽", "🎵", "📚", "🔧", "💡", "🎨", "☕"
];

const colorOptions = [
  { name: "Orange", value: "bg-orange-100" },
  { name: "Blue", value: "bg-blue-100" },
  { name: "Green", value: "bg-green-100" },
  { name: "Purple", value: "bg-purple-100" },
  { name: "Red", value: "bg-red-100" },
  { name: "Pink", value: "bg-pink-100" },
  { name: "Gray", value: "bg-gray-100" },
  { name: "Yellow", value: "bg-yellow-100" },
  { name: "Indigo", value: "bg-indigo-100" },
  { name: "Teal", value: "bg-teal-100" },
];

export function CategoryManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: InsertCategory) => {
      const response = await apiRequest("POST", "/api/categories", category);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "Category Created",
        description: "Your new category has been added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCategory> }) => {
      const response = await apiRequest("PUT", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "Category Updated",
        description: "The category has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category Deleted",
        description: "The category has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setIcon("");
    setColor("");
    setEditingCategory(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !icon || !color) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const categoryData = { name: name.trim(), icon, color };

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: categoryData,
      });
    } else {
      createCategoryMutation.mutate(categoryData);
    }
  };

  const isPending = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Groceries"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category-icon">Icon</Label>
                <Select value={icon} onValueChange={setIcon} required>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {emojiOptions.map((emoji) => (
                      <SelectItem key={emoji} value={emoji}>
                        <span className="text-lg">{emoji}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category-color">Color</Label>
                <Select value={color} onValueChange={setColor} required>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((colorOption) => (
                      <SelectItem key={colorOption.value} value={colorOption.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${colorOption.value} border`}></div>
                          {colorOption.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending 
                    ? (editingCategory ? "Updating..." : "Creating...") 
                    : (editingCategory ? "Update Category" : "Create Category")
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {categories && categories.length > 0 ? (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-lg">{category.icon}</span>
                </div>
                <span className="font-medium">{category.name}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(category)}
                  className="text-slate-400 hover:text-blue-600"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCategoryMutation.mutate(category.id)}
                  disabled={deleteCategoryMutation.isPending}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No categories created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}