import type { Status } from 'Statuses/Status';
import { StatusConfiguration, StatusType } from 'Statuses/StatusConfiguration';
import { StatusRegistry } from 'Statuses/StatusRegistry';
import { progressStep, statusSequence } from 'Task/SubtaskProgress';

/**
 * A status cycle with steps between Todo and Done, and statuses outside the cycle.
 */
function useCycleWithSteps() {
    StatusRegistry.getInstance().set([
        new StatusConfiguration(' ', 'Todo', '<', true, StatusType.TODO),
        new StatusConfiguration('x', 'Done', ' ', true, StatusType.DONE),
        new StatusConfiguration('<', 'Scheduled', '/', true, StatusType.IN_PROGRESS),
        new StatusConfiguration('/', 'In Progress', 'x', true, StatusType.IN_PROGRESS),
        new StatusConfiguration('\\', 'Postponed', '/', true, StatusType.ON_HOLD),
        new StatusConfiguration('>', 'Forwarded', ' ', true, StatusType.ON_HOLD),
        new StatusConfiguration('-', 'Cancelled', ' ', true, StatusType.CANCELLED),
        new StatusConfiguration('?', 'Question', ' ', true, StatusType.NON_TASK),
        new StatusConfiguration('X', 'Also done', ' ', true, StatusType.DONE),
    ]);
}

const status = (symbol: string) => StatusRegistry.getInstance().bySymbol(symbol);
const names = (list: Status[]) => list.map((s) => s.name);

afterEach(() => {
    StatusRegistry.getInstance().resetToDefaultStatuses();
});

describe('statusSequence', () => {
    it('follows the default status cycle from Todo to Done', () => {
        expect(names(statusSequence(StatusRegistry.getInstance()))).toEqual(['Todo', 'Done']);
    });

    it('includes the steps between Todo and Done', () => {
        useCycleWithSteps();
        expect(names(statusSequence(StatusRegistry.getInstance()))).toEqual([
            'Todo',
            'Scheduled',
            'In Progress',
            'Done',
        ]);
    });

    it('stops at a loop or an unknown status', () => {
        StatusRegistry.getInstance().set([
            new StatusConfiguration(' ', 'Todo', 'a', true, StatusType.TODO),
            new StatusConfiguration('a', 'A', ' ', true, StatusType.IN_PROGRESS),
        ]);
        expect(names(statusSequence(StatusRegistry.getInstance()))).toEqual(['Todo', 'A']);

        StatusRegistry.getInstance().set([new StatusConfiguration(' ', 'Todo', 'q', true, StatusType.TODO)]);
        expect(names(statusSequence(StatusRegistry.getInstance()))).toEqual(['Todo']);
    });
});

describe('progressStep', () => {
    beforeEach(useCycleWithSteps);

    function stepOf(symbol: string) {
        const registry = StatusRegistry.getInstance();
        return progressStep(status(symbol), statusSequence(registry), registry);
    }

    it('is the index of a status in the sequence', () => {
        expect([' ', '<', '/', 'x'].map(stepOf)).toEqual([0, 1, 2, 3]);
    });

    it('counts other statuses as the step before the one they lead to', () => {
        expect(stepOf('\\')).toEqual(1.5); // leads to In Progress, so counts like Scheduled
        expect(stepOf('>')).toBeNull(); // leads to Todo
    });

    it('counts any Done status as done, and never counts cancelled or non-task statuses', () => {
        expect(stepOf('X')).toEqual(3);
        expect(stepOf('-')).toBeNull();
        expect(stepOf('?')).toBeNull();
    });
});
