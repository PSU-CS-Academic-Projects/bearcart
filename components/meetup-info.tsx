import { Card } from "@/components/ui/card";
import { MapPin, Buildings } from "@phosphor-icons/react/dist/ssr";

const suggestedSpots = [
  "Library",
  "Canteen",
  "Main Building Lobby",
];

export function MeetupInfo() {
  return (
    <Card className="bg-accent/50 p-3">
      <div className="flex items-start gap-2.5">
        <div className="rounded-full bg-primary/10 p-1.5">
          <MapPin className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground">
            Meetups arranged on PSU Campus only
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            For your safety, all transactions should be done within the campus.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestedSpots.map((spot) => (
              <div
                key={spot}
                className="flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground"
              >
                <Buildings className="size-3" />
                {spot}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
