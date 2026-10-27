# `.agents/` — 本项目 AI Coding 的唯一维护源

本目录是 AI Coding 落地架构的**单一事实来源（single source of truth）**。
所有 AI 编码工具（Cursor / Claude Code / OpenCode / Gemini / Trae）都通过**软链接**读取这里的
`rules/` 与 `skills/`，因此规范只维护一份，多端共用。

## 架构：四件套

| 层 | 位置 | 回答的问题 | 谁维护 |
| --- | --- | --- | --- |
| **Rules** | `rules/01~11` | 「怎么才算对」——原则、约束、契约、目录与命名约定 | 本目录 |
| **Skills** | `skills/` | 「一步步怎么做」——步骤、检查点、产出模板、示例 | 本目录 |
| **MCP** | 全局 MCP 配置 | 「怎么看到真实世界」——设计稿 / 浏览器 / 库文档 | 全局配置 |
| **SDD** | `../openspec/` | 「为什么改、改成什么样」——需求收敛 → 实施 → 归档 | OpenSpec |

> **Rules 只留原则与约束；Skills 只留步骤与模板。**
> 判断方式：一句话能说清、不需要示例 → 写进 Rules；需要「第一步、第二步、检查点、模板、示例」→ 写进 Skills。

## 目录

```
.agents/
├── README.md          ← 本文件：架构说明与入口
├── rules/             ← 规范层（11 条，按「开发时会被问到的决策类型」拆分）
│   ├── README.md      ← 规范索引 + 快速查找表
│   ├── 01-项目概述.md
│   ├── 02-编码规范.md
│   ├── 03-项目结构.md
│   ├── 04-组件规范.md
│   ├── 05-API规范.md
│   ├── 06-路由规范.md
│   ├── 07-状态管理.md
│   ├── 08-通用约束.md
│   ├── 09-样式规范.md
│   ├── 10-文档规范.md
│   └── 11-测试规范.md
└── skills/            ← 技能层（一个技能一个目录，必有 SKILL.md）
    ├── README.md      ← 技能索引
    ├── create-proposal/      # SDD 提案（对接 openspec）
    ├── design-analysis/      # 设计稿 → UI 分析清单（含 rules/ 子拆分）
    ├── ui-verification/      # 实现页 vs 设计稿 → P0/P1/P2 问题清单（含 rules/ 子拆分）
    ├── create-route/         # 新增页面路由
    ├── create-api/           # 新增接口
    ├── create-store/         # 新增 Pinia store
    ├── create-component/     # 创建/拆分组件
    └── element-plus-theme/   # Element Plus 主题与样式变量
```

## 软链接（多端共用一份）

每个工具目录下的 `rules/` 与 `skills/` 都软链到 `.agents/` 下的同名目录：

```
.cursor/rules   → ../.agents/rules     .cursor/skills   → ../.agents/skills
.claude/rules   → ../.agents/rules     .claude/skills   → ../.agents/skills
.opencode/rules → ../.agents/rules     .opencode/skills → ../.agents/skills
.gemini/rules   → ../.agents/rules     .gemini/skills   → ../.agents/skills
.trae/rules     → ../.agents/rules     .trae/skills     → ../.agents/skills
```

> ⚠️ 只链接 `rules/` 与 `skills/` **这两个子目录**，不要软链整个工具目录——
> 因为 OpenSpec 会往各工具目录写自己的 `commands/` 与 `skills/openspec-*`，整目录软链会互相覆盖。

## 标准工作流（SDD 闭环）

```
需求输入 → openspec propose → proposal/tasks/specs 校验 → 按 tasks 实施
        → 读 Rules + 对应 Skill → 有设计稿则 ui-verification 验收 → openspec archive
```

| 阶段 | 怎么做 |
| --- | --- |
| 1. 需求收敛 | `openspec proposal "<需求>"`，或 `/opsx:propose`；先判断有无设计稿 / 有无接口 / 交付形态 |
| 2. 设计稿分析（有稿时） | 读 `.agents/skills/design-analysis/SKILL.md`，产出 UI 分析清单 |
| 3. 实施 | 按 `tasks.md` 逐项；读 `.agents/rules/0X` 定边界，读 `.agents/skills/*` 拿步骤 |
| 4. UI 验收（有实现页时） | 读 `.agents/skills/ui-verification/SKILL.md`，用 chrome-devtools MCP 与设计稿比对，产出 P0/P1/P2 问题清单 |
| 5. 质量门禁 | `pnpm type-check` / `pnpm lint` / `pnpm format:check` / `pnpm build` |
| 6. 归档 | `openspec archive`，变更移入 `openspec/changes/archive/`，spec 增量合入 `openspec/specs/` |

## 使用提示

- **不要把步骤写进 Rules**，也不要把原则塞进 Skills——两者混写会导致上下文膨胀、模型丢重点。
- **新增规范**：加到 `rules/` 并更新 `rules/README.md` 索引。
- **新增技能**：加到 `skills/<name>/SKILL.md` 并更新 `skills/README.md` 索引。
- 流程长、检查项多的技能（如 design-analysis、ui-verification）再拆 `rules/` 子目录，SKILL.md 只做入口。
- 只改 `.agents/` 即可让全部工具生效，**不要**直接编辑各工具目录里的 `rules/` `skills/` 副本。
