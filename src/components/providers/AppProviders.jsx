"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { TopUpCreditsModal } from "@/components/auth/TopUpCreditsModal";

function GlobalModals() {
  const { isLoginModalOpen, setIsLoginModalOpen, isTopUpOpen, setIsTopUpOpen } = useAuth();

  return (
    <>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <TopUpCreditsModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
      />
    </>
  );
}

export function AppProviders({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
        <GlobalModals />
      </AuthProvider>
    </SessionProvider>
  );
}
