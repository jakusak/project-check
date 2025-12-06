import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { toast } from "sonner";

// Hub mapping for display names
const HUB_DISPLAY_NAMES: Record<string, string> = {
  "Pernes": "HUB France: Pernes Les Fontaines",
  "Czechia": "HUB Czech: Cesky Krumlov",
  "Tuscany": "HUB Italy: San Giovanni Valdarno"
};

// Unit types for summary table
const UNIT_TYPES = ["B", "M", "M Ship", "Ship", "W"];

interface UnitLoad {
  id: string;
  hub: string;
  ops_area: string;
  opx_flo: string | null;
  unit: string;
  load_date: string | null;
  loader: string | null;
  unit_type: string | null;
  main: number;
  support: number;
  extra: number;
  no_van: number;
  van_number: string | null;
  trailer_number: string | null;
  family: string | null;
  comment: string | null;
}

interface UnitSummary {
  opsArea: string;
  hub: string;
  counts: Record<string, number>;
  grandTotal: number;
}

export default function UnitLoads() {
  const { isAdmin } = useAuth();
  const [selectedHub, setSelectedHub] = useState<string>("Pernes");
  const [selectedOpsArea, setSelectedOpsArea] = useState<string>("");
  const [unitLoads, setUnitLoads] = useState<UnitLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch unit loads from database
  const fetchUnitLoads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('unit_loads')
        .select('*')
        .order('ops_area', { ascending: true });
      
      if (error) throw error;
      setUnitLoads(data || []);
    } catch (error) {
      console.error('Error fetching unit loads:', error);
      toast.error('Failed to load unit loads data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnitLoads();
  }, []);

  // Get unique OPS areas for current hub
  const currentOpsAreas = [...new Set(
    unitLoads
      .filter(u => u.hub === selectedHub || u.hub.includes(selectedHub))
      .map(u => u.ops_area)
  )].sort();

  // Generate summary data from actual unit loads
  const generateSummaryData = (): UnitSummary[] => {
    const hubData = unitLoads.filter(u => 
      u.hub === selectedHub || u.hub.includes(selectedHub)
    );
    
    const opsAreaMap = new Map<string, UnitSummary>();
    
    hubData.forEach(unit => {
      if (!opsAreaMap.has(unit.ops_area)) {
        opsAreaMap.set(unit.ops_area, {
          opsArea: unit.ops_area,
          hub: HUB_DISPLAY_NAMES[selectedHub] || unit.hub,
          counts: {},
          grandTotal: 0
        });
      }
      
      const summary = opsAreaMap.get(unit.ops_area)!;
      const unitType = unit.unit_type || 'Other';
      summary.counts[unitType] = (summary.counts[unitType] || 0) + 1;
      summary.grandTotal += 1;
    });
    
    return Array.from(opsAreaMap.values()).sort((a, b) => 
      a.opsArea.localeCompare(b.opsArea)
    );
  };

  // Get detail data for selected OPS area
  const getDetailData = (): UnitLoad[] => {
    return unitLoads.filter(u => 
      (u.hub === selectedHub || u.hub.includes(selectedHub)) &&
      u.ops_area === selectedOpsArea
    );
  };

  const handleHubChange = (hub: string) => {
    setSelectedHub(hub);
    setSelectedOpsArea("");
  };

  const handleOpsAreaChange = (opsArea: string) => {
    const actualArea = opsArea === "all" ? "" : opsArea;
    setSelectedOpsArea(actualArea);
  };

  // Parse CSV file
  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const rows: Record<string, string>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    
    return rows;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error('No data found in CSV file');
        return;
      }

      // Map CSV columns to database columns
      const mappedData = rows.map(row => ({
        hub: row.hub || selectedHub,
        ops_area: row.ops_area || row.opsarea || row['ops area'] || '',
        opx_flo: row.opx_flo || row.opxflo || row['opx/flo'] || null,
        unit: row.unit || '',
        load_date: row.load_date || row.loaddate || row['load date'] || null,
        loader: row.loader || null,
        unit_type: row.unit_type || row.unittype || row['unit type'] || null,
        main: parseInt(row.main) || 0,
        support: parseInt(row.support) || 0,
        extra: parseInt(row.extra) || 0,
        no_van: parseInt(row.no_van) || parseInt(row.novan) || 0,
        van_number: row.van_number || row.vannumber || row['van #'] || row['van_#'] || null,
        trailer_number: row.trailer_number || row.trailernumber || row['trailer #'] || row['trailer_#'] || null,
        family: row.family || null,
        comment: row.comment || row.comments || null
      })).filter(row => row.ops_area && row.unit);

      if (mappedData.length === 0) {
        toast.error('No valid data found. Ensure CSV has "ops_area" and "unit" columns.');
        return;
      }

      // Delete existing data for this hub and insert new
      const { error: deleteError } = await supabase
        .from('unit_loads')
        .delete()
        .eq('hub', selectedHub);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('unit_loads')
        .insert(mappedData);

      if (insertError) throw insertError;

      toast.success(`Uploaded ${mappedData.length} records successfully`);
      fetchUnitLoads();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Failed to upload CSV data');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Clear all data for current hub
  const handleClearData = async () => {
    if (!confirm(`Are you sure you want to clear all Unit Loads data for ${selectedHub}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('unit_loads')
        .delete()
        .eq('hub', selectedHub);

      if (error) throw error;
      toast.success('Data cleared successfully');
      fetchUnitLoads();
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    }
  };

  const summaryData = generateSummaryData();
  const detailData = getDetailData();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unit Loads</h1>
          <p className="text-muted-foreground">Live unit load assignment and logistics overview by Hub</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleClearData}
                disabled={uploading}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Hub Data
              </Button>
            </>
          )}
          <Badge variant="outline">
            {unitLoads.length > 0 ? `${unitLoads.length} Units` : 'No Data'}
          </Badge>
        </div>
      </div>

      {/* Hub Tabs */}
      <Tabs value={selectedHub} onValueChange={handleHubChange}>
        <TabsList className="inline-flex h-auto p-1 gap-2 bg-muted/50 rounded-lg">
          <TabsTrigger 
            value="Czechia" 
            className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm whitespace-nowrap"
          >
            HUB Czech: Cesky Krumlov
          </TabsTrigger>
          <TabsTrigger 
            value="Pernes"
            className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm whitespace-nowrap"
          >
            HUB France: Pernes
          </TabsTrigger>
          <TabsTrigger 
            value="Tuscany"
            className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm whitespace-nowrap"
          >
            HUB Italy: San Giovanni
          </TabsTrigger>
        </TabsList>

        {["Czechia", "Pernes", "Tuscany"].map(hub => (
          <TabsContent key={hub} value={hub} className="space-y-6">
            {/* OPS Area Selector */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select OPS Area</label>
                  <Select value={selectedOpsArea || "all"} onValueChange={handleOpsAreaChange}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="All OPS Areas (Summary View)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="all">All OPS Areas (Summary View)</SelectItem>
                      {currentOpsAreas.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <Card>
                <CardContent className="py-12 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : unitLoads.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Unit Loads Data</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a CSV file to populate the unit loads table.
                  </p>
                  {isAdmin && (
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : !selectedOpsArea ? (
              /* Summary Table */
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="w-full">
                    <div className="min-w-[800px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary/10">
                            <TableHead className="font-bold text-foreground">Ops Area</TableHead>
                            <TableHead className="font-bold text-foreground">Hub</TableHead>
                            {UNIT_TYPES.map(type => (
                              <TableHead key={type} className="font-bold text-foreground text-center">{type}</TableHead>
                            ))}
                            <TableHead className="font-bold text-foreground text-center">Grand Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summaryData.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7 + UNIT_TYPES.length} className="text-center py-8 text-muted-foreground">
                                No units found for this hub
                              </TableCell>
                            </TableRow>
                          ) : (
                            summaryData.map((row, index) => (
                              <TableRow key={index} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{row.opsArea}</TableCell>
                                <TableCell>{row.hub}</TableCell>
                                {UNIT_TYPES.map(type => (
                                  <TableCell key={type} className="text-center">
                                    {row.counts[type] || ""}
                                  </TableCell>
                                ))}
                                <TableCell className="text-center font-bold">{row.grandTotal}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              /* Detail Table */
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="w-full">
                    <div className="min-w-[1400px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary/10">
                            <TableHead className="font-bold text-foreground">Hub</TableHead>
                            <TableHead className="font-bold text-foreground">Ops Area</TableHead>
                            <TableHead className="font-bold text-foreground">OpX/FLO</TableHead>
                            <TableHead className="font-bold text-foreground">Unit</TableHead>
                            <TableHead className="font-bold text-foreground">Load Date</TableHead>
                            <TableHead className="font-bold text-foreground">Loader</TableHead>
                            <TableHead className="font-bold text-foreground">Unit Type</TableHead>
                            <TableHead className="font-bold text-foreground text-center">Main</TableHead>
                            <TableHead className="font-bold text-foreground text-center">Support</TableHead>
                            <TableHead className="font-bold text-foreground text-center">Extra</TableHead>
                            <TableHead className="font-bold text-foreground text-center">No Van</TableHead>
                            <TableHead className="font-bold text-foreground">Van #</TableHead>
                            <TableHead className="font-bold text-foreground">Trailer #</TableHead>
                            <TableHead className="font-bold text-foreground">Family</TableHead>
                            <TableHead className="font-bold text-foreground">Comment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailData.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                                No units found for this OPS Area
                              </TableCell>
                            </TableRow>
                          ) : (
                            detailData.map((row) => (
                              <TableRow key={row.id} className="hover:bg-muted/50">
                                <TableCell>{HUB_DISPLAY_NAMES[selectedHub] || row.hub}</TableCell>
                                <TableCell>{row.ops_area}</TableCell>
                                <TableCell>{row.opx_flo || ""}</TableCell>
                                <TableCell className="font-medium">{row.unit}</TableCell>
                                <TableCell>{row.load_date || ""}</TableCell>
                                <TableCell>{row.loader || ""}</TableCell>
                                <TableCell>{row.unit_type || ""}</TableCell>
                                <TableCell className="text-center">{row.main || ""}</TableCell>
                                <TableCell className="text-center">{row.support || ""}</TableCell>
                                <TableCell className="text-center">{row.extra || ""}</TableCell>
                                <TableCell className="text-center">{row.no_van || ""}</TableCell>
                                <TableCell>{row.van_number || ""}</TableCell>
                                <TableCell>{row.trailer_number || ""}</TableCell>
                                <TableCell>{row.family || ""}</TableCell>
                                <TableCell>{row.comment || ""}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}