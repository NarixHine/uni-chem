## 亲民化学

本站为**面向普通高中生的强基化学学习网站**，由**教程和典型例题**（不完善，慎读！）和 **AI 助教**两部分组成。本站 AI 助教搭载绘制化学图示以讲解化学原理和反应机理的独特功能。

本站最初只是想要利用化学结构渲染库为化学学习体验（尤其是 AI 问答）的改善贡献绵薄之力。迫于知识水准和时间成本，本项目维护很可能极为有限。

### 本地开发

补充以下环境变量：

```bash
# Vercel AI Gateway
AI_GATEWAY_API_KEY=

# Prisma Postgres, Neon Postgres, etc.
DATABASE_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
```

然后运行：

```bash
bun i
bunx prisma migrate dev
bun dev
```
