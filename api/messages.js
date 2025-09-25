export default async function handler(req, res) {
  const repo = "elmendezz/horario-messages";  // cambia a tu repo
  const file = "messages.json";
  const branch = "main";

  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    "Content-Type": "application/json"
  };

  // Leer mensajes
  if (req.method === "GET") {
    const ghRes = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`);
    const messages = await ghRes.json();
    return res.status(200).json(messages);
  }

  // Escribir mensajes
  if (req.method === "POST") {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Mensaje vacío" });

    // Obtener archivo actual de GitHub
    const ghFile = await fetch(`https://api.github.com/repos/${repo}/contents/${file}?ref=${branch}`, { headers });
    const ghData = await ghFile.json();
    const sha = ghData.sha;
    const messages = JSON.parse(Buffer.from(ghData.content, "base64").toString("utf-8"));

    // Añadir mensaje nuevo
    messages.push({ text, time: new Date().toLocaleString() });

    // Subir a GitHub
    const update = await fetch(`https://api.github.com/repos/${repo}/contents/${file}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Nuevo mensaje desde admin",
        content: Buffer.from(JSON.stringify(messages, null, 2)).toString("base64"),
        sha,
        branch
      })
    });

    if (!update.ok) {
      const err = await update.json();
      return res.status(500).json({ error: err });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Método no permitido" });
}
