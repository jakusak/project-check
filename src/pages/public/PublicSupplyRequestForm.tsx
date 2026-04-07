import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, CheckCircle } from "lucide-react";

export default function PublicSupplyRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"kitchen_supplies" | "office_supplies" | "other">("kitchen_supplies");
  const [items, setItems] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [notes, setNotes] = useState("");
  const [requestedBy, setRequestedBy] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !items.trim() || !requestedBy.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("supply_requests").insert({
      title: title.trim().slice(0, 200),
      category,
      items: items.trim().slice(0, 2000),
      quantity: Math.max(1, Math.min(quantity, 9999)),
      priority,
      notes: notes.trim().slice(0, 1000) || null,
      requested_by: requestedBy.trim().slice(0, 100),
    });
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
            <p className="text-muted-foreground">Your supply request has been received. The ops team will review it shortly.</p>
            <Button onClick={() => { setSubmitted(false); setTitle(""); setItems(""); setQuantity(1); setNotes(""); setRequestedBy(""); }} variant="outline">
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
            <ShoppingCart className="h-5 w-5" />
            Supply Request
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit a request for kitchen supplies, office supplies, or other items. No login required.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Request Title *</Label>
              <Input id="title" placeholder="e.g. Coffee beans restock" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kitchen_supplies">Kitchen Supplies</SelectItem>
                    <SelectItem value="office_supplies">Office Supplies</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="items">Item(s) Requested *</Label>
              <Textarea id="items" placeholder="List the items you need, e.g. 2x coffee bags, 1x milk carton..." value={items} onChange={(e) => setItems(e.target.value)} rows={3} maxLength={2000} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" min={1} max={9999} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestedBy">Your Name *</Label>
                <Input id="requestedBy" placeholder="Your name" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} maxLength={100} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Any additional details..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000} />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
