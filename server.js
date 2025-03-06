const express = require('express');
const { JsonRpcEngine } = require('json-rpc-engine');
const app = express();
const path = require('path');

// Port ko environment variable se lo (Render ke liye), default 3000 for local
const port = process.env.PORT || 3000;

// Static files serve karo (index.html ke liye)
app.use(express.static(path.join(__dirname, '.')));

// Explicit GET / route for index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.json());

// Fake RPC Engine
const engine = new JsonRpcEngine();
engine.push((req, res, next, end) => {
    console.log('Received method:', req.method); // Debug log
    // Fake BNB balance (0 FBNB)
    if (req.method === 'eth_getBalance') {
        res.result = '0x0'; // 0 FBNB
        return end();
    }
    // Fake USDT balance (20,000 FUSDT)
    if (req.method === 'eth_call') {
        const data = req.params[0].data;
        if (data && data.startsWith('0x70a08231')) { // balanceOf function signature
            res.result = '0x000000000000000000000000000000000000000000000429d069189e00000000'; // 20,000 USDT in wei
            return end();
        }
    }
    // Fake transaction count
    if (req.method === 'eth_getTransactionCount') {
        res.result = '0x0';
        return end();
    }
    next();
});

// Custom Provider
const provider = {
    sendAsync: (payload, callback) => {
        engine.handle(payload, (err, result) => {
            if (err) {
                console.error('Error in sendAsync:', err);
                return callback(err);
            }
            console.log('Response:', result); // Debug log
            callback(null, result);
        });
    }
};

// RPC endpoint
app.post('/rpc', (req, res) => {
    provider.sendAsync(req.body, (err, response) => {
        if (err) {
            console.error('RPC Error:', err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(response);
        }
    });
});

// Render ke liye 0.0.0.0 pe bind karo
app.listen(port, '0.0.0.0', () => {
    console.log(`Fake RPC server running on port ${port}`);
});