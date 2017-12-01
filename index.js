const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readDirAsync = promisify(fs.readdir)
const readFileAsync = promisify(fs.readFile)

const ASSETS_PATH = path.join(__dirname, 'data/images')

let cache = {
  list: {},
  images: {},
  total: 0
}

readDirAsync(ASSETS_PATH).then(data => {
  cache.list = data.reduce((acc, path, id) => {
    acc[id] = path
    cache.total += 1
    return acc
  }, {})
})

module.exports = (req, res) => {
  const randomId = Math.ceil(Math.random() * cache.total) - 1

  if (cache.images[randomId]) {
    res.end(cache.images[randomId], 'binary')
  } else {
    readFileAsync(path.join(ASSETS_PATH, cache.list[randomId])).then(file => {
      cache.images[randomId] = file
      res.end(file, 'binary')
    })
  }
}
