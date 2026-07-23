# Error Handling, Caching, Privacy

## Common Failures

| Symptom | Likely cause | What to do |
|---|---|---|
| `401 Bad credentials` or `gh auth status` shows no active account | Not authenticated or token expired | Ask user to run `gh auth login` or refresh `GITHUB_TOKEN` |
| `404 Not Found` for a repository | Repo does not exist, is private, or the name is wrong | Verify repo name with user; check `repo` scope for private repos |
| `403 API rate limit exceeded` | Too many requests, especially without `--refresh` | Wait and retry; use `--refresh` only when necessary |
| `Resource not accessible by personal access token` | Token scope insufficient | Check `gh auth status` scopes; ask user to refresh with required scope |
| Empty output for `stars` / `repos` / `profile` | Private data but token lacks `read:user` | Ask user to add `read:user` scope |

If a failure persists, summarize the error and ask whether to retry, skip, or abort.

## Cache Behavior

- GitHub API responses are cached in `.cache/` for up to one hour.
- Use `--refresh` to force a fresh fetch when data looks stale or after external changes.
- To manually clear cache, delete the `.cache/` directory inside the skill root.
- If the user switches accounts/tokens, clear `.cache/` to prevent mixed data.

## Pushing Generated Content

For `beautify`, `i18n`, `profile`, generated files are drafts. Uniform rule:

1. Show the generated content to the user.
2. Ask for explicit approval to commit/push.
3. Only after approval, use `gh api` (single-file updates) or guide through GitHub web UI.
4. Never force-push or overwrite unreviewed changes.

For batch updates, prefer one commit per logical change; show each commit URL.

## Commit Message Conventions

Concise, descriptive, no marketing language or AI co-author tags:

- `docs: polish README` — beautify output
- `docs: add English and Japanese README translations` — i18n output
- `docs: update repository About description and topics` — metadata from `draft`
- `docs: generate GitHub profile README` — profile README push

## Privacy and Safety

- GitHub API responses are cached locally in `.cache/` for up to one hour.
- No data is sent to any third-party service.
- The skill does **not** modify GitHub repositories automatically.
- `classify --apply` modifies GitHub Star Lists only after explicit user confirmation AND only when the token has the required `user` scope.
- Do not ask the user to paste `GITHUB_TOKEN` into chat. If a token change is needed, ask them to set it in their environment and restart the session.

## Agent Best Practices

- **Do not trust generic output blindly**: `draft` gives a starting point; refine based on the repository's actual content and the user's goals.
- **Be concrete in proposals**: present specific topics, descriptions, and lists rather than asking open-ended questions without suggestions.
- **Confirm before destructive or public changes**: always get explicit approval before updating repository metadata, deleting lists, or pushing to the profile repository.