import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const TIMELINE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "last_6_months", label: "Last 6 Months" },
  { value: "custom", label: "Custom Date Range" },
];

export function TimelineFilter({ timeline, setTimeline, start, end, setStart, setEnd, onApply }) {
  const isCustom = timeline === "custom" || timeline === "date_to_date";
  return (
    <div className="flex flex-wrap items-end gap-2" data-testid="timeline-filter">
      <div className="w-44">
        <Select value={timeline} onValueChange={setTimeline}>
          <SelectTrigger data-testid="header-date-range-control"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMELINE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isCustom && (
        <>
          <div>
            <Input type="date" value={start || ""} onChange={(e) => setStart(e.target.value)}
              data-testid="timeline-start-date" className="h-9 w-40" />
          </div>
          <div>
            <Input type="date" value={end || ""} onChange={(e) => setEnd(e.target.value)}
              data-testid="timeline-end-date" className="h-9 w-40" />
          </div>
          <Button onClick={onApply} data-testid="timeline-apply-button" className="h-9">Apply</Button>
        </>
      )}
    </div>
  );
}
