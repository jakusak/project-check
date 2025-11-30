import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const HUBS = ["Tuscany", "Czech", "Pernes"];
const PERIOD_TYPES = ["Year", "Month", "Week"];
const YEARS = ["2024", "2025", "2026"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKS = Array.from({ length: 52 }, (_, i) => `Week ${i + 1}`);

interface UnitLoad {
  unitType: string;
  unit: string;
  trailerNumber: string;
  teamMember: string;
  vanNumber: string;
  qtyBikes: number;
  wahooBox: string;
  notes: string;
}

// Mock data generator
const generateMockData = (): UnitLoad[] => {
  const unitTypes = ["9-Seater", "Cargo", "Trailer"];
  const units = ["EU-001", "EU-002", "NA-003", "AS-004"];
  const teamMembers = ["John Smith & Mike Johnson", "Sarah Lee & Tom Brown", "Anna Garcia & Chris Wilson"];
  
  return Array.from({ length: 12 }, (_, i) => ({
    unitType: unitTypes[i % 3],
    unit: units[i % 4],
    trailerNumber: `TR-${1000 + i}`,
    teamMember: teamMembers[i % 3],
    vanNumber: `VAN-${200 + i}`,
    qtyBikes: Math.floor(Math.random() * 15) + 5,
    wahooBox: `WH-${3000 + i}`,
    notes: i % 3 === 0 ? "Maintenance scheduled" : i % 3 === 1 ? "Ready for deployment" : "In transit",
  }));
};

export default function UnitLoads() {
  const [hub, setHub] = useState<string>("");
  const [periodType, setPeriodType] = useState<string>("Year");
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [week, setWeek] = useState<string>("");
  const [data, setData] = useState<UnitLoad[]>([]);
  const [hasApplied, setHasApplied] = useState(false);

  const handleApplyFilters = () => {
    if (!hub || !year) return;
    setData(generateMockData());
    setHasApplied(true);
  };

  const handleReset = () => {
    setHub("");
    setPeriodType("Year");
    setYear("");
    setMonth("");
    setWeek("");
    setData([]);
    setHasApplied(false);
  };

  const canApply = hub && year && (periodType !== "Month" || month) && (periodType !== "Week" || week);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unit Loads</h1>
          <p className="text-muted-foreground">Live unit load assignment and logistics overview</p>
        </div>
        <Badge variant="outline">Live Data</Badge>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* HUB Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">HUB</label>
                <Select value={hub} onValueChange={setHub}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select HUB" />
                  </SelectTrigger>
                  <SelectContent>
                    {HUBS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Period Type</label>
                <Select value={periodType} onValueChange={(value) => {
                  setPeriodType(value);
                  setMonth("");
                  setWeek("");
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Month */}
              {periodType === "Month" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Conditional Week */}
              {periodType === "Week" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Week</label>
                  <Select value={week} onValueChange={setWeek}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select week" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKS.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} disabled={!canApply}>
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table or Empty State */}
      {!hasApplied ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Select HUB and Period to load unit data.</p>
            </div>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">No unit loads found for the selected criteria.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-[1200px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Unit Type</TableHead>
                      <TableHead className="font-bold">Unit</TableHead>
                      <TableHead className="font-bold">Trailer Number</TableHead>
                      <TableHead className="font-bold">Load Team Member & Bikeshop Mechanic</TableHead>
                      <TableHead className="font-bold">Van Number</TableHead>
                      <TableHead className="font-bold">Qty Bikes</TableHead>
                      <TableHead className="font-bold">Wahoo Box Number / IT Equipment Distribution</TableHead>
                      <TableHead className="font-bold">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.unitType}</TableCell>
                        <TableCell>{row.unit}</TableCell>
                        <TableCell>{row.trailerNumber}</TableCell>
                        <TableCell>{row.teamMember}</TableCell>
                        <TableCell>{row.vanNumber}</TableCell>
                        <TableCell>{row.qtyBikes}</TableCell>
                        <TableCell>{row.wahooBox}</TableCell>
                        <TableCell className="max-w-xs">{row.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
