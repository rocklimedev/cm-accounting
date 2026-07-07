import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Wait until AuthContext finishes restoring the session before deciding to redirect.
  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [authLoading, user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Login failed. Check your credentials.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const DEMO = {
    "superadmin@chhabramarble.com": "Super@123",
    "admin@chhabramarble.com": "Admin@123",
    "accountant@chhabramarble.com": "Account@123",
  };
  const quickFill = (em) => {
    setEmail(em);
    setPassword(DEMO[em] || "");
  };

  // Avoid flashing the login form while session restore is in progress.
  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 bg-primary flex items-center justify-center rounded-sm">
            <span className="text-primary-foreground font-black">C</span>
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">
              Chhabra Marble
            </div>
            <div className="text-xs text-foreground/60">Accounting Module</div>
          </div>
        </div>
        <Card className="border border-border rounded-md p-6 bg-card shadow-none">
          <h1 className="text-xl font-bold">Sign in</h1>
          <p className="text-sm text-foreground/60 mb-5">
            Access your accounting dashboard
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            {error && (
              <div
                className="text-xs text-primary"
                data-testid="login-error-text"
              >
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              data-testid="login-submit-button"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
