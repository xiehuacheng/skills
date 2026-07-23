# Limits

What cv-clone approximates vs guarantees. Honest calibration of delivery bars.

## Approximate, not exact

- **Font identification.** Vision models guess font families from glyph shape. Ask the user to confirm if the sample uses a custom or paid typeface.
- **Color extraction.** Hex values from image sampling carry ±5 unit noise. Treat sampled colors as a starting point, not a contract.
- **Spacing / margins.** Pixel-faithful margins require measuring the source PDF via `pdfinfo` and overriding the skeleton's `\usepackage[margin=...]{geometry}`. The skeleton ships with `1.6cm` as a default.
- **Weight on macOS CJK.** `PingFang SC` ships only as `Regular`. `AutoFakeBold=2` synthesizes bold — recognizable but not bit-identical to a true bold cut.

## Supported with iteration

- **Two-column layouts.** Add `multicol` or `paracol`; expect 1-2 extra compile cycles.
- **Sidebar cards.** Achieved with `tikz` overlay or `paracol`. Plan 2-3 iteration rounds.
- **Icon rows.** Replace text labels with `fontawesome5` icons; verify CJK fallback inside the icon row.

## Out of scope for v0.x

- **Multi-page CVs.** Skeleton targets 1-page A4.
- **Non-LaTeX output.** The pipeline emits `.tex` only.
- **Auto-filling content from arbitrary input.** Content filling is gated behind the Step 5 user confirmation; no silent fabrication.
- **Pixel-perfect clone by default.** Default bar is "same vibe". Pixel-faithful requires the user to opt in at Step 1.

## Known platform gaps

- **Windows without admin rights.** No `scoop` available → tectonic install path blocked.
- **Linux distros without `apt`.** Use the upstream installer from <https://tectonic.dev>.
- **Offline-only environments.** First `tectonic` compile needs internet to fetch LaTeX packages. Cache clearing breaks offline mode (see common-mistakes #9).