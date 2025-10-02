export default async function handler(req, res) {
  const repo = "elmendezz/horario-messages"; // Tu repositorio de mensajes
  const messagesFile = "mensajes.json";
  const usersFile = "users.json";
  const branch = "main";

  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github.v3+json"
  };

  try {
    // Función auxiliar para obtener un archivo de GitHub
    async function getFile(filename) {
        const url = `https://api.github.com/repos/${repo}/contents/${filename}`;
        try {
            const response = await fetch(url, { headers });
            if (response.ok) {
                const data = await response.json();
                const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
                return { content, sha: data.sha };
            }
            if (response.status === 404) {
                return { content: filename === usersFile ? {} : [], sha: null }; // Devuelve objeto vacío para users, array para messages
            }
            throw new Error(`GitHub API fetch failed: ${response.statusText}`);
        } catch (e) {
            console.warn(`Could not fetch ${filename}, assuming it's new.`, e.message);
            return { content: filename === usersFile ? {} : [], sha: null };
        }
    }

    // Función auxiliar para actualizar un archivo en GitHub
    async function updateFile(filename, content, sha, commitMessage) {
        const url = `https://api.github.com/repos/${repo}/contents/${filename}`;
        const body = {
            message: commitMessage,
            content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
            branch,
            ...(sha && { sha }) // Añadir sha si existe
        };
        const response = await fetch(url, {
            method: "PUT",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const errorBody = await response.json();
            console.error(`GitHub API PUT Error for ${filename}:`, errorBody);
            throw new Error(`GitHub API PUT failed: ${response.statusText}`);
        }
    }

    // --- LÓGICA DE USUARIOS (GET y PUT) ---
    if (req.query.users === 'true' || (req.method === 'PUT' && req.body.action)) {
      const { content: users, sha: usersSha } = await getFile(usersFile);

      if (req.method === 'GET') {
        return res.status(200).json(users);
      }

      if (req.method === 'PUT') {
        const { action, username, status } = req.body;
        if (action === 'request_approval' && !users[username]) {
            users[username] = 'pending';
            await updateFile(usersFile, users, usersSha, `Solicitud de aprobación para ${username}`);
        } else if (action === 'update_status' && (status === 'approved' || status === 'denied')) {
            if (status === 'denied') delete users[username];
            else users[username] = status;
            await updateFile(usersFile, users, usersSha, `Estado de ${username} actualizado a ${status}`);
        }
        return res.status(200).json({ success: true });
      }
    }

    // --- OBTENER ESTADO DE UN USUARIO ESPECÍFICO ---
    if (req.method === 'GET' && req.query.user) {
        const { content: users } = await getFile(usersFile);
        const username = req.query.user;
        const status = users[username] || 'not_found';
        return res.status(200).json({ status });
    }

    // --- LEER MENSAJES (GET) ---
    if (req.method === "GET") {
      const { content: messages } = await getFile(messagesFile);
      return res.status(200).json(messages);
    }

    // --- OBTENER ARCHIVOS PARA ESCRIBIR/BORRAR MENSAJES ---
    const { content: messages, sha: messagesSha } = await getFile(messagesFile);
    const { content: users } = await getFile(usersFile);

    // --- ESCRIBIR MENSAJE (POST) ---
    if (req.method === "POST") {
      const { text, author } = req.body;
      if (!text || !author) return res.status(400).json({ error: "Faltan datos en el mensaje." });
      if (users[author] !== 'approved') return res.status(403).json({ error: "No tienes permiso para enviar mensajes." });
      
      messages.push({ text, author, time: new Date().toLocaleString('es-MX', { timeZone: 'America/Tijuana' }) });
      await updateFile(messagesFile, messages, messagesSha, `Nuevo mensaje de ${author}`);
    }
    // --- BORRAR MENSAJE (DELETE) ---
    else if (req.method === "DELETE") {
      const { index } = req.body;
      if (typeof index !== 'number') return res.status(400).json({ error: "Se requiere un índice numérico." });
      if (index < 0 || index >= messages.length) return res.status(400).json({ error: "Índice fuera de rango." });
      
      messages.splice(index, 1);
      await updateFile(messagesFile, messages, messagesSha, "Mensaje borrado desde la app");
    }
    // --- MÉTODO NO PERMITIDO ---
    else {
      return res.status(405).json({ error: "Método no permitido." });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Error en la función de API:", error);
    return res.status(500).json({ error: "Ocurrió un error interno en el servidor.", details: error.message });
  }
}