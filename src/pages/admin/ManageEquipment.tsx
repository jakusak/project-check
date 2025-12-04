import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, Image } from "lucide-react";

interface EquipmentItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  image_url: string | null;
  availability: boolean;
  regions: string[] | null;
}

const CATEGORIES = [
  "Bike Equipment",
  "Trailer Parts",
  "Trip Equipment",
  "IT Equipment",
  "Other",
];

const REGIONS = [
  { key: "usa_lappa", label: "USA & Lappa" },
  { key: "canada", label: "Canada" },
  { key: "europe", label: "Europe" },
];

export default function ManageEquipment() {
  const { toast } = useToast();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    image_url: "",
    availability: true,
    regions: ["europe", "usa_lappa", "canada"] as string[],
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    const { data, error } = await supabase
      .from("equipment_items")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error loading equipment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
  };

  const openDialog = (item?: EquipmentItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        sku: item.sku,
        category: item.category,
        image_url: item.image_url || "",
        availability: item.availability,
        regions: item.regions || ["europe", "usa_lappa", "canada"],
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        sku: "",
        category: "",
        image_url: "",
        availability: true,
        regions: ["europe", "usa_lappa", "canada"],
      });
    }
    setDialogOpen(true);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('equipment-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast({
        title: "Image uploaded",
        description: "Image has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        uploadImage(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  const toggleRegion = (regionKey: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.includes(regionKey)
        ? prev.regions.filter(r => r !== regionKey)
        : [...prev.regions, regionKey]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.regions.length === 0) {
      toast({
        title: "Please select at least one region",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...formData,
      image_url: formData.image_url || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("equipment_items")
        .update(data)
        .eq("id", editingItem.id);

      if (error) {
        toast({
          title: "Error updating item",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Item updated",
          description: "Equipment item has been updated successfully",
        });
        setDialogOpen(false);
        loadEquipment();
      }
    } else {
      const { error } = await supabase
        .from("equipment_items")
        .insert(data);

      if (error) {
        toast({
          title: "Error creating item",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Item created",
          description: "Equipment item has been created successfully",
        });
        setDialogOpen(false);
        loadEquipment();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase
      .from("equipment_items")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Item deleted",
        description: "Equipment item has been deleted",
      });
      loadEquipment();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Equipment</h1>
          <p className="text-muted-foreground">Add, edit, or remove equipment items</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Equipment Item" : "Add Equipment Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Regions Selection */}
              <div className="space-y-2">
                <Label>Regions *</Label>
                <div className="flex flex-wrap gap-3">
                  {REGIONS.map((region) => (
                    <div key={region.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${region.key}`}
                        checked={formData.regions.includes(region.key)}
                        onCheckedChange={() => toggleRegion(region.key)}
                      />
                      <Label htmlFor={`region-${region.key}`} className="cursor-pointer text-sm">
                        {region.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Select which regions this item is available in</p>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Image</Label>
                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="Equipment preview"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {uploading
                          ? "Uploading..."
                          : "Drop image here or click to upload"}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="availability"
                  checked={formData.availability}
                  onChange={(e) =>
                    setFormData({ ...formData, availability: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="availability" className="cursor-pointer">
                  Available
                </Label>
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? "Update Item" : "Create Item"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Regions</TableHead>
                <TableHead>Available</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No equipment items found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Image className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.regions?.map(r => (
                          <Badge key={r} variant="outline" className="text-xs">
                            {REGIONS.find(reg => reg.key === r)?.label || r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{item.availability ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
