import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";

interface EquipmentItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  image_url: string | null;
  availability: boolean;
}

interface CartItem {
  item: EquipmentItem;
  quantity: number;
}

export default function Equipment() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<EquipmentItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadEquipment();
    const storedCart = localStorage.getItem("equipment_cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    let filtered = items;
    
    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.sku.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }
    
    setFilteredItems(filtered);
  }, [search, categoryFilter, items]);

  const loadEquipment = async () => {
    const { data, error } = await supabase
      .from("equipment_items")
      .select("*")
      .eq("availability", true)
      .order("name");
    
    if (error) {
      toast({
        title: "Error loading equipment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setItems(data || []);
      setFilteredItems(data || []);
    }
  };

  const categories = Array.from(new Set(items.map((item) => item.category)));

  const addToCart = (item: EquipmentItem) => {
    const existing = cart.find((c) => c.item.id === item.id);
    let updatedCart;
    if (existing) {
      updatedCart = cart.map((c) =>
        c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      );
    } else {
      updatedCart = [...cart, { item, quantity: 1 }];
    }
    setCart(updatedCart);
    localStorage.setItem("equipment_cart", JSON.stringify(updatedCart));
    toast({
      title: "Added to cart",
      description: `${item.name} added to your request`,
    });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipment Catalog</h1>
          <p className="text-muted-foreground">Browse and request equipment</p>
        </div>
        <Button onClick={() => window.location.href = "/cart"}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart ({cartCount})
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="aspect-square bg-muted rounded-md mb-4 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
              <Badge variant="secondary" className="mt-2">
                {item.category}
              </Badge>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                onClick={() => addToCart(item)}
                className="w-full"
              >
                Add to Request
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
