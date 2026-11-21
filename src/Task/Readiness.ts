import type { Moment } from 'moment';
import { compareByDate } from '../DateTime/DateTools';
import type { Task } from './Task';

/**
 * The readiness groups, in the order that 'sort by readiness' puts them.
 */
export enum ReadinessGroup {
    Overdue = 1,
    DueToday = 2,
    PlannedNow = 3,
    DeadlineSoon = 4,
    Anytime = 5,
    PlannedLater = 6,
    NotStarted = 7,
    Finished = 8,
}

/**
 * How ready a task is to be worked on, judged by what each of its dates means:
 * - due date: the deadline,
 * - scheduled date: the day the user plans to work on it,
 * - start date: the earliest day the user can work on it.
 *
 * The created date is not used.
 *
 * See {@link ReadinessField}, which implements 'sort by readiness'.
 */
export class Readiness {
    /** Deadlines up to this many days ahead are 'soon'. Later deadlines do not matter yet. */
    public static readonly deadlineSoonDays = 14;

    /**
     * @param group - see {@link ReadinessGroup}
     * @param date - the date that put the task in its group, which orders tasks within the group,
     *               or null for groups that are not ordered by date.
     */
    private constructor(
        public readonly group: ReadinessGroup,
        public readonly date: Moment | null,
    ) {}

    /**
     * The readiness of a task. The rules are checked in this order, and the first that applies is used:
     * 1. A finished task (done, cancelled or non-task) is Finished.
     * 2. A deadline of today or earlier: Overdue or Due today.
     * 3. A start date after today: Not started.
     * 4. A scheduled date of today or earlier: Planned now.
     * 5. A deadline within {@link deadlineSoonDays} days: Deadline soon.
     * 6. A scheduled date after today: Planned later.
     * 7. Otherwise: Anytime.
     *
     * Invalid dates are treated as no date.
     * @param task
     * @param today - the start of the current day.
     */
    public static of(task: Task, today: Moment = window.moment().startOf('day')): Readiness {
        if (task.isDone) {
            return new Readiness(ReadinessGroup.Finished, null);
        }

        const due = Readiness.validDate(task.dueDate);
        const scheduled = Readiness.validDate(task.scheduledDate);
        const start = Readiness.validDate(task.startDate);

        if (due?.isBefore(today, 'day')) {
            return new Readiness(ReadinessGroup.Overdue, due);
        }
        if (due?.isSame(today, 'day')) {
            return new Readiness(ReadinessGroup.DueToday, due);
        }
        if (start?.isAfter(today, 'day')) {
            return new Readiness(ReadinessGroup.NotStarted, start);
        }
        if (scheduled?.isSameOrBefore(today, 'day')) {
            return new Readiness(ReadinessGroup.PlannedNow, scheduled);
        }
        if (due?.isSameOrBefore(today.clone().add(Readiness.deadlineSoonDays, 'days'), 'day')) {
            return new Readiness(ReadinessGroup.DeadlineSoon, due);
        }
        if (scheduled !== null) {
            return new Readiness(ReadinessGroup.PlannedLater, scheduled);
        }
        return new Readiness(ReadinessGroup.Anytime, null);
    }

    /**
     * Compare two tasks by readiness: first by group, then by the date that put them in their group.
     * Tasks that compare equal are left to any later sort instructions.
     */
    public static compare(a: Task, b: Task): number {
        const today = window.moment().startOf('day');
        const readinessA = Readiness.of(a, today);
        const readinessB = Readiness.of(b, today);
        if (readinessA.group !== readinessB.group) {
            return readinessA.group - readinessB.group;
        }
        return compareByDate(readinessA.date, readinessB.date);
    }

    private static validDate(date: Moment | null): Moment | null {
        return date?.isValid() ? date : null;
    }
}
