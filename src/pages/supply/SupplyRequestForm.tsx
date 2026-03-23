import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupplyRequests } from "@/hooks/useSupplyRequests";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { sendTaskNotification } from "@/lib/sendTaskNotification";
import { ShoppingCart } from "lucide-react";

export default function SupplyRequestForm() {
  const navigate = useNavigate();
  const { createRequest } = useSupplyRequests();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"kitchen_supplies" | "office_supplies" | "other">("kitchen_supplies");
  const [items, setItems] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [notes, setNotes] = useState("");
  const [requestedBy, setRequestedBy] = useState(user?.email?.split("@")[0] ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !items.trim() || !requestedBy.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    createRequest.mutate(
      {
        title: title.trim(),
        category,
        items: items.trim(),
        quantity,
        priority,
        notes: notes.trim() || null,
        requested_by: requestedBy.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Request submitted!");
          navigate("/supply/dashboard");
        },
        onError: () => toast.error("Failed to submit request"),
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        ← Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-5 w-5" />
            New Supply Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Request Title *</Label>
              <Input id="title" placeholder="e.g. Coffee beans restock" value={title} onChange={(e) => setTitle(e.target.value)} />
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
              <Textarea id="items" placeholder="List the items you need, e.g. 2x coffee bags, 1x milk carton..." value={items} onChange={(e) => setItems(e.target.value)} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestedBy">Requested By *</Label>
                <Input id="requestedBy" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Any additional details..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createRequest.isPending}>
                {createRequest.isPending ? "Submitting..." : "Submit Request"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/supply/dashboard")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
