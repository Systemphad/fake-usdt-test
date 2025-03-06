const express = require('express');
const JsonRpcEngine = require('json-rpc-engine');
const { providerFromEngine } = require('json-rpc-engine');
const app = express();

// Port ko environment variable se lo (Render ke liye), default 3000 for local
const port = process.env.PORT || 3000;

app.use(express.json());

// Fake RPC Engine
const engine = new JsonRpcEngine();
engine.push((req, res, next, end) => {
    // Fake BNB balance (0 FBNB, kyunki sirf USDT dikhana hai)
    if (req.method === 'eth_getBalance') {
        res.result = '0x0'; // 0 FBNB
        return end();
    }
    // Fake USDT balance (20,000 FUSDT)
    if (req.method === 'eth_call') {
        // Check karo ki request USDT contract ke liye hai
        const data = req.params[0].data;
        if (data && data.startsWith('0x70a08231')) { // balanceOf function signature
            res.result = '0x000000000000000000000000000000000000000000000429d069189e00000000'; // 20,000 USDT in wei
            return end();
        }
    }
    // Fake transaction count (history khali rakho)
    if (req.method === 'eth_getTransactionCount') {
        res.result = '0x0';
        return end();
    }
    next();
});

const provider = providerFromEngine(engine);

// RPC endpoint
app.post('/rpc', (req, res) => {
    provider.sendAsync(req.body, (err, response) => {
        if (err) res.status(500).json(err);
        else res.json(response);
    });
});

// Render ke liye 0.0.0.0 pe bind karo
app.listen(port, '0.0.0.0', () => {
    console.log(`Fake RPC server running on port ${port}`);
});