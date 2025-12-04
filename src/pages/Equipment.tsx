import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Globe } from "lucide-react";
import { useRegion, REGION_LABELS, Region } from "@/contexts/RegionContext";

interface EquipmentItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  image_url: string | null;
  availability: boolean;
  regions: string[] | null;
}

interface CartItem {
  item: EquipmentItem;
  quantity: number;
  region: Region;
}

export default function Equipment() {
  const navigate = useNavigate();
  const { selectedRegion, setSelectedRegion } = useRegion();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<EquipmentItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Redirect if no region selected
  useEffect(() => {
    if (!selectedRegion) {
      toast({
        title: "Please select a region",
        description: "Choose a region from the Equipment Request menu to browse equipment",
      });
    }
  }, [selectedRegion]);

  useEffect(() => {
    loadEquipment();
    const storedCart = localStorage.getItem("equipment_cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    let filtered = items;
    
    // Filter by region if selected
    if (selectedRegion) {
      filtered = filtered.filter(
        (item) => item.regions && item.regions.includes(selectedRegion)
      );
    }
    
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
    setCurrentPage(1);
  }, [search, categoryFilter, items, selectedRegion]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

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

  const categoryOptions = [
    "Bike Equipment",
    "Trailer Equipment",
    "Trip Equipment",
    "IT Equipment",
    "Other"
  ];
  
  const categories = Array.from(new Set(items.map((item) => item.category))).filter(Boolean);

  const regions: { key: Region; label: string }[] = [
    { key: "usa_lappa", label: "USA & Lappa" },
    { key: "canada", label: "Canada" },
    { key: "europe", label: "Europe" },
  ];

  const addToCart = (item: EquipmentItem) => {
    if (!selectedRegion) {
      toast({
        title: "Please select a region first",
        description: "Choose a region from the dropdown above",
        variant: "destructive",
      });
      return;
    }

    const existing = cart.find((c) => c.item.id === item.id);
    let updatedCart;
    if (existing) {
      updatedCart = cart.map((c) =>
        c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      );
    } else {
      updatedCart = [...cart, { item, quantity: 1, region: selectedRegion }];
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
        <Button onClick={() => navigate("/cart")}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart ({cartCount})
        </Button>
      </div>

      {/* Region Selection Bar */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        <Globe className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Region:</span>
        <Select 
          value={selectedRegion || ""} 
          onValueChange={(value) => setSelectedRegion(value as Region)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select a region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.key} value={region.key}>
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedRegion && (
          <Badge variant="secondary" className="ml-2">
            Showing items for {REGION_LABELS[selectedRegion]}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-center">
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
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedRegion ? (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Select a Region to Browse Equipment</p>
            <p>Please choose a region from the dropdown above or the Equipment Request menu</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredItems.length)} of {filteredItems.length} items
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {paginatedItems.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No equipment found matching your criteria</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
