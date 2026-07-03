import { redirect } from "next/navigation";

// ============================================
// Queue Page — Redirects to booking flow
// ============================================

export default function QueuePage() {
  redirect("/book/select-service");
}
