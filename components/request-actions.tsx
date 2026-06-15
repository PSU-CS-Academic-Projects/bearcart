"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Handshake, PencilSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

interface RequestActionsProps {
  requestId: string;
  requesterId: string;
  requesterSlug?: string;
  currentUserId: string | null;
  isAvailable: boolean;
}

export function RequestActions({
  requestId,
  requesterId,
  requesterSlug,
  currentUserId,
  isAvailable,
}: RequestActionsProps) {
  const router = useRouter();
  const isOwner = currentUserId === requesterId;

  if (isOwner) {
    return (
      <Button asChild variant="outline" className="w-full gap-2">
        <Link href={`/requests/${requestId}/edit`}>
          <PencilSimple className="size-4" />
          Edit Request
        </Link>
      </Button>
    );
  }

  if (!isAvailable) {
    return (
      <Button disabled className="w-full">
        Request Closed
      </Button>
    );
  }

  const handleClick = () => {
    if (!currentUserId) {
      router.push(`/auth/login?returnTo=/requests/${requestId}`);
      return;
    }
    toast.info("Visit the requester's profile to start a conversation");
    router.push(`/profile/${requesterSlug ?? requesterId}`);
  };

  return (
    <Button onClick={handleClick} className="w-full gap-2">
      <Handshake className="size-4" />
      I Have This
    </Button>
  );
}
