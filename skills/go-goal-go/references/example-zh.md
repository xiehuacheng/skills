# Example — Chinese-language goal plan

Same scenario as the SKILL.md example, written in Chinese (the user's language). The skill's draft for a Chinese-speaking user looks like this end-to-end.

---

目标：稳定通过 test/auth 下 5 个间歇性失败的测试，每次重跑都得稳。

完成标准：npm test --testPathPattern=test/auth --runInBand 连续 3 次退出码 0，5 个 test 都跑过且没被 .skip / describe.skip / xit 之类打掉。

证明：跑上面那条命令；exit 0 + 没有新增的 skipped test + 5 个原始 test ID 在 3 次 run 中都出现在 passing 列表。

边界：只动 src/auth/ 与 test/auth/ 路径下的文件；不装任何包、不发任何网络请求、不改测试运行器配置、不删或禁用测试。

预算：最多 50 轮迭代或 20 分钟或 $1；连续 5 轮没有新通过就停。20% 留给退出时的 handoff。

停的条件：
- 写入 in_scope_paths 之外的文件 → 立即停，报告。
- 需要改 jest/vitest config、tsconfig、CI workflow → 停，问用户。
- 用户主动中断 → 优雅停机，保留 checkpoint。

谁来检查（派一个独立 sub-agent 按下面这段 prompt 审查；主 loop 必须派发，不得就地自判）：

<reviewer>
Role: critic

Inputs:
- final diff vs base
- 连续 3 次 proof run 的完整输出
- iterations log

Acceptance:
- 5 个 test 在 3 次 run 中全部通过，skipped 数 = 0。
- final_diff 里没有新增 .skip / describe.skip / xit / xdescribe 之类。
- 改动文件全部落在 src/auth/ 或 test/auth/ 下。
- 至少有一个 iteration 是真正的 root-cause 修改，不是仅靠 retry/wait 让 flake 偶然绿。
- 没有为了过 test 而弱化断言（toEqual→toMatch、.resolves 兜底、多次 setTimeout 嵌套 retry 等）。

Verdict: 末行必须是 `PASS` 或 `FAIL: <≤280 chars reason>` 中之一。
</reviewer>
