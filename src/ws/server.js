import {WebSocket, WebSocketServer} from "ws";
import {wsArcjet} from "../arcjet.js";

function sendJson(socket, payload) {
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if(client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

// attach webserver logic to node server
export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 1024 * 1024 });

    wss.on("connection", async (socket, req) => {
        // check arcjet condition
        if(wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);
                if(decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit() ? "Rate limit reached" : "Access denied";

                    socket.close(code, reason);
                    return;
                }
            } catch (e) {
                console.error("WS connection failed", e);
                socket.close(1011, "Server security error")
                return;
            }
        }
        socket.isAlive = true;
        socket.on("pong", (msg) => { socket.isAlive = true; });

        sendJson(socket, { type: 'welcome'});

        socket.on("error", console.error);
    })

    // iterate trough all the clients
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        })
    }, 3000)

    wss.on("close", () => clearInterval(interval));

    // wss.on("connection", (socket) => {
    //     sendJson(socket, { type: "Welcome"})
    //
    //     socket.on("error", console.error);
    // })

    function broadcastMatchCreated(match) {
        broadcast(wss, { type : 'match_created', data : match });
    }

    return { broadcastMatchCreated };
}