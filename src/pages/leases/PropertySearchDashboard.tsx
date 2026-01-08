import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, MapPin, Home, Warehouse } from "lucide-react";
import { format } from "date-fns";

interface SearchCase {
  id: string;
  case_name: string;
  property_type: string;
  locations: any;
  status: string;
  budget_min: number;
  budget_max: number;
  created_at: string;
  last_run_at?: string;
  next_run_at?: string;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default";
    case "paused":
      return "secondary";
    case "completed":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function PropertySearchDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch search cases
  const { data: searchCases, isLoading } = useQuery({
    queryKey: ["property-search-cases", statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("property_search_cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (typeFilter !== "all") {
        query = query.eq("property_type", typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SearchCase[];
    },
  });

  // Get search statistics
  const { data: stats } = useQuery({
    queryKey: ["search-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_search_cases")
        .select("status, property_type");

      if (error) throw error;

      const total = data.length;
      const active = data.filter((c) => c.status === "active").length;
      const paused = data.filter((c) => c.status === "paused").length;
      const completed = data.filter((c) => c.status === "completed").length;

      return { total, active, paused, completed };
    },
  });

  // Filter search cases by search query
  const filteredSearchCases = searchCases?.filter((searchCase) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchCase.case_name.toLowerCase().includes(searchLower) ||
      searchCase.property_type.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Property Search</h1>
          <p className="text-muted-foreground mt-1">
            Manage property search cases and track results
          </p>
        </div>
        <Button onClick={() => navigate("/leases/property-search/new")}>
          <Plus className="w-4 h-4 mr-2" />
          New Search Case
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Cases</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats?.active || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Paused</CardDescription>
            <CardTitle className="text-3xl">{stats?.paused || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{stats?.completed || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Search Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by case name, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="housing">Housing</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Cases Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading search cases...</div>
          ) : filteredSearchCases && filteredSearchCases.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Budget Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSearchCases.map((searchCase) => (
                    <TableRow
                      key={searchCase.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        navigate(`/leases/property-search/${searchCase.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {searchCase.property_type === "housing" ? (
                            <Home className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Warehouse className="w-4 h-4 text-muted-foreground" />
                          )}
                          {searchCase.case_name}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {searchCase.property_type}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {Array.isArray(searchCase.locations)
                              ? `${searchCase.locations.length} location(s)`
                              : "Not specified"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {searchCase.budget_min && searchCase.budget_max
                          ? `€${searchCase.budget_min} - €${searchCase.budget_max}`
                          : "Not specified"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(searchCase.status)}>
                          {searchCase.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {searchCase.last_run_at
                          ? format(new Date(searchCase.last_run_at), "MMM d, yyyy")
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "No search cases match your filters"
                : "No search cases yet. Create your first search case to get started."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
