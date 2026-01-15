import { getSettings } from "@/config/settings";

export type SystemStatus = {
  trading_enabled: boolean;
};

export async function getSystemStatus(): Promise<SystemStatus> {
  // Feature-flag is currently config-driven.
  return { trading_enabled: getSettings().tradingEnabled };
}

