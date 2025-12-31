const express = require('express')
const app = express()

app.use(express.json())

// Simple health endpoint
app.get('/', (req, res) => {
  res.send({ ok: true, service: 'Hotel Price Comparator API' })
})

// Minimal compare endpoint - returns example competitor results
app.get('/compare', (req, res) => {
  // Example query params: ?q=hotel+name&location=city
  const q = req.query.q || 'unknown'
  const location = req.query.location || ''
  const example = {
    query: q,
    location,
    results: [
      { provider: 'Booking.com', price: '₹4,200', url: 'https://booking.example' },
      { provider: 'Airbnb', price: '₹3,800', url: 'https://airbnb.example' }
    ]
  }
  res.json(example)
})

module.exports = app
