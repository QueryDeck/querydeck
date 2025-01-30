const compression = require('compression')
const config = require('./config')
const express = require('express')
const fs = require('fs')
const path = require('path')

const deck_dev = express()
const PORT = 5051

deck_dev.use(compression())

deck_dev.get('*.js', (req, res, next) => {
  res.set('Content-Type', 'text/javascript')
  next()
})

deck_dev.get('*.chunk.css', (req, res, next) => {
  res.set('Content-Type', 'text/css')
  next()
})

deck_dev.use((req, res, next) => {
  if (req.url.startsWith('/static/js')) {
    const filePath = path.join(__dirname, '/build/static/js', req.url.slice(11))
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        next(err)
      } else {
        let result = data
        Object.keys(config).forEach(element => {
          result = result.replace(element, config[element])
        })
        res.send(result)
      }
    })
  } else {
    next()
  }
})

deck_dev.use(express.static(path.join(__dirname, 'build')))

deck_dev.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})

deck_dev.listen(PORT, () => {
  console.log(`QueryDeck Frontend running on Port: ${PORT}`)
})