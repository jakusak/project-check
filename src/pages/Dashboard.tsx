import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RpRecord {
  trip_id: string;
  trip_name: string;
  region: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function Dashboard() {
  const [data, setData] = useState<RpRecord[]>([]);
  const [filteredData, setFilteredData] = useState<RpRecord[]>([]);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/data/rp.json")
      .then((res) => res.json())
      .then((jsonData) => {
        setData(jsonData);
        setFilteredData(jsonData);
      });
  }, []);

  useEffect(() => {
    let filtered = data;
    
    if (regionFilter !== "all") {
      filtered = filtered.filter((item) => item.region === regionFilter);
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    
    setFilteredData(filtered);
  }, [regionFilter, statusFilter, data]);

  const regions = Array.from(new Set(data.map((item) => item.region)));
  const statuses = Array.from(new Set(data.map((item) => item.status)));

  const chartData = regions.map((region) => ({
    region,
    count: filteredData.filter((item) => item.region === region).length,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RP Dashboard</h1>
          <p className="text-muted-foreground">View trip reporting and performance data</p>
        </div>
        <Badge variant="outline">Static Data Only</Badge>
      </div>

      <div className="flex gap-4">
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trips by Region</CardTitle>
          <CardDescription>Distribution of trips across regions</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trip Records</CardTitle>
          <CardDescription>All trip data from static source</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip ID</TableHead>
                <TableHead>Trip Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record) => (
                <TableRow key={record.trip_id}>
                  <TableCell className="font-medium">{record.trip_id}</TableCell>
                  <TableCell>{record.trip_name}</TableCell>
                  <TableCell>{record.region}</TableCell>
                  <TableCell>{record.start_date}</TableCell>
                  <TableCell>{record.end_date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === "Active"
                          ? "default"
                          : record.status === "Planning"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
