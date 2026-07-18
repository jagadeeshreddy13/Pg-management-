import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // WhatsApp API Proxy Placeholder
  app.post("/api/whatsapp/send", async (req, res) => {
    const { to, message, tenantId, type } = req.body;
    
    // In a real implementation, this would call the WhatsApp Cloud API
    // const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    // const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    console.log(`Sending WhatsApp message to ${to}: ${message}`);
    
    // Simulate API call
    setTimeout(() => {
      res.json({ 
        success: true, 
        messageId: "wamid." + Math.random().toString(36).substring(7),
        status: "sent" 
      });
    }, 1000);
  });

  // SMS API Proxy
  app.post("/api/sms/send", async (req, res) => {
    const { to, message, accountSid, authToken, from } = req.body;

    if (!accountSid || !authToken || !from) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing Twilio configuration (Account SID, Auth Token, or From Number)" 
      });
    }

    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(accountSid, authToken);

      const response = await client.messages.create({
        body: message,
        to: to,
        from: from
      });

      console.log(`SMS sent successfully to ${to}. SID: ${response.sid}`);
      res.json({ 
        success: true, 
        messageId: response.sid,
        status: "sent" 
      });
    } catch (error: any) {
      console.error("Twilio Error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to send SMS" 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
