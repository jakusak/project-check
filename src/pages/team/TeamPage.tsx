import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Upload, User } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  title: string;
  photo_url: string | null;
  display_order: number;
}

const TEAM_NAMES: Record<string, string> = {
  "pernes": "Team Pernes",
  "tuscany": "Team Tuscany",
  "czech": "Team Czech",
  "usa": "Team USA",
  "canada": "Team Canada",
};

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({ name: "", title: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const teamName = teamId ? TEAM_NAMES[teamId] || teamId : "Team";

  useEffect(() => {
    if (teamId) {
      fetchMembers();
    }
  }, [teamId]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team", teamId)
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to load team members");
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${teamId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("team-photos")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload photo");
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("team-photos")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.title) {
      toast.error("Please fill in name and title");
      return;
    }

    setUploading(true);

    let photoUrl = editingMember?.photo_url || null;
    if (photoFile) {
      photoUrl = await handlePhotoUpload(photoFile);
    }

    if (editingMember) {
      const { error } = await supabase
        .from("team_members")
        .update({
          name: formData.name,
          title: formData.title,
          photo_url: photoUrl,
        })
        .eq("id", editingMember.id);

      if (error) {
        toast.error("Failed to update team member");
      } else {
        toast.success("Team member updated");
        fetchMembers();
      }
    } else {
      const { error } = await supabase.from("team_members").insert({
        team: teamId,
        name: formData.name,
        title: formData.title,
        photo_url: photoUrl,
        display_order: members.length,
      });

      if (error) {
        toast.error("Failed to add team member");
      } else {
        toast.success("Team member added");
        fetchMembers();
      }
    }

    setUploading(false);
    setDialogOpen(false);
    setEditingMember(null);
    setFormData({ name: "", title: "" });
    setPhotoFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team member?")) return;

    const { error } = await supabase.from("team_members").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete team member");
    } else {
      toast.success("Team member deleted");
      fetchMembers();
    }
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({ name: member.name, title: member.title });
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingMember(null);
    setFormData({ name: "", title: "" });
    setPhotoFile(null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">{teamName}</h1>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Edit Team Member" : "Add Team Member"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter job title"
                  />
                </div>
                <div>
                  <Label htmlFor="photo">Photo</Label>
                  <div className="mt-2">
                    <label className="flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-muted transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">
                        {photoFile ? photoFile.name : "Choose photo..."}
                      </span>
                      <input
                        id="photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setPhotoFile(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? "Saving..." : editingMember ? "Update" : "Add"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {members.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No team members added yet.</p>
          {isAdmin && <p className="text-sm mt-2">Click "Add Member" to get started.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {members.map((member) => (
            <Card key={member.id} className="overflow-hidden group relative">
              <div className="aspect-square bg-muted">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.title}</p>
              </CardContent>
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(member)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
