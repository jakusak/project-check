import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ScheduleRecord {
  [key: string]: string | number;
}

const REGIONS = ["US", "CAN", "LAPPA", "EUROPE"] as const;
type Region = typeof REGIONS[number];

export default function UnitSchedule() {
  const [selectedRegion, setSelectedRegion] = useState<Region>("US");
  const [data, setData] = useState<ScheduleRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      toast.error("CSV file must have headers and at least one data row");
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const records: ScheduleRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length === headers.length) {
        const record: ScheduleRecord = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        records.push(record);
      }
    }

    setColumns(headers);
    setData(records);
    toast.success(`Loaded ${records.length} records for ${selectedRegion}`);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [selectedRegion]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearData = () => {
    setData([]);
    setColumns([]);
    setFileName(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unit Schedule</h1>
          <p className="text-muted-foreground">View and manage unit schedules by region</p>
        </div>
        <Badge variant="outline">CSV Import</Badge>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedRegion} onValueChange={(v) => setSelectedRegion(v as Region)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {fileName && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{fileName}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={clearData}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-lg transition-colors cursor-pointer
                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              `}
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <Upload className={`h-12 w-12 mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-lg font-medium mb-1">Drop CSV file here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Badge variant="secondary">{selectedRegion} Region</Badge>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{selectedRegion} Unit Schedule</CardTitle>
            <CardDescription>{data.length} records loaded from {fileName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col} className="whitespace-nowrap">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((record, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={col} className="whitespace-nowrap">
                          {record[col]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
