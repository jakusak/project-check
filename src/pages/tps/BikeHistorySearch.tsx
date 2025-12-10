import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bike, ArrowRight } from "lucide-react";

export default function BikeHistorySearch() {
  const navigate = useNavigate();
  const [bikeId, setBikeId] = useState("");

  const handleSearch = () => {
    if (bikeId.trim()) {
      navigate(`/tps/bikes/${encodeURIComponent(bikeId.trim())}/history`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bike History Search</h1>
        <p className="text-muted-foreground">Look up assignment and maintenance history for any bike</p>
      </div>

      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bike className="h-5 w-5" />
            Search by Bike ID
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter unique bike ID..."
              value={bikeId}
              onChange={(e) => setBikeId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
              autoFocus
            />
          </div>
          <Button onClick={handleSearch} disabled={!bikeId.trim()} className="w-full">
            View History
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
