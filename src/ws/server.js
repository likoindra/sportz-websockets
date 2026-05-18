import {WebSocket, WebSocketServer} from "ws";

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

    wss.on("connection", (socket) => {
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