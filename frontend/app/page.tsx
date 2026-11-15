import { SlotBrowser } from "@/components/slot-browser";

export default function HomePage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Book an appointment</h1>
        <p className="text-muted-foreground">Pick a time that works for you. It takes under a minute.</p>
      </div>
      <SlotBrowser />
    </div>
  );
}
