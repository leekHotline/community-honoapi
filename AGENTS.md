# 前端和后端信息透明,通过D:\develop\shared\community-docs对接接口，共享信息

## 如果目前行业有成熟做法，就沿用成熟的做法；非必要不生成,除非能极大提升效率

当前项目是后端接口，主要负责编写模块接口以及对应的测试用例。

技术栈采用：
1. 使用 Hono 编写 Web 后端
2. 运行环境为 Bun

后端auth认证模块下登录注册接口，调用supabaseAuth，返回鉴权token
前端统一用Authorization: Bearer <token> 访问业务接口