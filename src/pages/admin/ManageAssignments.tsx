import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserPlus, Trash2, MapPin, Warehouse, Settings } from "lucide-react";

interface OPXAssignment {
  id: string;
  user_id: string;
  ops_area: string;
  created_at: string;
}

interface HubAssignment {
  id: string;
  user_id: string;
  hub: string;
  created_at: string;
}

interface AppSetting {
  id: string;
  key: string;
  value: any;
}

export default function ManageAssignments() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // OPX dialog state
  const [opxDialogOpen, setOpxDialogOpen] = useState(false);
  const [newOpxUserId, setNewOpxUserId] = useState("");
  const [newOpxArea, setNewOpxArea] = useState("");
  
  // Hub Admin dialog state
  const [hubDialogOpen, setHubDialogOpen] = useState(false);
  const [newHubUserId, setNewHubUserId] = useState("");
  const [newHub, setNewHub] = useState("");
  
  // Settings state
  const [reminderHours, setReminderHours] = useState("24");

  // Fetch OPS Areas
  const { data: opsAreas } = useQuery({
    queryKey: ["ops-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_area_to_hub")
        .select("ops_area")
        .order("ops_area");
      if (error) throw error;
      return [...new Set(data.map(d => d.ops_area))];
    },
    enabled: isAdmin,
  });

  // Fetch Hubs
  const { data: hubs } = useQuery({
    queryKey: ["hubs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ops_area_to_hub")
        .select("hub")
        .order("hub");
      if (error) throw error;
      return [...new Set(data.map(d => d.hub))];
    },
    enabled: isAdmin,
  });

  // Fetch OPX assignments
  const { data: opxAssignments, isLoading: opxLoading } = useQuery({
    queryKey: ["opx-assignments-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opx_area_assignments")
        .select("*")
        .order("ops_area");
      if (error) throw error;
      return data as OPXAssignment[];
    },
    enabled: isAdmin,
  });

  // Fetch Hub Admin assignments
  const { data: hubAssignments, isLoading: hubLoading } = useQuery({
    queryKey: ["hub-assignments-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hub_admin_assignments")
        .select("*")
        .order("hub");
      if (error) throw error;
      return data as HubAssignment[];
    },
    enabled: isAdmin,
  });

  // Fetch app settings
  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*");
      if (error) throw error;
      return data as AppSetting[];
    },
    enabled: isAdmin,
  });

  // Set initial reminder hours from settings
  useState(() => {
    const reminderSetting = settings?.find(s => s.key === 'opx_reminder_hours');
    if (reminderSetting) {
      setReminderHours(String(reminderSetting.value));
    }
  });

  // Add OPX assignment
  const addOpxMutation = useMutation({
    mutationFn: async ({ userId, opsArea }: { userId: string; opsArea: string }) => {
      const { error } = await supabase
        .from("opx_area_assignments")
        .insert({ user_id: userId, ops_area: opsArea, assigned_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opx-assignments-all"] });
      toast.success("OPX assignment added");
      setNewOpxUserId("");
      setNewOpxArea("");
      setOpxDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  // Delete OPX assignment
  const deleteOpxMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("opx_area_assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opx-assignments-all"] });
      toast.success("Assignment removed");
    },
  });

  // Add Hub Admin assignment
  const addHubMutation = useMutation({
    mutationFn: async ({ userId, hub }: { userId: string; hub: string }) => {
      const { error } = await supabase
        .from("hub_admin_assignments")
        .insert({ user_id: userId, hub: hub, assigned_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hub-assignments-all"] });
      toast.success("Hub Admin assignment added");
      setNewHubUserId("");
      setNewHub("");
      setHubDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  // Delete Hub Admin assignment
  const deleteHubMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hub_admin_assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hub-assignments-all"] });
      toast.success("Assignment removed");
    },
  });

  // Update reminder setting
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ value, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Setting updated");
    },
  });

  const validateUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id.trim());
  };

  if (authLoading) {
    return <div className="p-6 flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Manage Assignments
        </h1>
        <p className="text-muted-foreground">
          Assign OPX users to OPS Areas and Hub Admins to Hubs
        </p>
      </div>

      <Tabs defaultValue="opx">
        <TabsList>
          <TabsTrigger value="opx" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            OPX Assignments
          </TabsTrigger>
          <TabsTrigger value="hub" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Hub Admin Assignments
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* OPX Assignments Tab */}
        <TabsContent value="opx">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>OPX → OPS Area Assignments</CardTitle>
                <CardDescription>
                  Assign OPX users to review requests from specific OPS Areas
                </CardDescription>
              </div>
              <Dialog open={opxDialogOpen} onOpenChange={setOpxDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign OPX to OPS Area</DialogTitle>
                    <DialogDescription>
                      Link an OPX user to an OPS Area. They'll see all requests from that area.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>User ID</Label>
                      <Input
                        placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                        value={newOpxUserId}
                        onChange={(e) => setNewOpxUserId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        User must have the 'opx' role assigned first
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>OPS Area</Label>
                      <Select value={newOpxArea} onValueChange={setNewOpxArea}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select area..." />
                        </SelectTrigger>
                        <SelectContent>
                          {opsAreas?.map(area => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpxDialogOpen(false)}>Cancel</Button>
                    <Button
                      onClick={() => {
                        if (!validateUUID(newOpxUserId)) {
                          toast.error("Invalid User ID format");
                          return;
                        }
                        if (!newOpxArea) {
                          toast.error("Select an OPS Area");
                          return;
                        }
                        addOpxMutation.mutate({ userId: newOpxUserId.trim(), opsArea: newOpxArea });
                      }}
                      disabled={addOpxMutation.isPending}
                    >
                      Add Assignment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {opxLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading...</p>
              ) : !opxAssignments || opxAssignments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No OPX assignments yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>OPS Area</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opxAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-mono text-sm">{assignment.user_id}</TableCell>
                        <TableCell>{assignment.ops_area}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOpxMutation.mutate(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hub Admin Assignments Tab */}
        <TabsContent value="hub">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hub Admin → Hub Assignments</CardTitle>
                <CardDescription>
                  Assign Hub Admin users to fulfill requests for specific Hubs
                </CardDescription>
              </div>
              <Dialog open={hubDialogOpen} onOpenChange={setHubDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Hub Admin to Hub</DialogTitle>
                    <DialogDescription>
                      Link a Hub Admin user to a Hub. They'll process OPX-approved requests for that hub.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>User ID</Label>
                      <Input
                        placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                        value={newHubUserId}
                        onChange={(e) => setNewHubUserId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        User must have the 'hub_admin' role assigned first
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Hub</Label>
                      <Select value={newHub} onValueChange={setNewHub}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hub..." />
                        </SelectTrigger>
                        <SelectContent>
                          {hubs?.map(hub => (
                            <SelectItem key={hub} value={hub}>{hub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setHubDialogOpen(false)}>Cancel</Button>
                    <Button
                      onClick={() => {
                        if (!validateUUID(newHubUserId)) {
                          toast.error("Invalid User ID format");
                          return;
                        }
                        if (!newHub) {
                          toast.error("Select a Hub");
                          return;
                        }
                        addHubMutation.mutate({ userId: newHubUserId.trim(), hub: newHub });
                      }}
                      disabled={addHubMutation.isPending}
                    >
                      Add Assignment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {hubLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading...</p>
              ) : !hubAssignments || hubAssignments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No Hub Admin assignments yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Hub</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hubAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-mono text-sm">{assignment.user_id}</TableCell>
                        <TableCell>{assignment.hub}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteHubMutation.mutate(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings for the equipment request workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>OPX Reminder Timeframe (hours)</Label>
                <div className="flex gap-2 max-w-xs">
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={reminderHours}
                    onChange={(e) => setReminderHours(e.target.value)}
                  />
                  <Button
                    onClick={() => {
                      const hours = parseInt(reminderHours);
                      if (hours < 1 || hours > 168) {
                        toast.error("Hours must be between 1 and 168");
                        return;
                      }
                      updateSettingMutation.mutate({ key: 'opx_reminder_hours', value: hours });
                    }}
                    disabled={updateSettingMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  OPX users will be reminded about pending requests after this many hours
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
