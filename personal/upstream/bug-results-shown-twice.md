# Bug report: Query results briefly shown twice

Template: **Bug Report**. The maintainer asked for **a reproduction and, preferably, a video**. Record one with the official plugin before posting. Related: #3893 (a flicker report, closed because it couldn't be reproduced in a clean vault; these steps use the search box, which a test reproduces on current `main`), and #4105 / #4106 (the stale-results half, already fixed).

**Title:** Query results are briefly shown twice when the search box filter is typed quickly

## Steps to reproduce

<!-- TODO: confirm in your vault with the official plugin, and attach a screen recording. -->

1. Create a note containing at least 50 tasks, so that rendering takes a moment, plus this query:

   ````text
   ```tasks
   not done
   show search box
   ```
   ````

2. In Reading mode or Live Preview, type quickly into the query's search box, for example `ta`, then delete it with Backspace.

## Expected Behavior

The results always show each matching task once.

## Current behaviour

While typing, some tasks appear twice, or the whole list is shown twice, until the next redraw.

## Possible solution

Two causes:

1. **Search box re-renders overlap.** Each keystroke starts a new re-render while the previous one is still running, and both add their results to the same element. Running them one at a time through the `SerialRunner` added in #4106 fixes this; the last run uses the latest filter.
2. **The new render is added before the old one is removed.** `QueryRenderChild.renderResults()` builds the new results in a `div` that is already attached to the page, and only then removes the old one. Building it detached and swapping it in with `replaceChildren` avoids showing both.

I have a test that shows cause 1 on current `main`, and a small fix for both.
