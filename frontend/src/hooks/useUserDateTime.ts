import { useAuth } from "../context/AuthContext";

const userTimeZones: Record<string, { timeZone: string; label: string }> = {
  nelson: { timeZone: "Europe/Madrid", label: "Madrid" }
};

export const useUserDateTime = () => {
  const { user } = useAuth();
  const configured = user ? userTimeZones[user.username.toLowerCase()] : undefined;
  const options = configured ? { timeZone: configured.timeZone } : undefined;

  return {
    timeZoneLabel: configured?.label ?? null,
    formatDateTime: (value: string | number | Date) => new Date(value).toLocaleString(undefined, options),
    formatDate: (value: string | number | Date) => new Date(value).toLocaleDateString(undefined, options)
  };
};
