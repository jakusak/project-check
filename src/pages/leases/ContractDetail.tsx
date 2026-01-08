import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tantml:invoke>
<invoke name="supabase">
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Download,
} from "lucide-react";
import { format } from "date-fns";

type ContractState =
  | "draft"
  | "uploaded"
  | "generated"
  | "ai_assessed"
  | "review_required"
  | "blocked"
  | "approved"
  | "sent_to_docusign"
  | "signed"
  | "archived";

interface Contract {
  id: string;
  contract_number: string;
  contract_type: string;
  country: string;
  state: ContractState;
  duration_months: number;
  seasonality: string;
  property_reference?: string;
  document_url?: string;
  document_filename?: string;
  blocked_reason?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  signed_at?: string;
}

interface Assessment {
  id: string;
  assessment_type: string;
  status: "ok" | "risk" | "missing";
  explanation: string;
  suggested_language?: string;
  created_at: string;
}

const getStateBadgeVariant = (state: ContractState) => {
  switch (state) {
    case "draft":
      return "secondary";
    case "blocked":
      return "destructive";
    case "approved":
    case "signed":
      return "default";
    case "review_required":
      return "outline";
    default:
      return "secondary";
  }
};

const formatState = (state: ContractState) => {
  return state
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch contract details
  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Contract;
    },
  });

  // Fetch AI assessments
  const { data: assessments } = useQuery({
    queryKey: ["contract-assessments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_assessments")
        .select("*")
        .eq("contract_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Assessment[];
    },
    enabled: !!id,
  });

  // Fetch contract reviews
  const { data: reviews } = useQuery({
    queryKey: ["contract-reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_reviews")
        .select("*, reviewer:reviewer_id(*)")
        .eq("contract_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Request AI assessment mutation
  const requestAssessmentMutation = useMutation({
    mutationFn: async () => {
      // Mock AI assessment - in production this would call an AI service
      const mockAssessments = [
        {
          contract_id: id,
          assessment_type: "termination_clause",
          status: "ok" as const,
          explanation: "Termination clause is present and clear",
          ai_model: "mock-ai-v1",
          ai_confidence: 0.95,
        },
        {
          contract_id: id,
          assessment_type: "tax_responsibility",
          status: "risk" as const,
          explanation: "Tax responsibility clause is ambiguous",
          suggested_language:
            "All local taxes and duties shall be borne by the Lessee",
          ai_model: "mock-ai-v1",
          ai_confidence: 0.87,
        },
        {
          contract_id: id,
          assessment_type: "utility_payments",
          status: "missing" as const,
          explanation: "Utility payment responsibility not specified",
          suggested_language:
            "The Lessee shall be responsible for all utility payments including electricity, water, gas, and internet",
          ai_model: "mock-ai-v1",
          ai_confidence: 0.92,
        },
      ];

      // Insert mock assessments
      const { error: assessmentError } = await supabase
        .from("contract_assessments")
        .insert(mockAssessments);

      if (assessmentError) throw assessmentError;

      // Update contract state
      const { error: updateError } = await supabase
        .from("contracts")
        .update({ state: "ai_assessed" })
        .eq("id", id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("AI assessment completed");
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      queryClient.invalidateQueries({ queryKey: ["contract-assessments", id] });
    },
    onError: (error: Error) => {
      toast.error(`Assessment failed: ${error.message}`);
    },
  });

  // Submit for review mutation
  const submitForReviewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("contracts")
        .update({ state: "review_required" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contract submitted for review");
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit: ${error.message}`);
    },
  });

  // Send to DocuSign mutation (mock)
  const sendToDocuSignMutation = useMutation({
    mutationFn: async () => {
      // Mock DocuSign integration
      const mockEnvelopeId = `env_${Date.now()}`;

      const { error: envelopeError } = await supabase
        .from("docusign_envelopes")
        .insert({
          contract_id: id,
          envelope_id: mockEnvelopeId,
          status: "sent",
          signer_email: "signer@example.com",
          signer_name: "Contract Signer",
        });

      if (envelopeError) throw envelopeError;

      const { error: updateError } = await supabase
        .from("contracts")
        .update({ state: "sent_to_docusign" })
        .eq("id", id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Contract sent to DocuSign");
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading contract...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contract not found</AlertTitle>
          <AlertDescription>
            The contract you're looking for doesn't exist or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const okAssessments = assessments?.filter((a) => a.status === "ok") || [];
  const riskAssessments = assessments?.filter((a) => a.status === "risk") || [];
  const missingAssessments = assessments?.filter((a) => a.status === "missing") || [];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/leases/contracts")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{contract.contract_number}</h1>
              <Badge variant={getStateBadgeVariant(contract.state)}>
                {formatState(contract.state)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {contract.contract_type.charAt(0).toUpperCase() + contract.contract_type.slice(1)} • {contract.country} • {contract.duration_months} months
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {contract.document_url && (
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Blocked Alert */}
      {contract.state === "blocked" && contract.blocked_reason && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contract Blocked</AlertTitle>
          <AlertDescription>{contract.blocked_reason}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="assessment">
                AI Assessment
                {assessments && assessments.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {assessments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews
                {reviews && reviews.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {reviews.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contract Number</p>
                      <p className="text-sm">{contract.contract_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Type</p>
                      <p className="text-sm capitalize">{contract.contract_type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Country</p>
                      <p className="text-sm">{contract.country}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duration</p>
                      <p className="text-sm">{contract.duration_months} months</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Seasonality</p>
                      <p className="text-sm capitalize">{contract.seasonality.replace("_", " ")}</p>
                    </div>
                    {contract.property_reference && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Property Reference</p>
                        <p className="text-sm">{contract.property_reference}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created</p>
                      <p className="text-sm">{format(new Date(contract.created_at), "PPP")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                      <p className="text-sm">{format(new Date(contract.updated_at), "PPP")}</p>
                    </div>
                    {contract.approved_at && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Approved</p>
                        <p className="text-sm">{format(new Date(contract.approved_at), "PPP")}</p>
                      </div>
                    )}
                    {contract.signed_at && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Signed</p>
                        <p className="text-sm">{format(new Date(contract.signed_at), "PPP")}</p>
                      </div>
                    )}
                  </div>

                  {contract.document_filename && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Document</p>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{contract.document_filename}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Assessment Tab */}
            <TabsContent value="assessment">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>AI Assessment Results</CardTitle>
                      <CardDescription>
                        Automated contract analysis and recommendations
                      </CardDescription>
                    </div>
                    {(contract.state === "uploaded" || contract.state === "draft") && (
                      <Button
                        size="sm"
                        onClick={() => requestAssessmentMutation.mutate()}
                        disabled={requestAssessmentMutation.isPending}
                      >
                        {requestAssessmentMutation.isPending ? "Analyzing..." : "Run Assessment"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!assessments || assessments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No AI assessment has been performed yet.</p>
                      {(contract.state === "uploaded" || contract.state === "draft") && (
                        <p className="text-sm mt-2">Click "Run Assessment" to analyze this contract.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <p className="text-sm font-medium">Passed</p>
                          </div>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {okAssessments.length}
                          </p>
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <p className="text-sm font-medium">Risks</p>
                          </div>
                          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {riskAssessments.length}
                          </p>
                        </div>
                        <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <p className="text-sm font-medium">Missing</p>
                          </div>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {missingAssessments.length}
                          </p>
                        </div>
                      </div>

                      {/* Detailed Results */}
                      <div className="space-y-3">
                        {assessments.map((assessment) => (
                          <div
                            key={assessment.id}
                            className={`p-4 rounded-lg border ${
                              assessment.status === "ok"
                                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                                : assessment.status === "risk"
                                ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
                                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {assessment.status === "ok" ? (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                              ) : (
                                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                                  assessment.status === "risk"
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-red-600 dark:text-red-400"
                                }`} />
                              )}
                              <div className="flex-1">
                                <p className="font-medium capitalize mb-1">
                                  {assessment.assessment_type.replace(/_/g, " ")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {assessment.explanation}
                                </p>
                                {assessment.suggested_language && (
                                  <div className="mt-2 p-3 bg-background rounded border">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      Suggested Language:
                                    </p>
                                    <p className="text-sm">{assessment.suggested_language}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Review History</CardTitle>
                  <CardDescription>
                    All reviews and approvals for this contract
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!reviews || reviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No reviews yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <div key={review.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">
                                {review.reviewer?.full_name || "Reviewer"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(review.created_at), "PPP 'at' p")}
                              </p>
                            </div>
                            <Badge
                              variant={
                                review.decision === "approved"
                                  ? "default"
                                  : review.decision === "rejected"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {review.decision}
                            </Badge>
                          </div>
                          {review.comments && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {review.comments}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contract.state === "ai_assessed" && (
                <Button
                  className="w-full"
                  onClick={() => submitForReviewMutation.mutate()}
                  disabled={submitForReviewMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Review
                </Button>
              )}

              {contract.state === "approved" && (
                <Button
                  className="w-full"
                  onClick={() => sendToDocuSignMutation.mutate()}
                  disabled={sendToDocuSignMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to DocuSign
                </Button>
              )}

              {contract.state === "draft" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/leases/contracts/${id}/edit`)}
                >
                  Edit Contract
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Workflow Status */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      contract.state !== "draft" ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(contract.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      contract.state === "ai_assessed" ||
                      contract.state === "review_required" ||
                      contract.state === "approved" ||
                      contract.state === "sent_to_docusign" ||
                      contract.state === "signed"
                        ? "bg-green-500"
                        : "bg-muted"
                    }`}
                  />
                  <div>
                    <p className="font-medium">AI Assessed</p>
                    {assessments && assessments.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(assessments[0].created_at), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      contract.state === "approved" ||
                      contract.state === "sent_to_docusign" ||
                      contract.state === "signed"
                        ? "bg-green-500"
                        : contract.state === "review_required"
                        ? "bg-yellow-500"
                        : "bg-muted"
                    }`}
                  />
                  <div>
                    <p className="font-medium">Reviewed & Approved</p>
                    {contract.approved_at && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(contract.approved_at), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      contract.state === "signed" ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                  <div>
                    <p className="font-medium">Signed</p>
                    {contract.signed_at && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(contract.signed_at), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
