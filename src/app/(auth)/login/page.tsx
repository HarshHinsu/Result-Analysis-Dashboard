"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  User,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage("Please enter your username or email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    startTransition(async () => {
      const res = await loginAction({ username, password });
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <Card className="border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-slate-100">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold text-white">Sign In to Your Account</CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Access the result analysis portal for administrators and faculty.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="bg-rose-950/50 border-rose-800 text-rose-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-xs font-semibold">Authentication Failed</AlertTitle>
            <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Username or Email</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="e.g. admin or faculty"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                disabled={isPending}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                disabled={isPending}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 h-10"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col border-t border-slate-800/80 pt-4 gap-3 bg-slate-950/40">
        <div className="w-full text-center">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Demo Quick Fill Accounts
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickFill("admin", "admin123")}
            className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 hover:text-white text-xs h-9 justify-start"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-indigo-400 shrink-0" />
            <div className="flex flex-col items-start text-left">
              <span className="font-semibold leading-tight">Admin Demo</span>
              <span className="text-[9px] text-slate-400">admin / admin123</span>
            </div>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickFill("faculty", "faculty123")}
            className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 hover:text-white text-xs h-9 justify-start"
          >
            <UserCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-400 shrink-0" />
            <div className="flex flex-col items-start text-left">
              <span className="font-semibold leading-tight">Faculty Demo</span>
              <span className="text-[9px] text-slate-400">faculty / faculty123</span>
            </div>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/20 text-white mb-2 ring-4 ring-indigo-500/20">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Result Analysis Dashboard
          </h1>
          <p className="text-sm text-slate-300">
            Diploma Engineering Academic Management & Analysis
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm animate-pulse">
              Loading authentication form...
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400">
          <p>Local Academic Demo Environment &bull; GTU Affiliated</p>
        </div>
      </div>
    </div>
  );
}
