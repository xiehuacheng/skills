# Install — Required Tooling

The cv-clone pipeline compiles LaTeX with `tectonic` and renders the PDF to PNG with `pdftoppm`. Both must be present before Step 4.

| Tool | Purpose | Install |
|---|---|---|
| `tectonic` | LaTeX compiler (xelatex-based, auto-fetches packages) | macOS: `brew install tectonic` · Linux: `apt install tectonic` · Windows: `scoop install tectonic` · source: <https://tectonic.dev> |
| `pdftoppm` | Convert the compiled PDF to PNG for visual review | macOS: preinstalled via `poppler` · Linux: `apt install poppler-utils` · Windows: bundled with MiKTeX/TeXLive |

Primary target is macOS. If `tectonic` is missing, install it with the platform-appropriate command above and confirm before proceeding.

**Network:** the first compile downloads LaTeX packages from the internet (~30 seconds, ~16 MB cached locally). Subsequent compiles are offline. If `tectonic --clean` is run, the next compile needs internet again.

**Verify install:**

```bash
tectonic --version    # expect 0.15+
pdftoppm -v 2>&1 | head -1   # expect poppler version line
```