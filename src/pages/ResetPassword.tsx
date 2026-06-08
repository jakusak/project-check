import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import backroadsLogo from "@/assets/backroads-logo.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const hashParams = useMemo(() => new URLSearchParams(window.location.hash.replace(/^#/, "")), []);
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);

  useEffect(() => {
    const urlError = hashParams.get("error_description") || queryParams.get("error_description");

    if (urlError) {
      setLinkError(urlError.replace(/\+/g, " "));
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(Boolean(data.session));
      if (!data.session) {
        setLinkError("This password reset link is expired or invalid. Please request a new reset link.");
      }
    });
  }, [hashParams, queryParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please enter the same password in both fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password updated",
      description: "Taking you to the dashboard now.",
    });
    navigate("/analytics/ops", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={backroadsLogo} alt="Backroads" className="h-10 w-auto" />
            <CardTitle className="text-xl">Set New Password</CardTitle>
          </div>
          <CardDescription>
            {linkError ? "Request a new reset link to continue" : "Choose a new password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkError ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">{linkError}</p>
              <Button className="w-full" onClick={() => navigate("/auth", { replace: true })}>
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  disabled={!sessionReady || loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                  disabled={!sessionReady || loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={!sessionReady || loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}