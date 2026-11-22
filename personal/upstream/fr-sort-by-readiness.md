# Feature request: `sort by readiness`

Template: **Feature Request**. Related: #2655 (urgency and dependencies, 15 👍), discussions #1257, #698 and #1162, and #2344 (urgency by a given date; wontfix). Explain why `sort by happens` and urgency don't cover this.

**Title:** Add `sort by readiness`: sort by what each date means, instead of a blended score

## 🔖 Feature description

`sort by urgency` mixes dates and priority into one number, so it is hard to predict. For example, a high-priority task with no dates (urgency 6.0) sorts above a low-priority task scheduled for today (5.0). Sorting by several dates (`sort by due`, then `sort by scheduled`) can't express "deadlines first, then plans, then things I can't start yet".

## ✔️ Solution

A new sort instruction, `sort by readiness`. It puts tasks into groups using what each date means: due = deadline, scheduled = when I plan to do it, start = earliest I can begin.

1. Overdue (by due date)
2. Due today
3. Planned now: scheduled today or earlier (by scheduled date)
4. Deadline soon: due within 14 days (by due date)
5. Planned soon: scheduled within 14 days (by scheduled date)
6. Anytime: no relevant dates
7. Planned later: scheduled more than 14 days away
8. Not started: start date after today (by start date)
9. On hold: tasks with an ON_HOLD status
10. Finished

Ties fall through to later `sort by` lines, so `sort by priority` + `sort by readiness` works either way round. It doesn't change urgency or the default sort order.

## ❓ Alternatives

- Changing the urgency weights, but that would affect every existing query.
- Long lists of `sort by function` expressions in each query.

## 📝 Additional Context

I have an implementation with tests and docs. It adds one new sort field and no settings.
