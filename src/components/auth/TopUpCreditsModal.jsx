"use client";

import React, { useState } from "react";
import { X, Sparkles, Check, Zap, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function TopUpCreditsModal({ isOpen, onClose }) {
  const { credits, topUpCredits } = useAuth();
  const [loadingPack, setLoadingPack] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen) return null;

  const creditPacks = [
    {
      id: "basic",
      name: "Starter Pack",
      credits: 100,
      price: "$5",
      badge: null,
      desc: "Perfect for testing viral hooks and remixing shorts.",
      popular: false,
    },
    {
      id: "creator",
      name: "Creator Pack",
      credits: 250,
      price: "$10",
      badge: "Popular",
      desc: "Ideal for active creators publishing daily shorts.",
      popular: true,
    },
    {
      id: "pro",
      name: "Pro Studio Pack",
      credits: 600,
      price: "$20",
      badge: "Best Value",
      desc: "Designed for power users demanding batch remixes and exports.",
      popular: false,
    },
    {
      id: "business",
      name: "Agency Pack",
      credits: 2000,
      price: "$50",
      badge: "Enterprise",
      desc: "Maximum volume pack for multiple channels and high-res renders.",
      popular: false,
    },
  ];

  const handleSelectPack = async (pack) => {
    setLoadingPack(pack.id);
    setSuccessMessage(null);
    try {
      await topUpCredits(pack.credits, pack.name);
      setSuccessMessage(`Successfully added +${pack.credits} credits to your account!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      alert(`Top-up failed: ${err.message}`);
    } finally {
      setLoadingPack(null);
    }
  };

  const handleFreeTopUp = async () => {
    setLoadingPack("free");
    try {
      await topUpCredits(50, "Test Bonus");
      setSuccessMessage("Added +50 bonus credits!");
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-zinc-200 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Instant Credit Top-Up</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Recharge Your Studio Credits
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Every AI script generation and high-res video remix uses credits. Current balance:{" "}
            <span className="font-mono font-bold text-emerald-600">
              {credits.toLocaleString()} credits
            </span>
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Credit Packs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {creditPacks.map((pack) => {
            const isLoading = loadingPack === pack.id;

            return (
              <div
                key={pack.id}
                onClick={() => !isLoading && handleSelectPack(pack)}
                className={`group relative rounded-2xl p-4 border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                  pack.popular
                    ? "bg-zinc-950 text-white border-zinc-950 shadow-md ring-2 ring-emerald-500/50"
                    : "bg-zinc-50/70 hover:bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-emerald-500 transition">
                    {pack.name}
                  </span>
                  {pack.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pack.popular
                          ? "bg-emerald-500 text-white"
                          : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {pack.badge}
                    </span>
                  )}
                </div>

                {/* Amount & Price */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono">
                      {pack.credits.toLocaleString()}
                    </span>
                    <span
                      className={`text-xs ${
                        pack.popular ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      credits
                    </span>
                  </div>
                  <p
                    className={`text-[11px] leading-snug mt-1 ${
                      pack.popular ? "text-zinc-400" : "text-zinc-500"
                    }`}
                  >
                    {pack.desc}
                  </p>
                </div>

                {/* Button */}
                <button
                  disabled={isLoading}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    pack.popular
                      ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg"
                      : "bg-white group-hover:bg-zinc-950 group-hover:text-white text-zinc-900 border border-zinc-200"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recharging...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Get for {pack.price}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Free Sandbox Top-Up Option */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs">
          <div className="flex items-center gap-2 text-zinc-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Developer Sandbox / Creator Testing Mode</span>
          </div>
          <button
            onClick={handleFreeTopUp}
            disabled={loadingPack === "free"}
            className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl font-bold text-xs transition"
          >
            {loadingPack === "free" ? "Adding..." : "+50 Test Credits"}
          </button>
        </div>
      </div>
    </div>
  );
}
