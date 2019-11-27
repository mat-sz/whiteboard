const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 5000 });
const { createCanvas } = require('canvas');

const canvasWidth = 800;
const canvasHeight = 800;
const canvas = createCanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext('2d');

function prepareCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'red';
    ctx.lineCap = 'round';
    ctx.lineWidth = 10;
}

prepareCanvas();

let clients = [];
wss.on('connection', function connection(ws) {
    clients.push(ws);

    ws.send(JSON.stringify({
        type: 'initialData',
        dataURL: canvas.toDataURL('image/jpeg'),
        width: canvasWidth,
        height: canvasHeight,
    }));

    ws.on('message', function incoming(data) {
        try {
            const json = JSON.parse(data);
            
            if (json && json.type) {
                switch (json.type) {
                    case 'lineSegment':
                        if (!json.x1 || !json.x2 || !json.y1 || !json.y2) return;

                        ctx.beginPath();
                        ctx.moveTo(json.x1, json.y1);
                        ctx.lineTo(json.x2, json.y2);
                        ctx.stroke();
                        ctx.closePath();

                        for (let client of clients.filter((client) => client != ws)) {
                            client.send(data);
                        }
                        break;
                    case 'clear':
                        prepareCanvas();

                        for (let client of clients.filter((client) => client != ws)) {
                            client.send(data);
                        }
                        break;
                }
            }
        } catch (e) {}
    });
});

setInterval(() => {
    clients = clients.filter((client) => client.readyState <= 1);
}, 5000);
