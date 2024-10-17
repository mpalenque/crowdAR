const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
let trackCount = 0;

wss.on('connection', function connection(ws) {
  console.log('A new client connected');
  ws.markerDetected = false; // Flag to track if "Marker detected" was received

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    
    // Parse the message as JSON
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON:', message);
      return;
    }

    // Check if the message id starts with "tracker"
    if (parsedMessage.id && parsedMessage.id.startsWith('tracker')) {
      ws.id = parsedMessage.id;

      if (parsedMessage.message === 'Marker detected') {
        if (!ws.markerDetected) {
          trackCount++;
          ws.markerDetected = true;
        }
      } else if (parsedMessage.message === 'Marker lost') {
        if (ws.markerDetected) {
          trackCount--;
          ws.markerDetected = false;
        }
      }
      console.log('Track count:', trackCount);

      // Send the track count to all clients
      const trackCountMessage = JSON.stringify({ trackCount: trackCount });
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(trackCountMessage);
        }
      });
    }
  });

  ws.on('close', function close() {
    console.log('A client disconnected');
    // Decrement trackCount if the client id starts with "tracker" and marker was detected
    if (ws.id && ws.id.startsWith('tracker') && ws.markerDetected) {
      trackCount--;
      console.log('Track count:', trackCount);

      // Send the updated track count to all clients
      const trackCountMessage = JSON.stringify({ trackCount: trackCount });
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(trackCountMessage);
        }
      });
    }
    // Reset trackCount to 0 if no clients are connected
    if (wss.clients.size === 0) {
      trackCount = 0;
      console.log('Track count reset to 0');
    }
  });

  //ws.send('Hello! Message From Server!!');
});

console.log('WebSocket server is running on ws://localhost:8080');