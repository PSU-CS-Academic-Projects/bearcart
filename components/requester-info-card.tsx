import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  GraduationCap,
  User,
} from "@phosphor-icons/react/dist/ssr";
import { formatTimeAgo } from "@/lib/listing-helpers";
import { getRequesterFullName } from "@/lib/request-helpers";
import type { RequestRow } from "@/lib/actions/requests";

interface RequesterInfoCardProps {
  requester: RequestRow["requester"];
}

export function RequesterInfoCard({ requester }: RequesterInfoCardProps) {
  const displayName = getRequesterFullName(requester);
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            {requester.avatar_url ? (
              <Image
                src={requester.avatar_url}
                alt={displayName}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {initials || <User className="size-6" />}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">{displayName}</h3>
            <Badge variant="secondary" className="mt-1">
              {requester.role === "student" ? "Student" : "Faculty"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 border-y py-4">
          {requester.college && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="size-4 shrink-0 text-primary" />
              <span className="truncate">{requester.college}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0 text-primary" />
            <span>Member since {formatTimeAgo(requester.created_at)}</span>
          </div>
        </div>

        <Button variant="outline" asChild className="w-full">
          <Link href={`/profile/${requester.id}`}>View Profile</Link>
        </Button>
      </div>
    </Card>
  );
}
