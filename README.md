# 技术栈
前端expo(react) 
后端hono(ts)+bun -当前项目只负责后端和中间件,数据库
数据库supabase

# 前端和后端信息透明,通过D:\develop\shared\community-docs对接接口，共享信息

bun create hono@latest
.当前目录 ip:端口请求后端
生成32长 密钥 bun -e "console.log(crypto.randomUUID())"

gh repo create community-honoapi --public
git remote add origin https://github.com/leekHotline/community-honoapi.g
it

To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

To sync database structure between local & remote 
更新完schema.ts后执行 就会把schema推送到数据库
```
bun run db:sync
```

open http://localhost:3000

## Setup
1. Copy `.env.example` to `.env` and set `SUPABASE_CONNECTION_STRING` and `SUPABASE_SERVICE_ROLE_KEY`. `SUPABASE_URL` is optional.
2. Sync tables:
   - `bun run db:sync` (Drizzle push).
3. API reference: `docs/api.md`.
