"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/home/Sidebar";
import { HomeFeed } from "@/components/home/HomeFeed";
import { CreateModal } from "@/components/home/CreateModal";

export default function RevidHomePage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("home");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialData, setCreateInitialData] = useState(null);

  // Open the Create Modal
  const handleOpenCreate = (data = {}) => {
    setCreateInitialData(data);
    setIsCreateOpen(true);
  };

  // Remix Video Action from the Home Feed
  const handleRemixVideo = (videoCard) => {
    router.push(`/editor/new?template=${videoCard.id}`);
  };

  // Handle generation submission from the Create Modal
  const handleGenerateFromModal = async (prompt, duration) => {
    // Navigate to editor with the prompt query
    router.push(`/editor/new?prompt=${encodeURIComponent(prompt)}&duration=${duration}`);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#fbfbfb] text-zinc-900 font-sans select-none">
      {/* 1:1 Revid.ai Left Sidebar */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={(nav) => {
          setActiveNav(nav);
          if (nav === "repurpose") {
            router.push("/repurpose");
          } else if (nav === "search" || nav === "viral-search") {
            router.push("/search");
          } else if (nav === "videos") {
            router.push("/editor/new");
          }
        }}
        onOpenCreate={() => handleOpenCreate({})}
        userCredits={-10}
      />

      {/* 1:1 Revid.ai Home Feed */}
      <HomeFeed
        onOpenCreate={handleOpenCreate}
        onRemixVideo={handleRemixVideo}
        onNavigateRepurpose={() => router.push("/repurpose")}
      />

      {/* Creation Modal */}
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialData={createInitialData}
        onGenerate={handleGenerateFromModal}
      />
    </div>
  );
}
