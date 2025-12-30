import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, DollarSign, FileText, Plus, Users, Car, TrendingUp } from "lucide-react";
import { useFleetDashboardStats } from "@/hooks/useFleetNotices";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

const NOTICE_TYPE_LABELS: Record<string, string> = {
  speeding: 'Speeding',
  parking: 'Parking',
  restricted_zone: 'Restricted Zone',
  toll_fine: 'Toll Fine',
  unknown: 'Unknown',
};

export default function FleetDashboard() {
  const { data: stats, isLoading } = useFleetDashboardStats();

  const typeChartData = stats?.byType
    ? Object.entries(stats.byType).map(([type, count]) => ({
        name: NOTICE_TYPE_LABELS[type] || type,
        value: count,
      }))
    : [];

  const countryChartData = stats?.byCountry
    ? Object.entries(stats.byCountry)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({ country, count }))
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Violations Dashboard</h1>
          <p className="text-muted-foreground">Track and manage speeding tickets, parking fines, and toll notices</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/fleet/drivers">
              <Users className="h-4 w-4 mr-2" />
              Manage Drivers
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/fleet/vehicles">
              <Car className="h-4 w-4 mr-2" />
              Manage Vehicles
            </Link>
          </Button>
          <Button asChild>
            <Link to="/fleet/notices/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Notice
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Notices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats?.openNotices || 0}</div>
            <p className="text-xs text-muted-foreground">Requiring action</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due in 7 Days</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{isLoading ? "..." : stats?.dueSoon || 0}</div>
            <p className="text-xs text-muted-foreground">Urgent attention needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Open Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{isLoading ? "..." : (stats?.totalOpenAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding fines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link to="/fleet/notices?status=needs_review">
                <AlertTriangle className="h-3 w-3 mr-2" />
                Review Queue
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link to="/fleet/notices?status=ready_to_assign">
                Assign Notices
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notices by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {typeChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Country */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notices by Country</CardTitle>
          </CardHeader>
          <CardContent>
            {countryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={countryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="country" type="category" width={40} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.monthlyTrend && stats.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(v) => {
                      const [year, month] = v.split('-');
                      return `${month}/${year.slice(2)}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Triage Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm">
              <Link to="/fleet/notices?status=new">
                <Badge variant="secondary" className="mr-2">New</Badge>
                View New Notices
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/fleet/notices?status=needs_review">
                <Badge variant="destructive" className="mr-2">Review</Badge>
                Needs Review
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/fleet/notices?status=assigned">
                <Badge className="mr-2">Assigned</Badge>
                Assigned
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/fleet/notices?status=in_payment">
                <Badge variant="outline" className="mr-2">Payment</Badge>
                In Payment
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
