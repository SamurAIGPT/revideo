"use client";

import React, { useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("next") || "/";

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-6 text-zinc-950 select-none">
      <div className="relative bg-white border border-zinc-200/80 w-full max-w-md rounded-3xl p-8 space-y-6 shadow-xl animate-fade-in">
        {/* Revid.ai Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center shadow-lg border border-zinc-800">
            <div className="w-4 h-4 rounded-full bg-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-950">
              Sign In to Revid.ai Studio
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
              Sign in with Google to enable AI script generation, project persistence, and real-time credit management.
            </p>
          </div>
        </div>

        {/* Google Sign In Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full py-3.5 px-4 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 hover:border-zinc-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-3 shadow-sm hover:shadow transition active:scale-[0.98] cursor-pointer"
          >
            {/* Google G icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm">Continue with Google</span>
          </button>
        </div>

        {/* Benefits Box */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>What you unlock:</span>
          </div>
          <ul className="text-[11px] text-zinc-600 space-y-1 pl-5 list-disc">
            <li>50 Free Starter Credits for AI script generation</li>
            <li>Supabase PostgreSQL table persistence for all projects</li>
            <li>Seamless video repurpose, remixing, and export</li>
          </ul>
        </div>

        {/* Security Assurance */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>OAuth 2.0 Secure Authentication with PostgreSQL</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
