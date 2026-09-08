"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <AppLayout
      title="AI Emotional Companion"
      subtitle="A safe, reflective space to decompress, explore feelings, and build calm"
    >
      <ChatWindow />
    </AppLayout>
  );
}
