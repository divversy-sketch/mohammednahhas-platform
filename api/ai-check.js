export default async function handler(req, res) {
  const gemini = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  return res.status(200).json({
    ok: true,
    provider: "gemini",
    fallback: false,
    limits: false,
    env: {
      GEMINI_API_KEY: {
        exists: Boolean(gemini),
        length: gemini.length,
        prefix: gemini ? gemini.slice(0, 3) + "***" : null
      }
    },
    note: "This endpoint confirms Gemini key presence only. It never returns the secret key."
  });
}
