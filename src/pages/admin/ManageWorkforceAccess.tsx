import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserPlus, Trash2, Users } from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface AllowlistEntry {
  id: string;
  user_id: string;
  notes: string | null;
  created_at: string;
}

export default function ManageWorkforceAccess() {
  const { isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");

  const { data: profiles } = useQuery({
    queryKey: ["profiles-all-workforce"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("email", { ascending: true });
      if (error) throw error;
      return data as Profile[];
    },
    enabled: isAdmin,
  });

  const { data: allowlist, isLoading } = useQuery({
    queryKey: ["workforce-allowlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workforce_access_allowlist")
        .select("id, user_id, notes, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as AllowlistEntry[];
    },
    enabled: isAdmin,
  });

  const profileMap = new Map<string, Profile>();
  profiles?.forEach(p => profileMap.set(p.id, p));

  const allowedIds = new Set(allowlist?.map(a => a.user_id) ?? []);
  const availableProfiles = (profiles ?? []).filter(p => !allowedIds.has(p.id));
  const filteredAvailable = search.trim()
    ? availableProfiles.filter(p =>
        (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.full_name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : availableProfiles;

  const addMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      const { data: authUser } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("workforce_access_allowlist")
        .insert({
          user_id: userId,
          notes: notes || null,
          added_by: authUser.user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workforce-allowlist"] });
      toast.success("User added to Workforce Planning access");
      setDialogOpen(false);
      setSelectedUserId("");
      setNotes("");
      setSearch("");
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workforce_access_allowlist")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workforce-allowlist"] });
      toast.success("Access removed");
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });

  if (authLoading) return <div className="p-6">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Workforce Planning Access
          </h1>
          <p className="text-muted-foreground">
            Only users on this list (plus Super Admins) can access the Workforce Planning section.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Workforce Planning Access</DialogTitle>
              <DialogDescription>
                Select a user to grant access to the Workforce Planning section.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Search user</Label>
                <Input
                  placeholder="Email or name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {filteredAvailable.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No matches</div>
                    ) : (
                      filteredAvailable.slice(0, 50).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name || p.email || p.id}
                          {p.full_name && p.email ? ` — ${p.email}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Reason for access…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => addMutation.mutate({ userId: selectedUserId, notes })}
                disabled={!selectedUserId || addMutation.isPending}
              >
                {addMutation.isPending ? "Adding..." : "Grant Access"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authorized Users</CardTitle>
          <CardDescription>
            {allowlist?.length ?? 0} user(s) currently have access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : !allowlist || allowlist.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No users granted access yet. Click "Grant Access" to add one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowlist.map(entry => {
                  const p = profileMap.get(entry.user_id);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p?.full_name || p?.email || "Unknown"}</p>
                          {p?.full_name && p?.email && (
                            <p className="text-xs text-muted-foreground">{p.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.notes || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMutation.mutate(entry.id)}
                          disabled={removeMutation.isPending}
                          title="Remove access"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How this works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Only users on this allowlist (plus Super Admins) can see or open the Workforce Planning section.</p>
          <p>• Removing a user takes effect immediately on their next page load.</p>
          <p>• A user's existing roles are not affected — this only controls Workforce Planning visibility.</p>
        </CardContent>
      </Card>
    </div>
  );
}
