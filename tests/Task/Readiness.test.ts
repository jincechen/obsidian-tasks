import moment from 'moment';
import { Status } from '../../src/Statuses/Status';
import { Readiness, ReadinessGroup } from '../../src/Task/Readiness';
import { TaskBuilder } from '../TestingTools/TaskBuilder';

window.moment = moment;

beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-07-05')); // A Wednesday
});

afterAll(() => {
    jest.useRealTimers();
});

function groupOf(builder: TaskBuilder) {
    return Readiness.of(builder.build()).group;
}

function task() {
    return new TaskBuilder();
}

describe('Readiness groups', () => {
    it('should put tasks due before today in Overdue', () => {
        expect(groupOf(task().dueDate('2023-07-04'))).toEqual(ReadinessGroup.Overdue);
    });

    it('should put tasks due today in Due today', () => {
        expect(groupOf(task().dueDate('2023-07-05'))).toEqual(ReadinessGroup.DueToday);
    });

    it('should put tasks scheduled today or earlier in Planned now', () => {
        expect(groupOf(task().scheduledDate('2023-07-05'))).toEqual(ReadinessGroup.PlannedNow);
        expect(groupOf(task().scheduledDate('2023-06-01'))).toEqual(ReadinessGroup.PlannedNow);
    });

    it('should count a scheduled date taken from the file name as planned', () => {
        expect(groupOf(task().scheduledDate('2023-07-01').scheduledDateIsInferred(true))).toEqual(
            ReadinessGroup.PlannedNow,
        );
    });

    it('should put tasks due within the next 14 days in Deadline soon', () => {
        expect(groupOf(task().dueDate('2023-07-06'))).toEqual(ReadinessGroup.DeadlineSoon);
        expect(groupOf(task().dueDate('2023-07-19'))).toEqual(ReadinessGroup.DeadlineSoon); // 14 days
        expect(groupOf(task().dueDate('2023-07-20'))).toEqual(ReadinessGroup.Anytime); // 15 days
    });

    it('should put tasks scheduled within the next 14 days in Planned soon', () => {
        expect(groupOf(task().scheduledDate('2023-07-06'))).toEqual(ReadinessGroup.PlannedSoon);
        expect(groupOf(task().scheduledDate('2023-07-19'))).toEqual(ReadinessGroup.PlannedSoon); // 14 days
    });

    it('should put tasks scheduled later than that in Planned later', () => {
        expect(groupOf(task().scheduledDate('2023-07-20'))).toEqual(ReadinessGroup.PlannedLater); // 15 days
    });

    it('should put tasks that start after today in Not started', () => {
        expect(groupOf(task().startDate('2023-07-06'))).toEqual(ReadinessGroup.NotStarted);
    });

    it('should put tasks without relevant dates in Anytime', () => {
        expect(groupOf(task())).toEqual(ReadinessGroup.Anytime);
        expect(groupOf(task().startDate('2023-07-05'))).toEqual(ReadinessGroup.Anytime); // started today
        expect(groupOf(task().startDate('2023-01-01'))).toEqual(ReadinessGroup.Anytime); // started earlier
        expect(groupOf(task().createdDate('2023-07-05'))).toEqual(ReadinessGroup.Anytime); // created date is ignored
    });

    it('should put tasks with an on hold status in On hold, whatever their dates', () => {
        expect(groupOf(task().status(Status.ON_HOLD))).toEqual(ReadinessGroup.OnHold);
        expect(groupOf(task().status(Status.ON_HOLD).dueDate('2023-07-01'))).toEqual(ReadinessGroup.OnHold);
        expect(groupOf(task().status(Status.ON_HOLD).scheduledDate('2023-07-05'))).toEqual(ReadinessGroup.OnHold);
    });

    it('should put finished tasks in Finished, whatever their dates', () => {
        expect(groupOf(task().status(Status.DONE).dueDate('2023-07-01'))).toEqual(ReadinessGroup.Finished);
        expect(groupOf(task().status(Status.CANCELLED).scheduledDate('2023-07-01'))).toEqual(ReadinessGroup.Finished);
        expect(groupOf(task().status(Status.NON_TASK))).toEqual(ReadinessGroup.Finished);
        expect(groupOf(task().status(Status.IN_PROGRESS).dueDate('2023-07-01'))).toEqual(ReadinessGroup.Overdue);
    });

    it('should treat invalid dates as no date', () => {
        expect(groupOf(task().dueDate('2023-02-30'))).toEqual(ReadinessGroup.Anytime);
        expect(groupOf(task().startDate('2023-02-30').scheduledDate('2023-07-01'))).toEqual(ReadinessGroup.PlannedNow);
    });
});

describe('Readiness - tasks with several dates', () => {
    it('should put a deadline of today or earlier first, even before a future start date', () => {
        expect(groupOf(task().dueDate('2023-07-05').startDate('2023-07-10'))).toEqual(ReadinessGroup.DueToday);
        expect(groupOf(task().dueDate('2023-07-01').scheduledDate('2023-07-10'))).toEqual(ReadinessGroup.Overdue);
    });

    it('should not count a task that cannot start yet as planned or near its deadline', () => {
        expect(groupOf(task().startDate('2023-07-10').dueDate('2023-07-12'))).toEqual(ReadinessGroup.NotStarted);
        expect(groupOf(task().startDate('2023-07-10').scheduledDate('2023-07-01'))).toEqual(ReadinessGroup.NotStarted);
    });

    it('should count a task planned for now as planned, even with a later deadline', () => {
        expect(groupOf(task().scheduledDate('2023-07-01').dueDate('2023-07-25'))).toEqual(ReadinessGroup.PlannedNow);
        expect(groupOf(task().scheduledDate('2023-07-01').dueDate('2023-07-08'))).toEqual(ReadinessGroup.PlannedNow);
    });

    it('should count a deadline soon before a plan', () => {
        expect(groupOf(task().dueDate('2023-07-10').scheduledDate('2023-07-08'))).toEqual(ReadinessGroup.DeadlineSoon);
        expect(groupOf(task().dueDate('2023-07-30').scheduledDate('2023-07-08'))).toEqual(ReadinessGroup.PlannedSoon);
        expect(groupOf(task().dueDate('2023-07-30').scheduledDate('2023-07-25'))).toEqual(ReadinessGroup.PlannedLater);
    });
});

describe('Readiness - the date that orders tasks within a group', () => {
    function dateOf(builder: TaskBuilder) {
        return Readiness.of(builder.build()).date?.format('YYYY-MM-DD') ?? null;
    }

    it('should use the date that put the task in its group', () => {
        expect(dateOf(task().dueDate('2023-07-01').scheduledDate('2023-06-01'))).toEqual('2023-07-01');
        expect(dateOf(task().scheduledDate('2023-06-01').dueDate('2023-07-25'))).toEqual('2023-06-01');
        expect(dateOf(task().startDate('2023-07-10').dueDate('2023-07-12'))).toEqual('2023-07-10');
        expect(dateOf(task().scheduledDate('2023-07-08'))).toEqual('2023-07-08');
        expect(dateOf(task().dueDate('2023-07-30'))).toBeNull(); // Anytime
    });
});
