import type { CalendarSpec } from "../specs/page/index.js";
import type { RenderContext } from "./types.js";
import { esc } from "./types.js";

// ── Calendar block ───────────────────────────────────────────
// Monthly grid. 7 columns (Mon–Sun). Each day is a link cell.
// Filled days show an accent dot. Today gets an accent ring.
// Empty future days are muted and unclickable.

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate(); // month is 1-indexed, Date uses 0-indexed next-month
}

/** Monday=0, Sunday=6. */
function dayOfWeekMondayFirst(year: number, month: number, day: number): number {
  const d = new Date(year, month - 1, day).getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

function prevMonth(year: number, month: number): string {
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${pad2(month - 1)}`;
}

function nextMonth(year: number, month: number): string {
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${pad2(month + 1)}`;
}

function prevMonthLabel(year: number, month: number): string {
  if (month === 1) return `← ${MONTH_SHORT[11]}`;
  return `← ${MONTH_SHORT[month - 2]}`;
}

function nextMonthLabel(year: number, month: number): string {
  if (month === 12) return `${MONTH_SHORT[0]} →`;
  return `${MONTH_SHORT[month]} →`;
}

export function renderCalendar(spec: CalendarSpec, _ctx: RenderContext): string {
  const { year, month, today } = spec;
  const linkPattern = spec.linkPattern ?? "/diary/{date}";
  const monthPattern = spec.monthPattern ?? "/?month={month}";
  const entriesSet = new Set(spec.entries);

  const numDays = daysInMonth(year, month);
  const firstDow = dayOfWeekMondayFirst(year, month, 1);

  const parts: string[] = [];
  parts.push(`<div class="gb-calendar" data-month="${year}-${pad2(month)}">`);

  // ── Month navigation header ────────────────────────────
  const prevHref = monthPattern.replace("{month}", prevMonth(year, month));
  const nextHref = monthPattern.replace("{month}", nextMonth(year, month));

  parts.push(`<div class="gb-calendar-header">`);
  parts.push(`  <a class="gb-calendar-nav gb-calendar-prev" href="${esc(prevHref)}">${prevMonthLabel(year, month)}</a>`);
  parts.push(`  <div class="gb-calendar-title">${MONTH_NAMES[month - 1]} ${year}</div>`);
  parts.push(`  <a class="gb-calendar-nav gb-calendar-next" href="${esc(nextHref)}">${nextMonthLabel(year, month)}</a>`);
  parts.push(`</div>`);

  // ── Grid ───────────────────────────────────────────────
  parts.push(`<div class="gb-calendar-grid">`);

  // Day-of-week headers
  for (const dow of DOW) {
    parts.push(`<div class="gb-calendar-dow">${dow}</div>`);
  }

  // Leading empty cells
  for (let i = 0; i < firstDow; i++) {
    parts.push(`<div class="gb-calendar-day gb-calendar-pad"></div>`);
  }

  // Day cells
  for (let d = 1; d <= numDays; d++) {
    const dateStr = `${year}-${pad2(month)}-${pad2(d)}`;
    const isFilled = entriesSet.has(dateStr);
    const isToday = dateStr === today;
    const isFuture = today ? dateStr > today : false;

    const classes = ["gb-calendar-day"];
    if (isFilled) classes.push("gb-calendar-filled");
    if (isToday) classes.push("gb-calendar-today");
    if (isFuture) classes.push("gb-calendar-future");

    const cls = classes.join(" ");

    if (isFuture) {
      parts.push(`<div class="${cls}">${d}</div>`);
    } else {
      // Filled → view mode, empty → edit mode
      const href = isFilled
        ? linkPattern.replace("{date}", dateStr)
        : linkPattern.replace("{date}", dateStr) + "?mode=edit";
      parts.push(`<a class="${cls}" href="${esc(href)}">${d}</a>`);
    }
  }

  // Trailing empty cells to fill last row
  const totalCells = firstDow + numDays;
  const remainder = totalCells % 7;
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      parts.push(`<div class="gb-calendar-day gb-calendar-pad"></div>`);
    }
  }

  parts.push(`</div>`); // grid
  parts.push(`</div>`); // calendar

  return parts.join("\n");
}
