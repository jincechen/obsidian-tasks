# Feature request: Optional icon style for task properties

Template: **Feature Request**. Post this one later, as the largest of the three. Link #1737 (closed as not planned), and quote the maintainer's invitation from #4048.

**Title:** Optional icon style for displaying task properties (display only, files unchanged)

## 🔖 Feature description

Task properties are displayed with emoji (📅 ⏳ 🛫 🔁 ⏫ …). Emoji render differently on each OS and font, look out of place in many themes, and are hard to tell apart at small sizes. #1737 asked to change the emojis themselves. This request is narrower: it changes **only how properties are displayed**. The text saved in notes stays the same, so other tools and the emoji format keep working.

## ✔️ Solution

A setting **Property style**: *Emoji* (default, the current behaviour) or *Icons*. Icons uses Obsidian's built-in Lucide icons, which follow the theme's colours and sizes. Where icons are shown:

- query results and Reading mode;
- the 'Create or edit Task' dialog;
- auto-suggest;
- Quick Search;
- context menus.

As suggested in #4048, I would split the work into separate commits or PRs: settings, Reading mode / results, edit dialog, auto-suggest, quick search, menus, docs.

## ❓ Alternatives

- CSS snippets that hide the emoji and add icons. These are fragile, and don't reach the menus, dialog or suggestions.

## 📝 Additional Context

<!-- Attach before/after screenshots from your personal build (light and dark theme). -->
