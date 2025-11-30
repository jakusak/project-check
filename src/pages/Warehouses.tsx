import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data - Ops Areas from the spreadsheet
const OPS_AREAS = [
  "Croatia", "Tuscany", "Czech&Austria", "Portugal South – PG", "Provence", 
  "Mallorca", "Netherlands", "Switzerland", "Bavaria Tyrol", "Burgundy/Alsace", 
  "Basque", "Puglia", "Denmark", "Ireland – Kenmare", "Norway – Voss/Bergen", 
  "Sicily", "Catalunya", "Baltics", "Greece – Creete", "Greece – Peloponnese", 
  "Slovenia", "Piedmont", "Andaluzia", "Berlin"
];

interface WarehouseRow {
  hub: string;
  size: string;
  opsArea: string;
  shipUnits: number;
  bikesUnits: number;
  noBikesUnits: number;
  totalUnits: number;
  maxVans: number;
  trailersCount: number;
  bikesCount: number;
  parkingSqm: number;
  bikeStorageSqm: number;
  totalStorageSqm: number;
  spaceContributionSqm: number;
  wahooUnits: number;
}

// Mock data generator for warehouse rows
const generateMockData = (opsArea: string): WarehouseRow[] => {
  const sizes = ["Extra-Large", "Large", "Medium", "Small"];
  const hubs = ["Croatia", "Italy", "Pernes", "France", "Spain", "Netherlands"];
  
  return Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, i) => ({
    hub: hubs[Math.floor(Math.random() * hubs.length)],
    size: sizes[Math.floor(Math.random() * sizes.length)],
    opsArea: opsArea,
    shipUnits: Math.floor(Math.random() * 20),
    bikesUnits: Math.floor(Math.random() * 50) + 10,
    noBikesUnits: Math.floor(Math.random() * 10),
    totalUnits: Math.floor(Math.random() * 80) + 20,
    maxVans: Math.floor(Math.random() * 15) + 5,
    trailersCount: Math.floor(Math.random() * 8) + 2,
    bikesCount: Math.floor(Math.random() * 300) + 100,
    parkingSqm: Math.floor(Math.random() * 500) + 200,
    bikeStorageSqm: Math.floor(Math.random() * 400) + 150,
    totalStorageSqm: Math.floor(Math.random() * 1000) + 500,
    spaceContributionSqm: Math.floor(Math.random() * 300) + 100,
    wahooUnits: Math.floor(Math.random() * 20) + 5,
  }));
};

type SortField = keyof WarehouseRow;
type SortDirection = "asc" | "desc";

export default function Warehouses() {
  const [selectedOpsArea, setSelectedOpsArea] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isLoading, setIsLoading] = useState(false);

  // Mock API call - in reality would fetch from backend
  const warehouseData = useMemo(() => {
    if (!selectedOpsArea) return [];
    return generateMockData(selectedOpsArea);
  }, [selectedOpsArea]);

  // Filter data based on search text
  const filteredData = useMemo(() => {
    if (!searchText) return warehouseData;
    const search = searchText.toLowerCase();
    return warehouseData.filter(
      (row) =>
        row.opsArea.toLowerCase().includes(search) ||
        row.hub.toLowerCase().includes(search) ||
        row.size.toLowerCase().includes(search)
    );
  }, [warehouseData, searchText]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === "asc" 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortField, sortDirection]);

  // Calculate snapshot values
  const snapshot = useMemo(() => {
    if (!selectedOpsArea || warehouseData.length === 0) return null;
    
    return {
      totalUnits: warehouseData.reduce((sum, row) => sum + row.totalUnits, 0),
      maxVans: warehouseData.reduce((sum, row) => sum + row.maxVans, 0),
      totalTrailers: warehouseData.reduce((sum, row) => sum + row.trailersCount, 0),
      totalBikes: warehouseData.reduce((sum, row) => sum + row.bikesCount, 0),
      totalStorage: warehouseData.reduce((sum, row) => sum + row.totalStorageSqm, 0),
    };
  }, [selectedOpsArea, warehouseData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warehouses</h1>
          <p className="text-muted-foreground">Live warehouse capacity and space needs by Ops Area.</p>
        </div>

        {/* Filter Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Ops Area</label>
                <Select value={selectedOpsArea} onValueChange={setSelectedOpsArea}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Ops Area" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {OPS_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Filter by Ops Area, HUB, or Size..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Snapshot Cards */}
        {snapshot && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Units</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{snapshot.totalUnits}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Maximum Vans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{snapshot.maxVans}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Trailers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{snapshot.totalTrailers}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Bikes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{snapshot.totalBikes}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Storage (m²)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{snapshot.totalStorage.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Table */}
        <Card>
          <CardContent className="pt-6">
            {!selectedOpsArea ? (
              <div className="text-center py-12 text-muted-foreground">
                Select an Ops Area to see warehouse data.
              </div>
            ) : isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading warehouse data...
              </div>
            ) : sortedData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No warehouse records found for the selected Ops Area.
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead 
                          className="cursor-pointer hover:bg-muted sticky left-0 bg-muted/50 z-10"
                          onClick={() => handleSort("hub")}
                        >
                          HUB{getSortIcon("hub")}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleSort("size")}
                        >
                          Size{getSortIcon("size")}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleSort("opsArea")}
                        >
                          Ops Area{getSortIcon("opsArea")}
                        </TableHead>
                        <TableHead className="text-right">SHIP</TableHead>
                        <TableHead className="text-right">Bikes</TableHead>
                        <TableHead className="text-right">No Bikes</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted text-right"
                          onClick={() => handleSort("totalUnits")}
                        >
                          Total Units{getSortIcon("totalUnits")}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted text-right"
                          onClick={() => handleSort("maxVans")}
                        >
                          Max Vans{getSortIcon("maxVans")}
                        </TableHead>
                        <TableHead className="text-right"># of Trailers</TableHead>
                        <TableHead className="text-right"># of Bikes</TableHead>
                        <TableHead className="text-right">Parking (m²)</TableHead>
                        <TableHead className="text-right"># Bike Storage (m²)</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted text-right"
                          onClick={() => handleSort("totalStorageSqm")}
                        >
                          Total Storage (m²){getSortIcon("totalStorageSqm")}
                        </TableHead>
                        <TableHead className="text-right">Space Contribution (m²)</TableHead>
                        <TableHead className="text-right">Wahoo Units</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium sticky left-0 bg-background">{row.hub}</TableCell>
                          <TableCell>{row.size}</TableCell>
                          <TableCell>{row.opsArea}</TableCell>
                          <TableCell className="text-right">{row.shipUnits}</TableCell>
                          <TableCell className="text-right">{row.bikesUnits}</TableCell>
                          <TableCell className="text-right">{row.noBikesUnits}</TableCell>
                          <TableCell className="text-right font-medium">{row.totalUnits}</TableCell>
                          <TableCell className="text-right">{row.maxVans}</TableCell>
                          <TableCell className="text-right">{row.trailersCount}</TableCell>
                          <TableCell className="text-right">{row.bikesCount}</TableCell>
                          <TableCell className="text-right">{row.parkingSqm}</TableCell>
                          <TableCell className="text-right">{row.bikeStorageSqm}</TableCell>
                          <TableCell className="text-right font-medium">{row.totalStorageSqm.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{row.spaceContributionSqm}</TableCell>
                          <TableCell className="text-right">{row.wahooUnits}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
