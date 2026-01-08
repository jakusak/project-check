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
import { FileText, Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";

type ContractState =
  | "draft"
  | "uploaded"
  | "generated"
  | "ai_assessed"
  | "review_required"
  | "blocked"
  | "approved"
  | "sent_to_docusign"
  | "signed"
  | "archived";

interface Contract {
  id: string;
  contract_number: string;
  contract_type: "housing" | "warehouse";
  country: string;
  state: ContractState;
  duration_months: number;
  created_at: string;
  blocked_reason?: string;
}

const getStateBadgeVariant = (state: ContractState) => {
  switch (state) {
    case "draft":
      return "secondary";
    case "blocked":
      return "destructive";
    case "approved":
    case "signed":
      return "default";
    case "review_required":
      return "outline";
    default:
      return "secondary";
  }
};

const formatState = (state: ContractState) => {
  return state
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ContractsDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  // Fetch contracts
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts", stateFilter, countryFilter],
    queryFn: async () => {
      let query = supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (stateFilter !== "all") {
        query = query.eq("state", stateFilter);
      }

      if (countryFilter !== "all") {
        query = query.eq("country", countryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Contract[];
    },
  });

  // Get contract statistics
  const { data: stats } = useQuery({
    queryKey: ["contract-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("state, contract_type");

      if (error) throw error;

      const total = data.length;
      const drafts = data.filter((c) => c.state === "draft").length;
      const inReview = data.filter(
        (c) => c.state === "review_required" || c.state === "ai_assessed"
      ).length;
      const signed = data.filter((c) => c.state === "signed").length;
      const blocked = data.filter((c) => c.state === "blocked").length;

      return { total, drafts, inReview, signed, blocked };
    },
  });

  // Filter contracts by search query
  const filteredContracts = contracts?.filter((contract) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contract.contract_number.toLowerCase().includes(searchLower) ||
      contract.country.toLowerCase().includes(searchLower) ||
      contract.contract_type.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lease Contracts</h1>
          <p className="text-muted-foreground mt-1">
            Manage European lease contracts for housing and warehouses
          </p>
        </div>
        <Button onClick={() => navigate("/leases/contracts/new")}>
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Contracts</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-3xl">{stats?.drafts || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Review</CardDescription>
            <CardTitle className="text-3xl">{stats?.inReview || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Signed</CardDescription>
            <CardTitle className="text-3xl">{stats?.signed || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Blocked</CardDescription>
            <CardTitle className="text-3xl text-destructive">
              {stats?.blocked || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by contract number, country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review_required">Review Required</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="sent_to_docusign">Sent to DocuSign</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Italy">Italy</SelectItem>
                <SelectItem value="Spain">Spain</SelectItem>
                <SelectItem value="Netherlands">Netherlands</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contracts Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading contracts...</div>
          ) : filteredContracts && filteredContracts.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow
                      key={contract.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        navigate(`/leases/contracts/${contract.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {contract.contract_number}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {contract.contract_type}
                      </TableCell>
                      <TableCell>{contract.country}</TableCell>
                      <TableCell>{contract.duration_months} months</TableCell>
                      <TableCell>
                        <Badge variant={getStateBadgeVariant(contract.state)}>
                          {formatState(contract.state)}
                        </Badge>
                        {contract.state === "blocked" && contract.blocked_reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {contract.blocked_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(contract.created_at), "MMM d, yyyy")}
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
              {searchQuery || stateFilter !== "all" || countryFilter !== "all"
                ? "No contracts match your filters"
                : "No contracts yet. Create your first contract to get started."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
