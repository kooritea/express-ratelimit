import express from 'express'
import { Ratelimit, Config } from './main'
import axios from 'axios'

const app = express()

const config: Config = [
  {
    count: 5,
    interval: 10000,
    event: "ResetPwd"
  },
  {
    count: 1,
    interval: 5000,
    event: "ResetSomething"
  }, {
    count: 0,
    interval: 5000,
    event: "deny"
  }
]

app.use(Ratelimit(config))
app.use('/test', function (req, res) {
  res.send(`调用${req.query.event}成功`)
})
app.listen(8888)

function curl(event) {
  axios.get('http://127.0.0.1:8888/test', {
    params: {
      event,
      username: "test"
    }
  }).then(() => {
    const time = new Date()
    console.log(`\x1B[36m[${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}]调用${event}成功\x1B[0m`)
  }).catch((e) => {
    const time = new Date()
    console.error(`[${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}]调用${event}失败`)
  })
}

setInterval(() => {
  // 10000毫秒内5次
  curl('ResetPwd')
  // 5000毫秒内1次
  curl('ResetSomething')
  // 禁止调用
  curl('deny')
  // 无限制
  curl('unlimited')
}, 500)