const express = require('express');
const { JsonRpcEngine } = require('json-rpc-engine');
const app = express();
const path = require('path');

const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '.')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.json());

let engine;
try {
    engine = new JsonRpcEngine();
} catch (e) {
    console.error('JsonRpcEngine error:', e);
    process.exit(1);
}

engine.push((req, res, next, end) => {
    console.log('Received method:', req.method);
    if (req.method === 'eth_getBalance') {
        res.result = '0x0';
        return end();
    }
    if (req.method === 'eth_call') {
        const data = req.params[0].data;
        if (data && data.startsWith('0x70a08231')) {
            res.result = '0x000000000000000000000000000000000000000000000429d069189e00000000';
            return end();
        }
    }
    if (req.method === 'eth_getTransactionCount') {
        res.result = '0x0';
        return end();
    }
    next();
});

const provider = {
    sendAsync: (payload, callback) => {
        engine.handle(payload, (err, result) => {
            if (err) {
                console.error('Error in sendAsync:', err);
                return callback(err);
            }
            console.log('Response:', result);
            callback(null, result);
        });
    }
};

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

app.listen(port, '0.0.0.0', () => {
    console.log(`Fake RPC server running on port ${port}`);
    setTimeout(() => {
        console.log(`Server still running on port ${port} after 5s`);
    }, 5000);
});