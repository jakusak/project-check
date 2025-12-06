import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Hub to OPS Areas mapping
const HUB_OPS_AREAS: Record<string, string[]> = {
  "Pernes": [
    "Croatia: Dubrovnik", "Croatia: Split", "Cyprus: Larnaca", "England: Cornwall", 
    "England: Cotswolds", "Finland: Levi", "France: Aube", "France: Bordeaux", 
    "France: Chamonix", "France: Corsica", "France: Hendaye", "France: Occitanie", 
    "France: Provence", "France: Riviera", "France: Saint-Malo", "France: Savoie",
    "France: Tours", "Germany: Berlin", "Germany: Rosenheim", "Greece: Crete",
    "Greece: Peloponnese", "Iceland: Reykjavik", "Ireland: Dublin", "Ireland: Galway",
    "Ireland: Kenmare", "Latvia: Riga", "Netherlands: The Hague", "Norway: Alesund",
    "Norway: Alta", "Norway: Lofoten", "Norway: Oslo", "Norway: Voss", "Poland: Krakow",
    "Portugal: Azores", "Portugal: Lisbon", "Portugal: Madeira", "Portugal: Porto",
    "Scotland: Aviemore", "Scotland: Stirling", "Slovenia: Jesenice", "Spain: Cantabria",
    "Spain: Cuenca", "Spain: Huesca", "Spain: Mallorca", "Spain: Puigcerda", "Spain: Ronda",
    "Spain: Salamanca", "Spain: Tenerife", "Sweden: Malmo", "Switzerland: Bern",
    "Switzerland: Davos", "Wales: Cardiff"
  ],
  "Czechia": [
    "Czechia: Cesky Krumlov", "Germany: Bavaria", "Austria: Salzburg", "Poland: Warsaw"
  ],
  "Tuscany": [
    "Italy: Asti", "Italy: Milan", "Italy: Naples", "Italy: Puglia", "Italy: Sardinia",
    "Italy: Sicily", "Italy: Trentino", "Italy: Tuscany", "Italy: Val Gardena"
  ]
};

// Unit types for summary table
const UNIT_TYPES = ["B", "M", "M Ship", "Ship", "W"];

interface UnitSummary {
  opsArea: string;
  hub: string;
  counts: Record<string, number>;
  grandTotal: number;
}

interface UnitDetail {
  hub: string;
  opsArea: string;
  opxFlo: string;
  unit: string;
  loadDate: string;
  loader: string;
  unitType: string;
  main: number;
  support: number;
  extra: number;
  noVan: number;
  vanNumber: string;
  trailerNumber: string;
  family: string;
  comment: string;
}

// Generate mock summary data for a hub
const generateSummaryData = (hub: string): UnitSummary[] => {
  const opsAreas = HUB_OPS_AREAS[hub] || [];
  return opsAreas.map(opsArea => {
    const counts: Record<string, number> = {};
    let grandTotal = 0;
    UNIT_TYPES.forEach(type => {
      const count = Math.random() > 0.5 ? Math.floor(Math.random() * 15) : 0;
      counts[type] = count;
      grandTotal += count;
    });
    return {
      opsArea,
      hub: `HUB ${hub === "Pernes" ? "France: Pernes Les Fontaines" : hub === "Czechia" ? "Czech: Cesky Krumlov" : "Italy: San Giovanni Valdarno"}`,
      counts,
      grandTotal
    };
  });
};

// Generate mock detail data for an OPS Area
const generateDetailData = (hub: string, opsArea: string): UnitDetail[] => {
  const hubFullName = hub === "Pernes" ? "HUB France: Pernes Les Fontaines" 
    : hub === "Czechia" ? "HUB Czech: Cesky Krumlov" 
    : "HUB Italy: San Giovanni Valdarno";
  
  const unitCount = Math.floor(Math.random() * 5) + 1;
  return Array.from({ length: unitCount }, (_, i) => ({
    hub: hubFullName,
    opsArea,
    opxFlo: "",
    unit: `${opsArea.replace(/[:\s]/g, "_")}_U00${i + 1}_`,
    loadDate: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/2026`,
    loader: "",
    unitType: ["M", "B", "W", "Ship"][Math.floor(Math.random() * 4)],
    main: Math.floor(Math.random() * 2),
    support: Math.floor(Math.random() * 2),
    extra: 0,
    noVan: 0,
    vanNumber: "",
    trailerNumber: "",
    family: "",
    comment: ""
  }));
};

export default function UnitLoads() {
  const [selectedHub, setSelectedHub] = useState<string>("Pernes");
  const [selectedOpsArea, setSelectedOpsArea] = useState<string>("");
  const [summaryData, setSummaryData] = useState<UnitSummary[]>(() => generateSummaryData("Pernes"));
  const [detailData, setDetailData] = useState<UnitDetail[]>([]);

  const handleHubChange = (hub: string) => {
    setSelectedHub(hub);
    setSelectedOpsArea("");
    setDetailData([]);
    setSummaryData(generateSummaryData(hub));
  };

  const handleOpsAreaChange = (opsArea: string) => {
    setSelectedOpsArea(opsArea);
    if (opsArea) {
      setDetailData(generateDetailData(selectedHub, opsArea));
    } else {
      setDetailData([]);
    }
  };

  const currentOpsAreas = HUB_OPS_AREAS[selectedHub] || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unit Loads</h1>
          <p className="text-muted-foreground">Live unit load assignment and logistics overview by Hub</p>
        </div>
        <Badge variant="outline">Live Data</Badge>
      </div>

      {/* Hub Tabs */}
      <Tabs value={selectedHub} onValueChange={handleHubChange}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="Czechia">HUB Czech: Cesky Krumlov</TabsTrigger>
          <TabsTrigger value="Pernes">HUB France: Pernes</TabsTrigger>
          <TabsTrigger value="Tuscany">HUB Italy: San Giovanni</TabsTrigger>
        </TabsList>

        {["Czechia", "Pernes", "Tuscany"].map(hub => (
          <TabsContent key={hub} value={hub} className="space-y-6">
            {/* OPS Area Selector */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select OPS Area</label>
                  <Select value={selectedOpsArea} onValueChange={handleOpsAreaChange}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="All OPS Areas (Summary View)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="">All OPS Areas (Summary View)</SelectItem>
                      {currentOpsAreas.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Summary Table (when no OPS Area selected) */}
            {!selectedOpsArea && (
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="w-full">
                    <div className="min-w-[800px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary/10">
                            <TableHead className="font-bold text-foreground">Ops Area</TableHead>
                            <TableHead className="font-bold text-foreground">Hub</TableHead>
                            {UNIT_TYPES.map(type => (
                              <TableHead key={type} className="font-bold text-foreground text-center">{type}</TableHead>
                            ))}
                            <TableHead className="font-bold text-foreground text-center">Grand Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summaryData.map((row, index) => (
                            <TableRow key={index} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{row.opsArea}</TableCell>
                              <TableCell>{row.hub}</TableCell>
                              {UNIT_TYPES.map(type => (
                                <TableCell key={type} className="text-center">
                                  {row.counts[type] || ""}
                                </TableCell>
                              ))}
                              <TableCell className="text-center font-bold">{row.grandTotal}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Detail Table (when OPS Area selected) */}
            {selectedOpsArea && (
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="w-full">
                    <div className="min-w-[1400px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-primary/10">
                            <TableHead className="font-bold text-foreground">Hub</TableHead>
                            <TableHead className="font-bold text-foreground">Ops Area</TableHead>
                            <TableHead className="font-bold text-foreground">OpX/FLO</TableHead>
                            <TableHead className="font-bold text-foreground">Unit</TableHead>
                            <TableHead className="font-bold text-foreground">Load Date</TableHead>
                            <TableHead className="font-bold text-foreground">Loader</TableHead>
                            <TableHead className="font-bold text-foreground">Unit Type</TableHead>
                            <TableHead className="font-bold text-foreground text-center">Main</TableHead>
                            <TableHead className="font-bold text-foreground text-center">Support</TableHead>
                            <TableHead className="font-bold text-foreground text-center">Extra</TableHead>
                            <TableHead className="font-bold text-foreground text-center">No Van</TableHead>
                            <TableHead className="font-bold text-foreground">Van #</TableHead>
                            <TableHead className="font-bold text-foreground">Trailer #</TableHead>
                            <TableHead className="font-bold text-foreground">Family</TableHead>
                            <TableHead className="font-bold text-foreground">Comment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailData.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                                No units found for this OPS Area
                              </TableCell>
                            </TableRow>
                          ) : (
                            detailData.map((row, index) => (
                              <TableRow key={index} className="hover:bg-muted/50">
                                <TableCell>{row.hub}</TableCell>
                                <TableCell>{row.opsArea}</TableCell>
                                <TableCell>{row.opxFlo}</TableCell>
                                <TableCell className="font-medium">{row.unit}</TableCell>
                                <TableCell>{row.loadDate}</TableCell>
                                <TableCell>{row.loader}</TableCell>
                                <TableCell>{row.unitType}</TableCell>
                                <TableCell className="text-center">{row.main || ""}</TableCell>
                                <TableCell className="text-center">{row.support || ""}</TableCell>
                                <TableCell className="text-center">{row.extra || ""}</TableCell>
                                <TableCell className="text-center">{row.noVan || ""}</TableCell>
                                <TableCell>{row.vanNumber}</TableCell>
                                <TableCell>{row.trailerNumber}</TableCell>
                                <TableCell>{row.family}</TableCell>
                                <TableCell>{row.comment}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
