# Error Handling, Caching, Push Safety, Privacy

## Common Failures

| Symptom | Likely cause | What to do |
|---|---|---|
| `401 Bad credentials` or no active account | Not authenticated or token expired | Ask user to run `gh auth login` or refresh `GITHUB_TOKEN` |
| `404 Not Found` for a repo | Repo doesn't exist, private, or wrong name | Verify name; check `repo` scope for private |
| `403 API rate limit exceeded` | Too many requests | Wait and retry; use `--refresh` only when necessary |
| `Resource not accessible by personal access token` | Token scope insufficient | Check `gh auth status`; ask user to refresh |
| Empty output for `stars` / `repos` / `profile` | Private data but token lacks `read:user` | Ask user to add `read:user` scope |

If a failure persists, summarize and ask whether to retry, skip, or abort.

## Cache Behavior

- GitHub API responses are cached in `.cache/` for up to one hour. Use `--refresh` to force fresh fetch.
- Manually clear cache: delete `.cache/` inside the skill root.
- If the user switches accounts/tokens, clear `.cache/` first.

## Pushing Generated Content

For `beautify`, `i18n`, `profile`, generated files are drafts. Show to the user, ask for explicit approval, then apply via `gh api` or web UI. Never force-push or overwrite unreviewed changes. For batch updates, prefer one commit per logical change; show each commit URL.

## Commit Message Conventions

Concise, descriptive, no marketing language or AI co-author tags:

- `docs: polish README` — beautify output
- `docs: add English and Japanese README translations` — i18n output
- `docs: update repository About description and topics` — metadata from `draft`
- `docs: generate GitHub profile README` — profile README push

## Privacy and Safety

- API responses cached locally in `.cache/` for up to one hour. No data sent to any third-party service.
- The skill does **not** modify GitHub repositories automatically.
- `classify --apply` modifies Star Lists only after explicit confirmation AND only when token has `user` scope.
- **Do not ask the user to paste `GITHUB_TOKEN` into chat.** If a token change is needed, ask them to set it in their environment and restart the session.

## Agent Best Practices

`draft` is a starting point; refine based on the repo's actual content and the user's goals. Be concrete (specific topics, descriptions, lists) — not open-ended questions. Confirm before destructive or public changes.