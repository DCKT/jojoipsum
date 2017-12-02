const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const url = require('url')
const sharp = require('sharp')
const { send } = require('micro')

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

const getImage = () =>
  new Promise((resolve, reject) => {
    const randomId = Math.ceil(Math.random() * cache.total) - 1

    if (cache.images[randomId]) {
      resolve(cache.images[randomId])
    } else {
      readFileAsync(path.join(ASSETS_PATH, cache.list[randomId]))
        .then(file => {
          cache.images[randomId] = file
          resolve(file)
        })
        .catch(err => {
          reject(err)
          console.log('ici')
          console.log(err)
        })
    }
  })

module.exports = (req, res) => {
  const { query } = url.parse(req.url, true)

  if (req.url.indexOf('favicon') !== -1) {
    send(res, 200)
    return
  }

  getImage()
    .then(image => {
      if (Object.keys(query).length) {
        const { width, height } = query

        if (Number.isNaN(width) || Number.isNaN(height)) {
          send(res, 400, 'Error : width or height query params must be integer.')
        } else {
          sharp(image)
            .resize(+query.width, +query.height)
            .toBuffer()
            .then(resizedImage => {
              res.end(resizedImage, 'binary')
            })
            .catch(err => {
              console.error(err)
              send(res, 500, 'Error : something went wrong with sharp.')
            })
        }
      } else {
        res.end(image, 'binary')
      }
    })
    .catch(err => {
      console.error(err)
      send(res, 500, 'Error : unable to get an image.')
    })
}
