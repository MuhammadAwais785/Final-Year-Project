const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;

/**
 * Returns the shared Supabase server client using the service role key.
 */
function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured');
  }

  supabaseClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return supabaseClient;
}

/**
 * Maps common PostgreSQL/PostgREST errors to HTTP status errors and throws.
 */
function throwIfSupabaseError(error) {
  if (!error) return;

  const clientErrorCodes = new Set(['22P02', '23502', '23503', '23514', 'PGRST116']);
  const err = new Error(error.message || 'Database query failed');
  if (error.code === '23505') {
    err.status = 409;
  } else if (clientErrorCodes.has(error.code)) {
    err.status = 400;
  }
  throw err;
}

/**
 * Verifies Supabase connectivity and confirms the core schema is accessible.
 */
async function connectDatabase() {
  const supabase = getSupabase();
  const { error } = await supabase.from('guardians').select('id').limit(1);
  throwIfSupabaseError(error);
  console.log('Supabase connected');
}

module.exports = { connectDatabase, getSupabase, throwIfSupabaseError };
