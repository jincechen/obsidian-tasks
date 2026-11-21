import type { Moment } from 'moment';
import { compareByDate } from '../DateTime/DateTools';
import { StatusType } from '../Statuses/StatusConfiguration';
import type { Task } from './Task';

/**
 * The readiness groups, in the order that 'sort by readiness' puts them.
 */
export enum ReadinessGroup {
    Overdue = 1,
    DueToday = 2,
    PlannedNow = 3,
    DeadlineSoon = 4,
    PlannedSoon = 5,
    Anytime = 6,
    PlannedLater = 7,
    NotStarted = 8,
    OnHold = 9,
    Finished = 10,
}

/**
 * How ready a task is to be worked on, judged by what each of its dates means:
 * - due date: the deadline,
 * - scheduled date: the day the user plans to work on it,
 * - start date: the earliest day the user can work on it.
 *
 * The created date is not used. Tasks with an on hold status are put near the end, whatever their dates.
 *
 * See {@link ReadinessField}, which implements 'sort by readiness'.
 */
export class Readiness {
    /** Deadlines and plans up to this many days ahead are 'soon'. */
    public static readonly soonDays = 14;

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
     * 2. A task with an on hold status is On hold.
     * 3. A deadline of today or earlier: Overdue or Due today.
     * 4. A start date after today: Not started.
     * 5. A scheduled date of today or earlier: Planned now.
     * 6. A deadline within {@link soonDays} days: Deadline soon.
     * 7. A scheduled date within {@link soonDays} days: Planned soon.
     * 8. A later scheduled date: Planned later.
     * 9. Otherwise: Anytime.
     *
     * Invalid dates are treated as no date.
     * @param task
     * @param today - the start of the current day.
     */
    public static of(task: Task, today: Moment = window.moment().startOf('day')): Readiness {
        if (task.isDone) {
            return new Readiness(ReadinessGroup.Finished, null);
        }
        if (task.status.type === StatusType.ON_HOLD) {
            return new Readiness(ReadinessGroup.OnHold, null);
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
        const soon = today.clone().add(Readiness.soonDays, 'days');
        if (due?.isSameOrBefore(soon, 'day')) {
            return new Readiness(ReadinessGroup.DeadlineSoon, due);
        }
        if (scheduled?.isSameOrBefore(soon, 'day')) {
            return new Readiness(ReadinessGroup.PlannedSoon, scheduled);
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
