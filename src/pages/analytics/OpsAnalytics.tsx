import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subDays, format } from "date-fns";
import { CalendarIcon, TrendingUp, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import backroadsLogoFull from "@/assets/backroads-logo-full.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { useAuth } from "@/integrations/supabase/auth";
import {
  useOpsAreas,
  useRequestMetrics,
  useIncidentMetrics,
  useRequestsByOpsArea,
  useIncidentsByOpsArea,
  AnalyticsFilters,
} from "@/hooks/useOpsAnalytics";

const STATUS_COLORS = {
  pending_opx: "hsl(45 93% 47%)",
  opx_approved: "hsl(142 71% 45%)",
  opx_rejected: "hsl(0 72% 51%)",
  submitted: "hsl(45 93% 47%)",
  in_review: "hsl(217 91% 60%)",
  closed: "hsl(142 71% 45%)",
};

export default function OpsAnalytics() {
  const navigate = useNavigate();
  const { isOPX, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [opsArea, setOpsArea] = useState<string>("__all__");

  // RBAC check
  useEffect(() => {
    if (!authLoading && !isOPX && !isAdmin && !isSuperAdmin) {
      // Redirect unauthorized users to a safe landing page instead of root to avoid redirect loops
      navigate("/van-incidents");
    }
  }, [authLoading, isOPX, isAdmin, isSuperAdmin, navigate]);

  const filters: AnalyticsFilters = {
    startDate,
    endDate,
    opsArea: opsArea === "__all__" ? undefined : opsArea || undefined,
  };

  const { data: opsAreas, isLoading: opsAreasLoading } = useOpsAreas();
  const { data: requestMetrics, isLoading: requestMetricsLoading } = useRequestMetrics(filters);
  const { data: incidentMetrics, isLoading: incidentMetricsLoading } = useIncidentMetrics(filters);
  const { data: requestsByArea, isLoading: requestsByAreaLoading } = useRequestsByOpsArea(filters);
  const { data: incidentsByArea, isLoading: incidentsByAreaLoading } = useIncidentsByOpsArea(filters);

  if (authLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!isOPX && !isAdmin && !isSuperAdmin) {
    return null;
  }

  const resetFilters = () => {
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
    setOpsArea("__all__");
    setOpsArea("");
  };

  const [overlayHovered, setOverlayHovered] = useState(false);

  return (
    <div className="relative">
      {/* Logo Overlay - covers right half, slides left on hover */}
      <div 
        className={`fixed top-0 right-0 h-full w-1/2 bg-white z-50 flex items-center justify-center transition-transform duration-500 ease-in-out cursor-pointer ${
          overlayHovered ? '-translate-x-full' : 'translate-x-0'
        }`}
        onMouseEnter={() => setOverlayHovered(true)}
        style={{ boxShadow: overlayHovered ? 'none' : '-4px 0 20px rgba(0,0,0,0.1)' }}
      >
        <img 
          src={backroadsLogoFull} 
          alt="Backroads" 
          className="max-w-[80%] max-h-[40%] object-contain"
        />
      </div>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
        <h1 className="text-3xl font-bold">Operations Analytics</h1>
        <p className="text-muted-foreground">
          High-level metrics for Inventory Requests and Van Incidents
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Start Date */}
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
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => d && setStartDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
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
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => d && setEndDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Ops Area Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ops Area</label>
              <Select value={opsArea} onValueChange={setOpsArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All areas</SelectItem>
                  {opsAreas?.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button variant="outline" className="w-full" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Requests Submitted */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Requests Submitted
            </CardDescription>
            {requestMetricsLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <CardTitle className="text-3xl">{requestMetrics?.totalSubmitted || 0}</CardTitle>
            )}
          </CardHeader>
        </Card>

        {/* Approval Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved / Rejected
            </CardDescription>
            {requestMetricsLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <CardTitle className="text-3xl">
                <span className="text-green-600">{requestMetrics?.approvalRate.toFixed(0)}%</span>
                <span className="text-muted-foreground mx-2">/</span>
                <span className="text-destructive">{requestMetrics?.rejectionRate.toFixed(0)}%</span>
              </CardTitle>
            )}
          </CardHeader>
        </Card>

        {/* Median Approval Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Median Approval Time
            </CardDescription>
            {requestMetricsLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <CardTitle className="text-3xl">
                {requestMetrics?.medianApprovalTimeHours != null
                  ? `${requestMetrics.medianApprovalTimeHours}h`
                  : "N/A"}
              </CardTitle>
            )}
          </CardHeader>
        </Card>

        {/* Van Incidents */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Van Incidents
            </CardDescription>
            {incidentMetricsLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <CardTitle className="text-3xl">{incidentMetrics?.totalSubmitted || 0}</CardTitle>
            )}
          </CardHeader>
        </Card>
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Ops Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Requests by Ops Area</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {requestsByAreaLoading ? (
              <Skeleton className="h-[300px]" />
            ) : requestsByArea && requestsByArea.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={requestsByArea} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="ops_area" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pending_opx" name="Pending" stackId="a" fill={STATUS_COLORS.pending_opx} />
                  <Bar dataKey="opx_approved" name="Approved" stackId="a" fill={STATUS_COLORS.opx_approved} />
                  <Bar dataKey="opx_rejected" name="Rejected" stackId="a" fill={STATUS_COLORS.opx_rejected} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No request data for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidents by Ops Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Incidents by Ops Area</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {incidentsByAreaLoading ? (
              <Skeleton className="h-[300px]" />
            ) : incidentsByArea && incidentsByArea.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incidentsByArea} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="ops_area" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="submitted" name="Submitted" stackId="a" fill={STATUS_COLORS.submitted} />
                  <Bar dataKey="in_review" name="In Review" stackId="a" fill={STATUS_COLORS.in_review} />
                  <Bar dataKey="closed" name="Closed" stackId="a" fill={STATUS_COLORS.closed} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No incident data for selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Requests Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {requestsByAreaLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ops Area</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Approved</TableHead>
                      <TableHead className="text-right">Rejected</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestsByArea && requestsByArea.length > 0 ? (
                      requestsByArea.map((row) => (
                        <TableRow key={row.ops_area}>
                          <TableCell className="font-medium">{row.ops_area}</TableCell>
                          <TableCell className="text-right">{row.pending_opx}</TableCell>
                          <TableCell className="text-right text-green-600">{row.opx_approved}</TableCell>
                          <TableCell className="text-right text-destructive">{row.opx_rejected}</TableCell>
                          <TableCell className="text-right font-semibold">{row.total}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Incidents Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {incidentsByAreaLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ops Area</TableHead>
                      <TableHead className="text-right">Submitted</TableHead>
                      <TableHead className="text-right">In Review</TableHead>
                      <TableHead className="text-right">Closed</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidentsByArea && incidentsByArea.length > 0 ? (
                      incidentsByArea.map((row) => (
                        <TableRow key={row.ops_area}>
                          <TableCell className="font-medium">{row.ops_area}</TableCell>
                          <TableCell className="text-right">{row.submitted}</TableCell>
                          <TableCell className="text-right">{row.in_review}</TableCell>
                          <TableCell className="text-right text-green-600">{row.closed}</TableCell>
                          <TableCell className="text-right font-semibold">{row.total}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No data
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
