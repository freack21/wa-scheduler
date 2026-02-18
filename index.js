import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import config from "./src/config/index.js";
import authRoutes from "./src/routes/auth.js";
import apiRoutes from "./src/routes/api.js";
import waService from "./src/services/WaService.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(process.cwd(), "public", "login.html"));
});

app.get("/login", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(process.cwd(), "public", "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(process.cwd(), "public", "dashboard.html"));
});

app.get("/tools/api-tester", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(process.cwd(), "public", "api-tester.html"));
});

// Routes
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

// Socket.io Authentication & WhatsApp Logic
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.decoded = decoded;
    next();
  });
});

io.on("connection", async (socket) => {
  const userId = socket.decoded.id;
  console.log(`User connected: ${userId}`);

  // Initialize or get WhatsApp session for this user
  try {
    await waService.getSession(userId, socket);
  } catch (error) {
    console.error(`Error initializing session for ${userId}:`, error);
    socket.emit("wa_error", error.message);
  }

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
  });

  socket.on("logout_wa", async () => {
    await waService.logout(userId);
    socket.emit("wa_status", { status: "disconnected" });
  });
});

const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
