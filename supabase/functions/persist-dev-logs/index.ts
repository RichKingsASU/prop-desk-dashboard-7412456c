import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRequiredSecret } from "../_shared/gcpSecretManager.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ops-token',
};

interface DevLog {
  source: string;
  level: string;
  event_type: string;
  message: string;
  meta?: Record<string, unknown>;
}

// Fail fast on cold start if secrets are missing.
const expectedToken = await getRequiredSecret('OPS_LOG_INGEST_TOKEN');
const supabaseUrl = await getRequiredSecret('SUPABASE_URL');
const supabaseServiceKey = await getRequiredSecret('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate X-OPS-TOKEN header
    const opsToken = req.headers.get('x-ops-token');

    if (!opsToken || opsToken !== expectedToken) {
      console.warn('Invalid or missing X-OPS-TOKEN header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const logs: DevLog[] = body.logs;

    if (!Array.isArray(logs) || logs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: logs must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each log entry
    const validLogs = logs.filter(log => 
      log.source && 
      log.level && 
      log.event_type && 
      log.message
    );

    if (validLogs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid log entries found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare logs for insertion
    const logsToInsert = validLogs.map(log => ({
      source: log.source,
      level: log.level.toUpperCase(),
      event_type: log.event_type,
      message: log.message,
      meta: log.meta || {}
    }));

    // Insert logs
    const { data, error } = await supabase
      .from('dev_event_logs')
      .insert(logsToInsert)
      .select('id');

    if (error) {
      console.error('Failed to insert logs:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert logs', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully inserted ${data?.length || 0} logs`);

    return new Response(
      JSON.stringify({ 
        inserted: data?.length || 0,
        skipped: logs.length - validLogs.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in persist-dev-logs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
