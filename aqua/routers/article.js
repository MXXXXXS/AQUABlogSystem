const path = require(`path`)
const fs = require(`fs`)

const JWT = require(`jsonwebtoken`)
const MarkdownIt = require(`markdown-it`)
const md = new MarkdownIt()

const paths = require(`../config/paths`)
const me = require(`../config/me`)
const save = require(`../utils/serverSide`)

module.exports = {
  GET: (req, res) => {
    const article = decodeURI(path.basename(req.path))
    fs.readFile(path.join(paths.dirs.assets.articles, article), (err, data) => {
      if (err) {
        res.send(`emmmm, 没有一篇类似"${article.slice(0, -3)}"...的文章`)
      } else {
        let result = md.render(data.toString())
        res.send(result)
      }
    })
  },
  POST: async (req, res) => {
    const db = await require(`../utils/db`).catch(err => console.err(err))
    const decoded = await new Promise((res, rej) => {
      JWT.verify(req.headers.jwt, me.password, (err, decoded) => {
        if (err) {
          rej(err)
        } else {
          res(decoded)
        }
      })
    }).catch(err => {
      console.error(`Illegal token: ${err}`)
    })
    if (decoded) {
      const article = decodeURI(path.basename(req.path))
      db.createCollection(article)
        .then(result => {
          console.log(result)
        })
        .catch(err => {
          console.error(`通过文章名创建collection失败` + err)
        })
      save(req, res, path.resolve(paths.dirs.assets.articles), path.resolve(paths.dirs.assets.images), err => {
        if (err) console.error(err)
      })
    } else {
      res.status(401).send(`Authorize Failed`)
    }
  }
}