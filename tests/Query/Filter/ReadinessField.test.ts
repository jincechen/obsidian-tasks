import moment from 'moment';
import { ReadinessField } from '../../../src/Query/Filter/ReadinessField';
import { Query } from '../../../src/Query/Query';
import { Priority } from '../../../src/Task/Priority';
import { Status } from '../../../src/Statuses/Status';
import {
    expectTaskComparesAfter,
    expectTaskComparesBefore,
    expectTaskComparesEqual,
} from '../../CustomMatchers/CustomMatchersForSorting';
import { TaskBuilder } from '../../TestingTools/TaskBuilder';

window.moment = moment;

beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-07-05'));
});

afterAll(() => {
    jest.useRealTimers();
});

const task = () => new TaskBuilder();

describe('readiness', () => {
    it('should not support filtering or grouping', () => {
        const field = new ReadinessField();
        expect(field.canCreateFilterForLine('readiness')).toEqual(false);
        expect(field.supportsGrouping()).toEqual(false);
    });
});

describe('sorting by readiness', () => {
    it('supports Field sorting methods correctly', () => {
        const field = new ReadinessField();
        expect(field.supportsSorting()).toEqual(true);
        expect(field.createSorterFromLine('sort by readiness')?.property).toEqual('readiness');
    });

    it('should sort the groups by how ready the tasks are', () => {
        const sorter = new ReadinessField().createNormalSorter();
        const inOrder = [
            task().description('overdue').dueDate('2023-07-01'),
            task().description('due today').dueDate('2023-07-05'),
            task().description('planned now').scheduledDate('2023-07-05'),
            task().description('deadline soon').dueDate('2023-07-10'),
            task().description('anytime'),
            task().description('planned later').scheduledDate('2023-07-10'),
            task().description('not started').startDate('2023-07-10'),
            task().description('finished').status(Status.DONE),
        ].map((builder) => builder.build());

        for (let i = 0; i < inOrder.length - 1; i++) {
            expectTaskComparesBefore(sorter, inOrder[i], inOrder[i + 1]);
        }
    });

    it('should sort within a group by the date that put the task there', () => {
        const sorter = new ReadinessField().createNormalSorter();
        expectTaskComparesBefore(sorter, task().dueDate('2023-06-01').build(), task().dueDate('2023-07-01').build());
        expectTaskComparesBefore(
            sorter,
            task().scheduledDate('2023-07-08').build(),
            task().scheduledDate('2023-07-20').build(),
        );
        expectTaskComparesBefore(
            sorter,
            task().startDate('2023-07-08').build(),
            task().startDate('2023-07-20').build(),
        );
    });

    it('should leave tasks equal when their group and date are the same', () => {
        const sorter = new ReadinessField().createNormalSorter();
        expectTaskComparesEqual(sorter, task().description('a').build(), task().description('b').build());
        // A deadline beyond 14 days does not matter yet.
        expectTaskComparesEqual(sorter, task().dueDate('2023-08-30').build(), task().build());
        expectTaskComparesEqual(sorter, task().dueDate('2023-07-05').build(), task().dueDate('2023-07-05').build());
    });

    it('sort by readiness reverse', () => {
        const sorter = new ReadinessField().createReverseSorter();
        expectTaskComparesAfter(sorter, task().dueDate('2023-07-01').build(), task().build());
    });
});

describe('sorting by readiness, combined with other instructions', () => {
    function sortedDescriptions(source: string) {
        const tasks = [
            task().description('medium overdue').priority(Priority.Medium).dueDate('2023-07-01'),
            task().description('high anytime').priority(Priority.High),
            task().description('high planned now').priority(Priority.High).scheduledDate('2023-07-05'),
            task().description('medium anytime').priority(Priority.Medium),
        ].map((builder) => builder.build());
        const result = new Query(source).applyQueryToTasks(tasks);
        return result.taskGroups.groups[0].tasks.map((t) => t.description);
    }

    it('should sort by readiness within each priority, when sorted by priority first', () => {
        expect(sortedDescriptions('sort by priority\nsort by readiness')).toEqual([
            'high planned now',
            'high anytime',
            'medium overdue',
            'medium anytime',
        ]);
    });

    it('should sort by priority within each readiness group, when sorted by readiness first', () => {
        expect(sortedDescriptions('sort by readiness\nsort by priority')).toEqual([
            'medium overdue',
            'high planned now',
            'high anytime',
            'medium anytime',
        ]);
    });
});
