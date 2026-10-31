# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# documentation
See [documentation/taste.md](documentation/taste.md)
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
