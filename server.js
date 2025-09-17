import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db.js";
import Room from "./models/room.js";
import dotenv from "dotenv";

dotenv.config(); // load .env

// Connect MongoDB
connectDB();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", async (roomId) => {
        socket.join(roomId);

        // Find room or create if it doesn't exist
        const room = await Room.findOneAndUpdate(
            { roomId },                // find by roomId
            { $setOnInsert: { code: "" } }, // create only if not exists
            { upsert: true, new: true }
        );

        // Send current code to new user
        socket.emit("code-change", room.code);
    });


    socket.on("code-change", async ({ roomId, code }) => {
        try {
            await Room.findOneAndUpdate(
                { roomId },
                { code },
                { upsert: true, new: true }
            );

            socket.to(roomId).emit("code-change", code);


        } catch (err) {
            console.error("Error saving code:", err.message);
        }
    });



    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});