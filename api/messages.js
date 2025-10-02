export default async function handler(req, res) {
  const repo = "elmendezz/horario-messages"; // Tu repositorio de mensajes
  const file = "mensajes.json";
  const branch = "main";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${file}`;

  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github.v3+json"
  };

  try {
    // --- LEER MENSAJES (GET) ---
    if (req.method === "GET") {
      const response = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`);
      if (!response.ok) {
        // Si el archivo no existe, devuelve un array vacío
        if (response.status === 404) {
          return res.status(200).json([]);
        }
        throw new Error(`GitHub raw fetch failed: ${response.statusText}`);
      }
      const messages = await response.json();
      return res.status(200).json(messages);
    }

    // --- OBTENER ARCHIVO Y SHA (para POST y DELETE) ---
    let sha = null;
    let messages = [];
    try {
      const fileRes = await fetch(apiUrl, { headers });
      if (fileRes.ok) {
        const fileData = await fileRes.json();
        sha = fileData.sha;
        messages = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
      } else if (fileRes.status !== 404) {
        // Si no es 404, es un error real
        throw new Error(`GitHub API fetch failed: ${fileRes.statusText}`);
      }
      // Si es 404, sha es null y messages es [], lo cual es correcto para crear un archivo nuevo.
    } catch (e) {
      // Si el fetch falla por otra razón (ej. red), también asumimos que el archivo no existe.
      console.warn("Could not fetch existing file, assuming it's new.", e.message);
    }

    let commitMessage = "";

    // --- ESCRIBIR MENSAJE (POST) ---
    if (req.method === "POST") {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "El texto del mensaje no puede estar vacío." });
      
      messages.push({ text, time: new Date().toLocaleString('es-MX', { timeZone: 'America/Tijuana' }) });
      commitMessage = "Nuevo mensaje desde la app";
    }
    // --- BORRAR MENSAJE (DELETE) ---
    else if (req.method === "DELETE") {
      const { index } = req.body;
      if (typeof index !== 'number') return res.status(400).json({ error: "Se requiere un índice numérico." });
      if (index < 0 || index >= messages.length) return res.status(400).json({ error: "Índice fuera de rango." });
      
      messages.splice(index, 1);
      commitMessage = "Mensaje borrado desde la app";
    }
    // --- MÉTODO NO PERMITIDO ---
    else {
      return res.status(405).json({ error: "Método no permitido." });
    }

    // --- SUBIR CAMBIOS A GITHUB ---
    const content = Buffer.from(JSON.stringify(messages, null, 2)).toString("base64");
    const body = {
      message: commitMessage,
      content,
      branch
    };
    if (sha) {
      body.sha = sha; // Solo incluir SHA si estamos actualizando un archivo existente
    }

    const updateRes = await fetch(apiUrl, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!updateRes.ok) {
      const errorBody = await updateRes.json();
      console.error("GitHub API PUT Error:", errorBody);
      throw new Error(`GitHub API PUT failed: ${updateRes.statusText}`);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Error en la función de API:", error);
    return res.status(500).json({ error: "Ocurrió un error interno en el servidor.", details: error.message });
  }
}