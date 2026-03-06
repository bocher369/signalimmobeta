
import { createClient } from "@supabase/supabase-js";

// REPLACE THESE VARIABLES WITH YOUR OWN SUPABASE URL AND PUBLIC KEY
const SUPABASE_URL = "https://wmdpqpepkjgtvijssaox.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_-cWYR5cRD9_02XCke1h45A_qqIBaafx";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
