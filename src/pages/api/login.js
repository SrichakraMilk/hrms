export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { agent, password } = req.body;

    const response = await fetch(
      "https://production.srichakramilk.com/api/auth/agent-login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Map 'agent' variable to the 'identifier' key
        body: JSON.stringify({
          identifier: agent,
          password: password,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
