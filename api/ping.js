export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    message: "API is working",
    method: req.method,
    time: new Date().toISOString()
  });
}
