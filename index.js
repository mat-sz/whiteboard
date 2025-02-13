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
    
    ctx.lineCap = 'round';
}

prepareCanvas();

let clients = [];
wss.on('connection', function connection(ws) {
    clients.push(ws);

    ws.send(JSON.stringify({
        type: 'initialData',
        dataURL: canvas.toDataURL('image/png'),
        width: canvasWidth,
        height: canvasHeight,
    }));

    ws.on('message', function incoming(data) {
        try {
            const json = JSON.parse(data);
            let broadcast = false;
            
            if (json && json.type) {
                switch (json.type) {
                    case 'lineSegment':
                        if (!json.x1 || !json.x2 || !json.y1 || !json.y2) return;

                        ctx.strokeStyle = json.color ? json.color : 'red';
                        ctx.lineWidth = json.width ? json.width : 10;

                        ctx.beginPath();
                        ctx.moveTo(json.x1, json.y1);
                        ctx.lineTo(json.x2, json.y2);
                        ctx.stroke();
                        ctx.closePath();

                        broadcast = true;
                        break;
                    case 'clear':
                        prepareCanvas();
                        broadcast = true;
                        break;
                    case 'chat':
                        broadcast = true;
                        break;
                }
            }

            if (broadcast) {
                for (let client of clients.filter((client) => client != ws)) {
                    client.send(data);
                }
            }
        } catch (e) {}
    });
});

setInterval(() => {
    clients = clients.filter((client) => client.readyState <= 1);
}, 5000);
