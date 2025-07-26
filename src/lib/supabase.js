import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.PROJECT_URL; // replace this
const supabaseServiceKey = process.env.SUPABASE_API_KEY; // replace this

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
