"use client";

import React, { useState } from "react";
import { X, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LoginModal({ isOpen, onClose }) {
  const { loginWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      // Redirect handled by NextAuth
    } catch (err) {
      setErrorMessage(err.message || "Failed to initiate Google sign in. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo and Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center shadow-lg border border-zinc-800">
            <div className="w-4 h-4 rounded-full bg-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">
              Sign In to Revid.ai Studio
            </h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Authenticate securely with Google to access viral script remixing, sync video projects, and manage credits.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 hover:border-zinc-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-3 shadow-sm hover:shadow transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                {/* Official Google 'G' icon */}
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
              </>
            )}
          </button>
        </div>

        {/* Benefits badge */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Included with your creator account:</span>
          </div>
          <ul className="text-[11px] text-zinc-600 space-y-1 pl-5 list-disc">
            <li>50 Free Starter Credits for AI script generation</li>
            <li>Cloud saving for all video projects & renders</li>
            <li>Instant sync between studio, search, and repurpose</li>
          </ul>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>OAuth 2.0 Secure Authentication with PostgreSQL</span>
        </div>
      </div>
    </div>
  );
}
