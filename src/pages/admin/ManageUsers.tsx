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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Trash2, Shield, Users, MapPin, Warehouse, User } from "lucide-react";

type AppRole = 'admin' | 'field_staff' | 'opx' | 'hub_admin' | 'user';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  admin: {
    label: "Admin",
    icon: <Shield className="h-3 w-3" />,
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Full system access, can manage all settings"
  },
  field_staff: {
    label: "Field Staff",
    icon: <User className="h-3 w-3" />,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Can request equipment from the catalog"
  },
  opx: {
    label: "OPX",
    icon: <MapPin className="h-3 w-3" />,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Reviews and approves Field Staff requests"
  },
  hub_admin: {
    label: "Hub Admin",
    icon: <Warehouse className="h-3 w-3" />,
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Fulfills OPX-approved requests at the Hub"
  },
  user: {
    label: "User",
    icon: <User className="h-3 w-3" />,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Basic user access"
  },
};

export default function ManageUsers() {
  const { isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("field_staff");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch all profiles for lookups
  const { data: profiles } = useQuery({
    queryKey: ["profiles-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name");
      if (error) throw error;
      return data as Profile[];
    },
    enabled: isAdmin,
  });

  // Create a lookup map for profiles
  const profileMap = new Map<string, Profile>();
  profiles?.forEach(p => profileMap.set(p.id, p));

  const { data: userRoles, isLoading } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("role", { ascending: true });

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: isAdmin,
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast.success("Role added successfully");
      setNewUserId("");
      setNewRole("field_staff");
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add role: ${error.message}`);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast.success("Role removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });

  const handleAddRole = () => {
    if (!newUserId.trim()) {
      toast.error("Please enter a user ID");
      return;
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(newUserId.trim())) {
      toast.error("Please enter a valid user ID (UUID format)");
      return;
    }

    addRoleMutation.mutate({ userId: newUserId.trim(), role: newRole });
  };

  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  // Group roles by user
  const rolesByUser = userRoles?.reduce((acc, role) => {
    if (!acc[role.user_id]) {
      acc[role.user_id] = [];
    }
    acc[role.user_id].push(role);
    return acc;
  }, {} as Record<string, UserRole[]>) || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Manage Users
          </h1>
          <p className="text-muted-foreground">
            Assign and manage user roles
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User Role</DialogTitle>
              <DialogDescription>
                Assign a role to a user. You'll need the user's ID from the Authentication section of your backend.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="e.g., 12345678-1234-1234-1234-123456789012"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Copy the user's ID from Authentication → Users in your backend
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newRole && (
                  <p className="text-xs text-muted-foreground">
                    {ROLE_CONFIG[newRole].description}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddRole}
                disabled={addRoleMutation.isPending}
              >
                {addRoleMutation.isPending ? "Adding..." : "Add Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(ROLE_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-start gap-2 p-2 rounded-md border">
                <Badge className={`${config.color} border`} variant="outline">
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
          <CardDescription>
            All users with assigned roles in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : !userRoles || userRoles.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No user roles found. Add a role to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(rolesByUser).map(([userId, roles]) => (
                  <TableRow key={userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{profileMap.get(userId)?.email || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{userId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roles.map((userRole) => {
                          const config = ROLE_CONFIG[userRole.role as AppRole];
                          return (
                            <Badge 
                              key={userRole.id} 
                              className={`${config.color} border`} 
                              variant="outline"
                            >
                              {config.icon}
                              <span className="ml-1">{config.label}</span>
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {roles.map((userRole) => (
                          <Button
                            key={userRole.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRoleMutation.mutate(userRole.id)}
                            disabled={deleteRoleMutation.isPending}
                            title={`Remove ${ROLE_CONFIG[userRole.role as AppRole].label} role`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>1. Field Staff</strong> → Requests equipment from the catalog</p>
          <p><strong>2. OPX</strong> → Reviews requests for their assigned OPS Areas, can modify quantities</p>
          <p><strong>3. Hub Admin</strong> → Fulfills OPX-approved requests for their assigned Hubs</p>
          <p className="mt-4 text-xs">
            After assigning roles, go to <strong>Manage Assignments</strong> to link OPX users to OPS Areas and Hub Admins to Hubs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
