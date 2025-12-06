import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/supabase/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Check, X, Loader2, Download, Trash2 } from "lucide-react";

interface OPXInvite {
  email: string;
  opsAreas: string[];
}

interface InviteResult {
  email: string;
  success: boolean;
  error?: string;
}

interface ParsedRow {
  email: string;
  opsAreas: string[];
  valid: boolean;
  error?: string;
}

const BulkOPXOnboarding = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [results, setResults] = useState<InviteResult[]>([]);

  // Fetch available OPS Areas for validation
  const { data: opsAreas = [] } = useQuery({
    queryKey: ['ops-areas-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_area_to_hub')
        .select('ops_area')
        .order('ops_area');
      
      if (error) throw error;
      return [...new Set(data.map(r => r.ops_area))];
    }
  });

  // Bulk invite mutation
  const bulkInviteMutation = useMutation({
    mutationFn: async (invites: OPXInvite[]) => {
      const { data, error } = await supabase.functions.invoke('bulk-invite-opx', {
        body: { invites }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResults(data.results);
      toast({
        title: "Bulk Onboarding Complete",
        description: `${data.successCount} successful, ${data.failCount} failed`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Onboarding Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const parseCSV = useCallback((content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const parsed: ParsedRow[] = [];

    // Skip header if present
    const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma, handling quoted values
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      const email = parts[0];
      const opsAreasRaw = parts.slice(1).filter(a => a.length > 0);

      // Validate email
      if (!validateEmail(email)) {
        parsed.push({
          email,
          opsAreas: opsAreasRaw,
          valid: false,
          error: "Invalid email format"
        });
        continue;
      }

      // Validate OPS Areas
      const invalidAreas = opsAreasRaw.filter(area => !opsAreas.includes(area));
      if (invalidAreas.length > 0) {
        parsed.push({
          email,
          opsAreas: opsAreasRaw,
          valid: false,
          error: `Unknown OPS Area(s): ${invalidAreas.join(', ')}`
        });
        continue;
      }

      if (opsAreasRaw.length === 0) {
        parsed.push({
          email,
          opsAreas: [],
          valid: false,
          error: "At least one OPS Area required"
        });
        continue;
      }

      parsed.push({
        email,
        opsAreas: opsAreasRaw,
        valid: true
      });
    }

    return parsed;
  }, [opsAreas]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResults([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      setParsedData(parsed);
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    const validInvites = parsedData
      .filter(row => row.valid)
      .map(row => ({ email: row.email, opsAreas: row.opsAreas }));

    if (validInvites.length === 0) {
      toast({
        title: "No Valid Entries",
        description: "Please fix the errors in your CSV file",
        variant: "destructive",
      });
      return;
    }

    bulkInviteMutation.mutate(validInvites);
  };

  const handleClear = () => {
    setParsedData([]);
    setFileName("");
    setResults([]);
  };

  const downloadTemplate = () => {
    const templateContent = `email,ops_area_1,ops_area_2
john.doe@backroads.com,Tuscany,Croatia
jane.smith@backroads.com,Czech & Austria
`;
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opx_onboarding_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Redirect non-admins
  if (!authLoading && !isAdmin) {
    navigate('/');
    return null;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const validCount = parsedData.filter(r => r.valid).length;
  const invalidCount = parsedData.filter(r => !r.valid).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bulk OPX Onboarding</h1>
        <p className="text-muted-foreground mt-1">
          Upload a CSV to invite multiple OPX users and assign them to OPS Areas
        </p>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSV Format</CardTitle>
          <CardDescription>
            Upload a CSV file with email and OPS Area assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm">
            <p className="text-muted-foreground mb-2"># Format: email, ops_area_1, ops_area_2, ...</p>
            <p>john.doe@backroads.com, Tuscany, Croatia</p>
            <p>jane.smith@backroads.com, Czech & Austria</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Available OPS Areas:</p>
            <div className="flex flex-wrap gap-1">
              {opsAreas.map(area => (
                <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {fileName || "Click to upload CSV file"}
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Preview ({parsedData.length} rows)
                </CardTitle>
                <CardDescription>
                  <span className="text-green-600">{validCount} valid</span>
                  {invalidCount > 0 && (
                    <span className="text-destructive ml-2">{invalidCount} invalid</span>
                  )}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>OPS Areas</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, idx) => (
                    <TableRow key={idx} className={row.valid ? "" : "bg-destructive/5"}>
                      <TableCell>
                        {row.valid ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.opsAreas.map((area, i) => (
                            <Badge 
                              key={i} 
                              variant={opsAreas.includes(area) ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.error || (
                          results.find(r => r.email === row.email)?.success === false 
                            ? results.find(r => r.email === row.email)?.error 
                            : results.find(r => r.email === row.email)?.success === true 
                              ? "✓ Invited" 
                              : ""
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <Button
                onClick={handleSubmit}
                disabled={validCount === 0 || bulkInviteMutation.isPending}
              >
                {bulkInviteMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Invite {validCount} OPX Users
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    result.success ? 'bg-green-50 text-green-800' : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {result.success ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span className="font-mono">{result.email}</span>
                  {result.error && <span className="text-xs">- {result.error}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkOPXOnboarding;
