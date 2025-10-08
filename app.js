const express = require('express')
const prometheusClient = require('prom-client')
const app = express()
const port = 2137

app.use(express.json())

var storage = "default";
var bananas = 0;
var bananaCapacity = 1000;

const register = new prometheusClient.Registry()
prometheusClient.collectDefaultMetrics({ register })

/* Prometheus Metrics */

const bananaCount = new prometheusClient.Gauge({
  name: 'banana_count',
  help: 'Current number of bananas held by this instance'
})

const requestCount = new prometheusClient.Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'route', 'status_code']
})

const failedRequests = new prometheusClient.Counter({
  name: 'api_requests_failed_total',
  help: 'Total number of failed requests',
  labelNames: ['method', 'route', 'status_code']
})

const requestDuration = new prometheusClient.Histogram({
  name: 'api_request_duration_seconds',
  help: 'Duration of API requests in seconds',
  labelNames: ['method', 'route', 'status_code']
})

/* metrics middleware */

app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    const labels = { method: req.method, route: req.path, status_code: res.statusCode };
    requestCount.inc(labels);
    if (res.statusCode >= 400) failedRequests.inc(labels);
    end(labels);
  });
  next();
});

/* API endpoints */

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
  res.send(JSON.stringify({ bananas: bananas }))
})

app.put('/storage', (req, res) => {
  try {
    if (typeof req.body.value === 'undefined') {
      return res.status(400).json({ error: 'Missing "value" in request body' })
    }

    storage = req.body.value
    res.status(200).json({ value: storage })
  } catch (err) {
    console.error(err);
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

  // Update prometheus metric
  bananaCount.set(bananas);
  
  return res.status(200).json({ bananas })
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})