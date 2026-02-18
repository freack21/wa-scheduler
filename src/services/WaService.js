import { AutoWA } from "whatsauto.js";
import { EventEmitter } from "events";
import path from "path";
import fs from "fs";

class WaService extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.sessionDir = path.join(process.cwd(), "wa_sessions");

    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  /**
   * Get or create a session for a user
   * @param {string} userId
   * @param {object} socket - Socket.io instance for this user
   */
  async getSession(userId, socket) {
    if (this.sessions.has(userId)) {
      const session = this.sessions.get(userId);
      this.setupSocketListeners(session, socket, userId);

      // If already connected, emit status
      console.log(`[${userId}] Re-attaching. Session User:`, session.user);

      const user = session.user || (session.sock && session.sock.user);

      if (user) {
        socket.emit("wa_status", { status: "connected", user: user });
      } else {
        socket.emit("wa_status", { status: "connecting" });
      }

      return session;
    }

    const session = new AutoWA(userId, {
      printQR: false,
      logging: false,
      folder: this.sessionDir, // Custom session folder if supported, or handles internally
    });

    this.sessions.set(userId, session);
    this.setupSocketListeners(session, socket, userId);

    await session.initialize();
    return session;
  }

  setupSocketListeners(session, socket, userId) {
    // Remove existing listeners to avoid duplicates if any (basic approach)
    session.removeAllListeners("qr");
    session.removeAllListeners("connected");
    session.removeAllListeners("disconnected");

    session.on("qr", (qr) => {
      console.log(`[${userId}] QR Received`);
      socket.emit("wa_qr", qr);
      socket.emit("wa_status", { status: "scan_qr" });
    });

    session.on("connected", () => {
      console.log(`[${userId}] Connected`);
      socket.emit("wa_status", { status: "connected", user: session.user });
      this.emit("connected", { userId, user: session.user });
    });

    session.on("disconnected", () => {
      console.log(`[${userId}] Disconnected`);
      socket.emit("wa_status", { status: "disconnected" });
      this.sessions.delete(userId);
    });

    // Forward messages or other events if needed
    session.on("message", (msg) => {
      // Handle incoming messages logic
    });
  }

  async sendMessage(userId, number, text) {
    const session = this.sessions.get(userId);
    if (!session) throw new Error("Session not found or not connected");
    return await session.sendText({ to: number, text });
  }

  async sendImage(userId, number, imageUrl, caption) {
    const session = this.sessions.get(userId);
    if (!session) throw new Error("Session not found or not connected");
    return await session.sendImage({
      to: number,
      media: imageUrl,
      text: caption,
    });
  }

  async sendVideo(userId, number, videoUrl, caption) {
    const session = this.sessions.get(userId);
    if (!session) throw new Error("Session not found or not connected");
    return await session.sendVideo({
      to: number,
      media: videoUrl,
      text: caption,
    });
  }

  async sendDocument(userId, number, docUrl, filename, caption) {
    const session = this.sessions.get(userId);
    if (!session) throw new Error("Session not found or not connected");
    return await session.sendDocument({
      to: number,
      media: docUrl,
      filename,
      text: caption,
    });
  }

  async sendSticker(userId, number, stickerUrl) {
    const session = this.sessions.get(userId);
    if (!session) throw new Error("Session not found or not connected");
    return await session.sendSticker({ to: number, media: stickerUrl });
  }

  async logout(userId) {
    if (this.sessions.has(userId)) {
      const session = this.sessions.get(userId);
      // Check docs for destroy/logout
      // Docs say: destroy(full?)
      await session.destroy(true); // true to delete session files
      this.sessions.delete(userId);
    }
  }
}

export default new WaService();
