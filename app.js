const express = require('express')
const app = express()
const port = 2137

var storage = "default"

app.get('/', (req, res) => {
  res.set("Content-type", "text/plain")
  res.send('Hello World!')
})

app.get('/storage', (req, res) => {
  res.set("Content-type", "application/json")
  res.status(200)
  res.send(JSON.stringify({ value: storage }))
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

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})