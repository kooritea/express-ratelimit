# express速率限制中间件

测试效果
```bash
npm i
npm run test
```
配置
```javascript
// test.ts
const config: Config = [
  {
    count: 5,// 限制次数
    interval: 10000,// 单位时间
    event: "ResetPwd"// 事件名称
  }
]
```