import { PropsWithChildren } from "react";
export const Badge = ({ children, tone = "blue" }: PropsWithChildren<{ tone?: "blue" | "green" | "gold" | "slate" }>) => {
  const tones = { blue: "bg-blue-500/15 text-blue-300", green: "bg-green-500/15 text-green-300", gold: "bg-yellow-500/15 text-yellow-300", slate: "bg-slate-500/15 text-slate-300" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
};
