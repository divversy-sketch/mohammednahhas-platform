export default async function handler(req, res) {
  const openai = process.env.OPENAI_API_KEY || "";
  const gemini = process.env.GEMINI_API_KEY || "";
  return res.status(200).json({
    ok: true,
    env: {
      OPENAI_API_KEY: {
        exists: Boolean(openai),
        length: openai.length,
        prefix: openai ? openai.slice(0, 3) + "***" : null
      },
      GEMINI_API_KEY: {
        exists: Boolean(gemini),
        length: gemini.length,
        prefix: gemini ? gemini.slice(0, 3) + "***" : null
      }
    },
    note: "This endpoint only confirms presence/length. It never returns the secret keys."
  });
}
