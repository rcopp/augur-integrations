const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const PORT = 5000;

app.post('/api/reference_data/sets/bulk_load/:name', (req, res) => {
    console.log('\n=== QRadar Reference Set ===');
    console.log('Set:', req.params.name);
    console.log(JSON.stringify(req.body, null, 2));
    res.json({ status: 'ok' });
});

app.post('/api/reference_data/maps/bulk_load/:name', (req, res) => {
    console.log('\n=== QRadar Reference Map ===');
    console.log('Map:', req.params.name);
    console.log(JSON.stringify(req.body, null, 2));
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Mock QRadar running on http://localhost:${PORT}`);
});
