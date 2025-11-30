import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const OPS_AREAS = [
  "North America", "Central America", "South America", 
  "Europe", "Africa", "Asia", "Oceania"
];

const STATISTICS = [
  "HUB Total",
  "In Region - LOCAL RENTAL",
  "In Region - TOTAL",
  "On Trip - 9-Seater: Actual",
  "On Trip - 9-Seater: Maximum",
  "On Trip - CARGO: Actual",
  "On Trip - CARGO: Maximum",
  "On Trip - TOTAL: Actual",
  "On Trip - TOTAL: Maximum",
];

const GRANULARITY_OPTIONS = ["Year", "Month", "Week", "Day"];

// Mock data generator
const generateMockData = (granularity: string, startDate: Date, endDate: Date) => {
  const data = [];
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i <= Math.min(daysDiff, 30); i += granularity === "Day" ? 1 : granularity === "Week" ? 7 : granularity === "Month" ? 30 : 365) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    data.push({
      date: format(date, "MMM dd"),
      value: Math.floor(Math.random() * 50) + 20,
    });
  }
  return data;
};

export default function VanModule() {
  const [opsArea, setOpsArea] = useState<string>("");
  const [statistic, setStatistic] = useState<string>("");
  const [granularity, setGranularity] = useState<string>("Month");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const hasFilters = opsArea && statistic && startDate && endDate;

  const mockChartData = hasFilters && startDate && endDate 
    ? generateMockData(granularity, startDate, endDate)
    : [];

  const mockSnapshot = {
    vansInHub: 45,
    vansInRegion: 32,
    vansOnTrip: 18,
  };

  const handleExportCSV = () => {
    if (!hasFilters) return;
    
    const csvContent = [
      ["Date", "Value"],
      ...mockChartData.map(d => [d.date, d.value]),
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `van-module-${opsArea}-${statistic}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Van Module</h1>
          <p className="text-muted-foreground">Live van availability & usage by Operations Area</p>
        </div>
        <Badge variant="outline">Live Data</Badge>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* OPS Area Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">OPS Area</label>
              <Select value={opsArea} onValueChange={setOpsArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {OPS_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statistic Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Statistic</label>
              <Select value={statistic} onValueChange={setStatistic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select statistic" />
                </SelectTrigger>
                <SelectContent>
                  {STATISTICS.map((stat) => (
                    <SelectItem key={stat} value={stat}>
                      {stat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Granularity Toggle */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Granularity</label>
            <div className="flex gap-2">
              {GRANULARITY_OPTIONS.map((option) => (
                <Button
                  key={option}
                  variant={granularity === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGranularity(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasFilters ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Select an OPS Area, a Statistic, and a Date Range to load data.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Status Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Vans in HUB</CardDescription>
                <CardTitle className="text-3xl">{mockSnapshot.vansInHub}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Vans In Region</CardDescription>
                <CardTitle className="text-3xl">{mockSnapshot.vansInRegion}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Vans On Trip</CardDescription>
                <CardTitle className="text-3xl">{mockSnapshot.vansOnTrip}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Chart Visualization */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{statistic}</CardTitle>
                  <CardDescription>
                    {opsArea} - {format(startDate!, "MMM dd, yyyy")} to {format(endDate!, "MMM dd, yyyy")} ({granularity})
                  </CardDescription>
                </div>
                <Button onClick={handleExportCSV} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
