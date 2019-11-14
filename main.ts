import { NextFunction, Request, Response } from 'express';
import { Tedis } from "tedis";
const tedis = new Tedis({
  port: 6379,
  host: "127.0.0.1"
});

const split = '_'

interface ConfigItem {
  count: number,
  interval: number,
  event: string
}
export type Config = ConfigItem[]

function getConfig(config: Config, event: string): ConfigItem | undefined {
  return config.find((item) => item.event === event)
}

function getUserUniqueTag(req: Request): string {
  return req.query.username || req.ip
}
function getEventType(req: Request): string {
  return req.query.event
}
export function Ratelimit(config: Config) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {

    // 事件类型
    const eventType = getEventType(req)
    const eventConfig = getConfig(config, eventType)
    if (eventConfig === undefined) {
      // 这个事件没有被定义限制次数
      next()
      return
    }
    // 用户唯一标识
    const userUniqueTag = getUserUniqueTag(req)
    // 用户某个事件对应的调用次数和限制时间
    let store: {
      count: number,
      limit: number
    }
    try {
      const tmp = await tedis.get(`${userUniqueTag}${split}${eventType}`)
      if (typeof tmp === 'string') {
        store = JSON.parse(tmp)
      } else {
        store = {
          count: 0,
          limit: (new Date()).valueOf() + eventConfig.interval
        }
      }
    } catch (e) {
      store = {
        count: 0,
        limit: (new Date()).valueOf() + eventConfig.interval
      }
    }
    const now = (new Date()).valueOf()
    if (store.count >= eventConfig.count && now < store.limit) {
      // 达到调用上限且限制时间未到
      res.status(403)
      res.end()
    } else {
      if (store.limit < now) {
        // 距离第一次调用已经超过了限制时间,可以调用
        // 重置计数和限制时间
        store = {
          count: 1,
          limit: now + eventConfig.interval
        }
      } else {
        // 添加一次间隔范围内次数
        store.count++;
      }
      // 写入redis
      await tedis.set(`${userUniqueTag}${split}${eventType}`, JSON.stringify(store))
      next()
    }
  }
}