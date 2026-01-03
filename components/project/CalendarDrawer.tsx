"use client";

import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface CalendarDrawerProps {
  open: boolean;
  onClose: () => void;
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const buildCalendarDays = (monthBase: dayjs.Dayjs) => {
  const startOfMonth = monthBase.startOf("month");
  const gridStart = startOfMonth.startOf("week");
  return Array.from({ length: 42 }, (_, index) => gridStart.add(index, "day"));
};

export default function CalendarDrawer({ open, onClose }: CalendarDrawerProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const [mounted, setMounted] = useState(false);

  const referenceMonth = useMemo(() => dayjs().add(monthOffset, "month"), [monthOffset]);
  const calendarDays = useMemo(() => buildCalendarDays(referenceMonth), [referenceMonth]);
  const timelineDays = useMemo(() => Array.from({ length: 7 }, (_, idx) => dayjs().add(idx, "day")), []);
  const current = dayjs();

  useEffect(() => {
    setCurrentTime(current.format("h:mm A"));
    setMounted(true);
  }, []);

  const handlePrevMonth = () => setMonthOffset((prev) => prev - 1);
  const handleNextMonth = () => setMonthOffset((prev) => prev + 1);

  return (
    <div
      className={`fixed inset-0 z-40 transition-all duration-300 ease-out ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative mx-auto mt-16 w-full max-w-5xl rounded-[32px] border border-white/15 bg-gradient-to-br from-[#0f172a]/90 via-[#0f172a]/80 to-[#1e1b4b]/90 p-8 text-white shadow-2xl transition-all duration-400 ${
          open ? "scale-100 translate-y-0" : "scale-95 -translate-y-6"
        }`}
      >
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Current Focus</p>
            <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {current.format("dddd, MMM D")}
            </h2>
            <p className="text-sm text-white/70">{currentTime || "--:-- --"}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous month"
              onClick={handlePrevMonth}
              className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white transition hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {referenceMonth.format("MMMM YYYY")}
              </p>
              <p className="text-xs font-medium text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Calendar</p>
            </div>
            <button
              type="button"
              aria-label="Next month"
              onClick={handleNextMonth}
              className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white transition hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Close calendar"
              onClick={onClose}
              className="rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-row-reverse gap-3 overflow-x-auto pr-2">
          {timelineDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`min-w-[90px] rounded-2xl border border-white/15 px-3 py-2 text-center text-xs font-medium ${
                day.isSame(current, "day") ? "bg-emerald-400/10 text-white" : "bg-white/5 text-white/70"
              }`}
            >
              <p className="text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {day.format("DD MMM")}
              </p>
              <p>{day.format("ddd")}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {weekdayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-3">
              {calendarDays.map((day) => {
                const inMonth = day.isSame(referenceMonth, "month");
                const isToday = day.isSame(current, "day");
                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square rounded-2xl border border-white/10 p-2 text-sm transition ${
                      isToday
                        ? "border-emerald-300/60 bg-emerald-400/10 text-white"
                        : inMonth
                        ? "bg-white/5 text-white"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>{day.format("DD")}</span>
                      {isToday && <span className="rounded-full bg-emerald-300/30 px-2 text-[10px]">Today</span>}
                    </div>
                    <div className="mt-2 h-[2px] w-full rounded-full bg-white/10">
                      {isToday && <div className="h-full rounded-full bg-emerald-300" style={{ width: "60%" }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Upcoming</p>
            <div className="mt-4 space-y-3">
              {timelineDays.map((day, idx) => (
                <div key={day.toISOString()} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      {day.format("ddd, MMM D")}
                    </span>
                    <span className="text-white/60 text-xs">{mounted ? day.format("h:mm A") : "--:-- --"}</span>
                  </div>
                  <p className="text-xs text-white/60">Focus Session #{idx + 1}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
