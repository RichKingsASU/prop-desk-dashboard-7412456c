export type DevEventLogIn = {
  source: string;
  level: string;
  event_type: string;
  message: string;
  meta?: Record<string, unknown>;
  uid?: string;
};

export type DevEventLog = DevEventLogIn & {
  id: string;
  created_at: string;
};

export async function insertDevEventLogs(_logs: DevEventLogIn[]): Promise<{ inserted: number }> {
  // TODO: implement with Postgres schema once finalized.
  return { inserted: _logs.length };
}

export async function listDevEventLogs(_opts?: { limit?: number }): Promise<DevEventLog[]> {
  // TODO: implement with Postgres schema once finalized.
  return [];
}

