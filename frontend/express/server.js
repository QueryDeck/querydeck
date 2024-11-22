const express = require('express')
const path = require('path')

const deck_dev = express()
const PORT = 5051

deck_dev.get('*.js', (req, res, next) => {
  req.url = req.url + '.gz'
  res.set('Content-Encoding', 'gzip')
  res.set('Content-Type', 'text/javascript')
  next()
})

deck_dev.get('*.chunk.css', (req, res, next) => {
  req.url = req.url + '.gz'
  res.set('Content-Encoding', 'gzip')
  res.set('Content-Type', 'text/css')
  next()
})

deck_dev.use(express.static(path.join(__dirname, 'build')))

deck_dev.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

deck_dev.listen(PORT, () => {
  console.log(`QueryDeck Frontend running on Port: ${PORT}`)
})