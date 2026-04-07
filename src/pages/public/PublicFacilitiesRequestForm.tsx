import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building, CheckCircle } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "structural", label: "Structural" },
  { value: "safety", label: "Safety" },
  { value: "renovation", label: "Renovation" },
  { value: "cleaning", label: "Cleaning" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function PublicFacilitiesRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("medium");
  const [requestedBy, setRequestedBy] = useState("");
  const [location, setLocation] = useState("");
  const [requestedDueDate, setRequestedDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requestedBy.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("ops_tasks").insert({
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 2000) || null,
      category,
      priority,
      status: "new_request",
      requested_by: requestedBy.trim().slice(0, 100),
      location: location.trim().slice(0, 200) || null,
      requested_due_date: requestedDueDate || null,
      notes: notes.trim().slice(0, 1000) || null,
      task_mode: "facility_request",
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit request. Please try again.");
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Request Submitted!</h2>
            <p className="text-muted-foreground">Your facilities request has been received. The ops team will triage and schedule it.</p>
            <Button onClick={() => { setSubmitted(false); setTitle(""); setDescription(""); setLocation(""); setRequestedDueDate(""); setNotes(""); setRequestedBy(""); }} variant="outline">
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building className="h-5 w-5" />
            Facilities & Building Request
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Report building issues or request renovations — plumbing, electrical, safety hazards, structural defects, or any facility-related work. No login required.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Request Title *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Replace broken racking in Trailer 14" maxLength={200} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the work needed..." rows={3} maxLength={2000} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedBy">Your Name *</Label>
              <Input id="requestedBy" value={requestedBy} onChange={e => setRequestedBy(e.target.value)} placeholder="Your name" maxLength={100} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Pernes Hub" maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Requested Due Date</Label>
                <Input id="dueDate" type="date" value={requestedDueDate} onChange={e => setRequestedDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional context..." rows={2} maxLength={1000} />
            </div>

            <Button type="submit" className="w-full" disabled={submitting || !title.trim() || !requestedBy.trim()}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
