import express from 'express';
import http from "http";
import {matchRouter} from "./routes/matches.js";
import {attachWebSocketServer} from "./ws/server.js";

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Express server started');
})

app.use('/matches', matchRouter)

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;


server.listen(PORT, HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}`: `http://localhost:${PORT}:${HOST}`;
    console.log(`Server running on ${baseUrl}`);
    console.log(`Websocket server started at ${baseUrl.replace('http','ws')}/ws`)
})