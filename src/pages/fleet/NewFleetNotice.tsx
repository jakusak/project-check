import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import NewFleetNoticeForm from "@/components/fleet/NewFleetNoticeForm";

export default function NewFleetNotice() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/fleet/notices");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Add New Notice</h1>
        <p className="text-muted-foreground">Create a new fleet violation notice</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewFleetNoticeForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
