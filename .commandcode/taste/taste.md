# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# documentation
- Document architectural decisions and processes thoroughly, following the pattern established in arc-id and arc-wallet (dedicated docs/ directory with integration planning docs, architecture overviews, and clear build phase breakdowns). Confidence: 0.85
- Expects exhaustive exploration of available packages and options "to their fullest capacity" — deep, comprehensive analysis rather than surface-level scanning, before making any decisions. Confidence: 0.8
- Wants comparative evaluation to determine what's actually "best" — not just a catalog of everything that exists, curating and ranking options by quality and fitness. Confidence: 0.8
- Values aesthetically refined, high-quality workflows — solutions should be "perfect and beautiful," prioritizing elegance and polish alongside functional correctness. Confidence: 0.75
- Prefers planning-before-execution: wants the agent to share its plan first and get approval before starting implementation work (e.g., "let me know what you plan before you start executing"). Confidence: 0.8

# architecture
See [architecture/taste.md](architecture/taste.md)
# workflow
See [workflow/taste.md](workflow/taste.md)
# coding style
- Documents inline code decisions with explanatory comments at the point where architectural choices are made (e.g., "to avoid circular import: handle-error.ts → @/core/flows → flow-executor.ts") — explains the *reasoning* behind decisions, not just what the code does. Confidence: 0.75
- Aligns import `from` keywords with extra spacing in import blocks to visually group related imports. Confidence: 0.6

# design
- When removing a disliked element (e.g., jargon-heavy "orbit" branding), expects it replaced with something more conversational and reasonable rather than simply excised. Confidence: 0.8
 0.75
