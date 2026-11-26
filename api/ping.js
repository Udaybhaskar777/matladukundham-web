export default async function handler(req, res) {
  const response = await fetch(
    "https://ygslxnvxssdqqqobdsan.supabase.co/rest/v1/stranger_queue?select=id&limit=1",
    {
      headers: {
        apikey: "sb_publishable_9qsL2feDaeHb6x8GYlq4wA_sOemjatb",
        Authorization: "Bearer sb_publishable_9qsL2feDaeHb6x8GYlq4wA_sOemjatb",
      },
    }
  );
  res.status(200).json({ status: "Supabase Active", code: response.status });
}