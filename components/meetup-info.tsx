import { Card } from "@/components/ui/card";
import { MapPin, Buildings } from "@phosphor-icons/react/dist/ssr";

const suggestedSpots = [
  "Library",
  "Canteen",
  "Main Building Lobby",
];

export function MeetupInfo() {
  return (
    <Card className="bg-accent/50 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <MapPin className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground">
            Meetups arranged on PSU Campus only
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            For your safety, all transactions should be done within the campus.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedSpots.map((spot) => (
              <div
                key={spot}
                className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-sm text-muted-foreground"
              >
                <Buildings className="size-3.5" />
                {spot}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
