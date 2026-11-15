const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export const formatDay = (iso: string) => dayFormat.format(new Date(iso));
export const formatTimeRange = (start: string, end: string) =>
  `${timeFormat.format(new Date(start))} – ${timeFormat.format(new Date(end))}`;
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

/** Calendar-day key in the viewer's timezone, used to group slots by day. */
export const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA");
