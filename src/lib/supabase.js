import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ygslxnvxssdqqqobdsan.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9qsL2feDaeHb6x8GYlq4wA_sOemjatb";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getClientIpAndCheckBan() {
  let ip = "0.0.0.0";
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    if (data?.ip) ip = data.ip;
  } catch (e) {}

  if (ip && ip !== "0.0.0.0") {
    const { data: ban } = await supabase
      .from('banned_ips')
      .select('*')
      .eq('ip_address', ip)
      .gt('banned_until', new Date().toISOString())
      .maybeSingle();

    if (ban) {
      return { ip, isBanned: true, bannedUntil: ban.banned_until };
    }
  }
  return { ip, isBanned: false, bannedUntil: null };
}

// Family-friendly profanity & spam shield
const BLOCKED_WORDS = ['fuck', 'bitch', 'asshole', 'dick', 'pussy', 'porn', 'xxx', 'nude', 'sex', 'lanja', 'puka', 'modda', 'dengey'];
export function cleanMessageText(text) {
  let cleaned = text;
  BLOCKED_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '***');
  });
  return cleaned;
}