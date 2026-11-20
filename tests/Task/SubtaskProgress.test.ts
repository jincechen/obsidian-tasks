import { GlobalFilter } from '../../src/Config/GlobalFilter';
import { resetSettings, updateSettings } from '../../src/Config/Settings';
import type { Status } from '../../src/Statuses/Status';
import { StatusConfiguration, StatusType } from '../../src/Statuses/StatusConfiguration';
import { StatusRegistry } from '../../src/Statuses/StatusRegistry';
import {
    progressConfig,
    progressStep,
    renderSubtaskProgress,
    statusSequence,
    subtaskProgressFromLines,
    subtaskProgressOfListItem,
    tallyStatuses,
} from '../../src/Task/SubtaskProgress';
import { ListItem } from '../../src/Task/ListItem';
import { TaskLocation } from '../../src/Task/TaskLocation';
import { TasksFile } from '../../src/Scripting/TasksFile';
import { Task } from '../../src/Task/Task';
import { fromLine, fromMarkdown } from '../TestingTools/TestHelpers';

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
const statuses = (symbols: string) => [...symbols].map(status);
const names = (list: Status[]) => list.map((s) => s.name);

afterEach(() => {
    GlobalFilter.getInstance().reset();
    StatusRegistry.getInstance().resetToDefaultStatuses();
    resetSettings();
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

describe('progressConfig', () => {
    beforeEach(useCycleWithSteps);

    it('counts from Todo to Done, with no middle layer, by default', () => {
        expect(progressConfig()).toMatchObject({ total: 0, middle: null, completed: 3 });
    });

    it('uses the steps chosen in settings', () => {
        updateSettings({ subtaskProgress: { totalFrom: '<', middleFrom: '/', completedFrom: 'x' } });
        expect(progressConfig()).toMatchObject({ total: 1, middle: 2, completed: 3 });
    });

    it('falls back to the defaults for steps that no longer exist or are out of order', () => {
        updateSettings({ subtaskProgress: { totalFrom: 'q', middleFrom: 'x', completedFrom: ' ' } });
        expect(progressConfig()).toMatchObject({ total: 0, middle: null, completed: 3 });
    });
});

describe('tallyStatuses', () => {
    beforeEach(useCycleWithSteps);

    it('counts done out of all subtasks by default, leaving out cancelled and forwarded ones', () => {
        expect(tallyStatuses(statuses(' <\\/xX->?'), progressConfig())).toEqual({ done: 2, middle: 0, total: 6 });
    });

    it('counts each status as its step and the steps before it', () => {
        // x/y = In Progress or later / Scheduled or later. Todo is not counted at all.
        updateSettings({ subtaskProgress: { totalFrom: '<', middleFrom: '', completedFrom: '/' } });
        expect(tallyStatuses(statuses(' </x\\'), progressConfig())).toEqual({ done: 2, middle: 0, total: 4 });
    });

    it('counts the middle layer, including the done subtasks', () => {
        updateSettings({ subtaskProgress: { totalFrom: ' ', middleFrom: '<', completedFrom: 'x' } });
        expect(tallyStatuses(statuses(' <\\/x'), progressConfig())).toEqual({ done: 1, middle: 4, total: 5 });
    });

    it('returns null when there is nothing to count', () => {
        expect(tallyStatuses([], progressConfig())).toBeNull();
        expect(tallyStatuses(statuses('->'), progressConfig())).toBeNull();
    });
});

describe('subtaskProgressOfListItem', () => {
    it('counts all descendant tasks, including those under plain list items', () => {
        // - [ ] parent
        //     - [x] child done
        //     - [ ] child todo
        //         - [x] grandchild done
        //     - plain list item
        //         - [-] cancelled, under a plain list item
        //         - [/] in progress, under a plain list item
        // Attach each item to its parent, in the same way as FileParser does.
        const taskWithParent = (line: string, parent: ListItem | null) => new Task({ ...fromLine({ line })!, parent });
        const parent = taskWithParent('- [ ] parent', null);
        taskWithParent('    - [x] child done', parent);
        const childTodo = taskWithParent('    - [ ] child todo', parent);
        taskWithParent('        - [x] grandchild done', childTodo);
        const plainListItem = new ListItem({
            originalMarkdown: '    - plain list item',
            indentation: '    ',
            listMarker: '-',
            statusCharacter: null,
            description: 'plain list item',
            parent,
            taskLocation: TaskLocation.fromUnknownPosition(new TasksFile('file.md')),
        });
        taskWithParent('        - [-] cancelled, under a plain list item', plainListItem);
        taskWithParent('        - [/] in progress, under a plain list item', plainListItem);

        expect(subtaskProgressOfListItem(parent)).toEqual({ done: 2, middle: 0, total: 4 });
    });

    it('returns null for a task without subtasks', () => {
        const tasks = fromMarkdown(`
- [ ] parent
- [ ] sibling
`);
        expect(subtaskProgressOfListItem(tasks[0])).toBeNull();
    });
});

describe('subtaskProgressFromLines', () => {
    const lines = [
        '- [ ] parent', // 0
        '    - [x] child done', // 1
        '', // 2
        '\t- [ ] tab-indented child', // 3
        '        - [x] grandchild', // 4
        '    - plain list item', // 5
        '    - [-] cancelled', // 6
        '- [ ] sibling', // 7
        '    - [ ] child of sibling', // 8
        'Some text', // 9
    ];

    it('counts the more deeply indented tasks after the parent, skipping blank lines', () => {
        expect(subtaskProgressFromLines(lines, 0)).toEqual({ done: 2, middle: 0, total: 3 });
    });

    it('stops at the next line that is not more deeply indented', () => {
        expect(subtaskProgressFromLines(lines, 7)).toEqual({ done: 0, middle: 0, total: 1 });
    });

    it('returns null for tasks without subtasks, and for lines that are not tasks', () => {
        expect(subtaskProgressFromLines(lines, 1)).toBeNull();
        expect(subtaskProgressFromLines(lines, 5)).toBeNull();
        expect(subtaskProgressFromLines(lines, 9)).toBeNull();
    });

    it('works inside block quotes and callouts', () => {
        const quoted = ['> - [ ] parent', '>     - [x] child', '> - [ ] sibling'];
        expect(subtaskProgressFromLines(quoted, 0)).toEqual({ done: 1, middle: 0, total: 1 });
    });

    it('does not count a following block quote or callout as subtasks', () => {
        const lines = ['- [ ] parent', '', '> [!note]', '> - [ ] in a callout'];
        expect(subtaskProgressFromLines(lines, 0)).toBeNull();
    });

    it('only counts subtasks that contain the global filter', () => {
        GlobalFilter.getInstance().set('#task');
        const filtered = ['- [ ] #task parent', '    - [x] #task counted', '    - [ ] not counted'];
        expect(subtaskProgressFromLines(filtered, 0)).toEqual({ done: 1, middle: 0, total: 1 });
        expect(subtaskProgressFromLines(['- [ ] not a task', '    - [x] #task child'], 0)).toBeNull();
    });

    it('counts with the steps chosen in settings', () => {
        useCycleWithSteps();
        updateSettings({ subtaskProgress: { totalFrom: '<', middleFrom: '', completedFrom: '/' } });
        const steps = [
            '- [ ] parent',
            '    - [ ] todo',
            '    - [<] scheduled',
            '    - [/] in progress',
            '    - [x] done',
        ];
        expect(subtaskProgressFromLines(steps, 0)).toEqual({ done: 2, middle: 0, total: 3 });
    });
});

describe('renderSubtaskProgress', () => {
    it('renders an accessible progress bar with a count', () => {
        const parent = document.createElement('div');
        renderSubtaskProgress(parent, { done: 1, middle: 0, total: 4 });

        const progress = parent.querySelector('.tasks-progress')!;
        expect(progress.getAttribute('role')).toEqual('progressbar');
        expect(progress.getAttribute('aria-valuenow')).toEqual('1');
        expect(progress.getAttribute('aria-valuemax')).toEqual('4');
        expect(progress.getAttribute('aria-label')).toEqual('Done: 1 of 4');
        expect(progress.hasAttribute('data-complete')).toEqual(false);
        expect(parent.querySelector('.tasks-progress-middle')).toBeNull();
        expect((parent.querySelector('.tasks-progress-fill') as HTMLElement).style.width).toEqual('25%');
        expect(parent.querySelector('.tasks-progress-count')!.textContent).toEqual('1/4');
    });

    it('draws the middle layer under the done layer, and describes it', () => {
        useCycleWithSteps();
        updateSettings({ subtaskProgress: { totalFrom: ' ', middleFrom: '<', completedFrom: 'x' } });
        const parent = document.createElement('div');
        renderSubtaskProgress(parent, { done: 1, middle: 3, total: 4 });

        expect(parent.querySelector('.tasks-progress')!.getAttribute('aria-label')).toEqual(
            'Done: 1 of 4 · Scheduled: 3',
        );
        const track = parent.querySelector('.tasks-progress-track')!;
        const [middle, fill] = Array.from(track.children) as HTMLElement[];
        expect(middle.className).toEqual('tasks-progress-middle');
        expect(middle.style.width).toEqual('75%');
        expect(fill.className).toEqual('tasks-progress-fill');
        expect(fill.style.width).toEqual('25%');
    });
});
