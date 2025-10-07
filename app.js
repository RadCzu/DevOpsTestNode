const express = require('express')
const app = express()
const port = 2137

app.use(express.json())

var storage = "default"
var bananas = 0;
var bananaCapacity = 1000;

app.get('/', (req, res) => {
  res.set("Content-type", "text/plain")
  res.send('Hello World!')
})

app.get('/storage', (req, res) => {
  res.set("Content-type", "application/json")
  res.status(200)
  res.send(JSON.stringify({ value: storage }))
})

app.get('/bananas', (req, res) => {
  res.set("Content-type", "application/json")
  res.status(200)
  res.send(JSON.stringify({ value: bananas }))
})

app.put('/storage', (req, res) => {
  try {
    if (typeof req.body.value === 'undefined') {
      return res.status(400).json({ error: 'Missing "value" in request body' })
    }

    storage = req.body.value
    res.status(200).json({ value: storage })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/bananas', (req, res) => {
  const { amount } = req.body;

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  if (bananas + amount > bananaCapacity) {
    return res.status(500).json({ 
        "error": "Banana capacity exceeded",
        "details": "Critical overflow at 1000 bananas",
        "severity": "critical"
    });
  }

  bananas += amount;

  res.status(200).json({ value: bananas });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})