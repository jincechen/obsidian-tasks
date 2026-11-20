import { GlobalFilter } from '../../src/Config/GlobalFilter';
import { resetSettings, updateSettings } from '../../src/Config/Settings';
import { Status } from '../../src/Statuses/Status';
import { StatusConfiguration, StatusType } from '../../src/Statuses/StatusConfiguration';
import { StatusRegistry } from '../../src/Statuses/StatusRegistry';
import {
    intermediateStatus,
    intermediateStatusOptions,
    renderSubtaskProgress,
    subtaskProgressFromLines,
    subtaskProgressOfListItem,
    tallyStatuses,
} from '../../src/Task/SubtaskProgress';
import { ListItem } from '../../src/Task/ListItem';
import { TaskLocation } from '../../src/Task/TaskLocation';
import { TasksFile } from '../../src/Scripting/TasksFile';
import { Task } from '../../src/Task/Task';
import { fromLine, fromMarkdown } from '../TestingTools/TestHelpers';

const scheduled = new Status(new StatusConfiguration('>', 'Scheduled', 'x', true, StatusType.TODO));

afterEach(() => {
    GlobalFilter.getInstance().reset();
    StatusRegistry.getInstance().resetToDefaultStatuses();
    resetSettings();
});

describe('tallyStatuses', () => {
    it('counts done and not-done tasks', () => {
        expect(tallyStatuses([Status.DONE, Status.TODO, Status.IN_PROGRESS, Status.ON_HOLD], null)).toEqual({
            done: 1,
            intermediate: 0,
            total: 4,
        });
    });

    it('leaves out cancelled and non-task statuses', () => {
        expect(tallyStatuses([Status.DONE, Status.CANCELLED, Status.NON_TASK], null)).toEqual({
            done: 1,
            intermediate: 0,
            total: 1,
        });
    });

    it('counts the intermediate status separately from the done tasks', () => {
        expect(tallyStatuses([Status.DONE, scheduled, scheduled, Status.IN_PROGRESS, Status.TODO], scheduled)).toEqual({
            done: 1,
            intermediate: 2,
            total: 5,
        });
    });

    it('returns null when there is nothing to count', () => {
        expect(tallyStatuses([], null)).toBeNull();
        expect(tallyStatuses([Status.CANCELLED], null)).toBeNull();
    });
});

describe('intermediate status', () => {
    beforeEach(() => {
        StatusRegistry.getInstance().add(scheduled);
    });

    it('offers the counted statuses that are not done, except the default Todo', () => {
        const options = intermediateStatusOptions(StatusRegistry.getInstance()).map((status) => status.name);
        expect(options).toEqual(['In Progress', 'Scheduled']);
    });

    it('is the status chosen in settings', () => {
        expect(intermediateStatus()).toBeNull();

        updateSettings({ subtaskProgressIntermediateStatus: '>' });
        expect(intermediateStatus()?.name).toEqual('Scheduled');
    });

    it('is null if the chosen status no longer exists, or cannot be an intermediate status', () => {
        updateSettings({ subtaskProgressIntermediateStatus: 'Q' });
        expect(intermediateStatus()).toBeNull();

        updateSettings({ subtaskProgressIntermediateStatus: 'x' });
        expect(intermediateStatus()).toBeNull();
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

        expect(subtaskProgressOfListItem(parent)).toEqual({ done: 2, intermediate: 0, total: 4 });
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
        expect(subtaskProgressFromLines(lines, 0)).toEqual({ done: 2, intermediate: 0, total: 3 });
    });

    it('stops at the next line that is not more deeply indented', () => {
        expect(subtaskProgressFromLines(lines, 7)).toEqual({ done: 0, intermediate: 0, total: 1 });
    });

    it('returns null for tasks without subtasks, and for lines that are not tasks', () => {
        expect(subtaskProgressFromLines(lines, 1)).toBeNull();
        expect(subtaskProgressFromLines(lines, 5)).toBeNull();
        expect(subtaskProgressFromLines(lines, 9)).toBeNull();
    });

    it('works inside block quotes and callouts', () => {
        const quoted = ['> - [ ] parent', '>     - [x] child', '> - [ ] sibling'];
        expect(subtaskProgressFromLines(quoted, 0)).toEqual({ done: 1, intermediate: 0, total: 1 });
    });

    it('does not count a following block quote or callout as subtasks', () => {
        const lines = ['- [ ] parent', '', '> [!note]', '> - [ ] in a callout'];
        expect(subtaskProgressFromLines(lines, 0)).toBeNull();
    });

    it('only counts subtasks that contain the global filter', () => {
        GlobalFilter.getInstance().set('#task');
        const filtered = ['- [ ] #task parent', '    - [x] #task counted', '    - [ ] not counted'];
        expect(subtaskProgressFromLines(filtered, 0)).toEqual({ done: 1, intermediate: 0, total: 1 });
        expect(subtaskProgressFromLines(['- [ ] not a task', '    - [x] #task child'], 0)).toBeNull();
    });
});

describe('renderSubtaskProgress', () => {
    it('renders an accessible progress bar with a count', () => {
        const parent = document.createElement('div');
        renderSubtaskProgress(parent, { done: 1, intermediate: 0, total: 4 });

        const progress = parent.querySelector('.tasks-progress')!;
        expect(progress.getAttribute('role')).toEqual('progressbar');
        expect(progress.getAttribute('aria-valuenow')).toEqual('1');
        expect(progress.getAttribute('aria-valuemax')).toEqual('4');
        expect(progress.hasAttribute('data-complete')).toEqual(false);
        expect((parent.querySelector('.tasks-progress-fill') as HTMLElement).style.width).toEqual('25%');
        expect(parent.querySelector('.tasks-progress-count')!.textContent).toEqual('1/4');
    });
});

describe('subtask progress with an intermediate status', () => {
    beforeEach(() => {
        StatusRegistry.getInstance().add(scheduled);
        updateSettings({ subtaskProgressIntermediateStatus: '>' });
    });

    it('counts the intermediate status in a task tree', () => {
        const tasks = fromMarkdown(`
- [ ] parent
`);
        const parent = tasks[0];
        const child = (line: string) => new Task({ ...fromLine({ line })!, parent });
        child('    - [x] done');
        child('    - [>] scheduled');
        child('    - [ ] todo');

        expect(subtaskProgressOfListItem(parent)).toEqual({ done: 1, intermediate: 1, total: 3 });
    });

    it('counts the intermediate status in lines', () => {
        const lines = [
            '- [ ] parent',
            '    - [x] done',
            '    - [>] scheduled',
            '    - [>] scheduled',
            '    - [ ] todo',
        ];
        expect(subtaskProgressFromLines(lines, 0)).toEqual({ done: 1, intermediate: 2, total: 4 });
    });

    it('renders the intermediate layer after the done layer, and describes it', () => {
        const parent = document.createElement('div');
        renderSubtaskProgress(parent, { done: 1, intermediate: 2, total: 4 });

        const progress = parent.querySelector('.tasks-progress')!;
        expect(progress.getAttribute('aria-label')).toEqual('Subtasks done: 1 of 4, Scheduled: 2');
        const intermediate = parent.querySelector('.tasks-progress-intermediate') as HTMLElement;
        expect(intermediate.style.insetInlineStart).toEqual('25%');
        expect(intermediate.style.width).toEqual('50%');
        expect((parent.querySelector('.tasks-progress-fill') as HTMLElement).style.width).toEqual('25%');
        expect(parent.querySelector('.tasks-progress-count')!.textContent).toEqual('1/4');
    });

    it('renders only two layers when no intermediate status is chosen', () => {
        updateSettings({ subtaskProgressIntermediateStatus: '' });
        const parent = document.createElement('div');
        renderSubtaskProgress(parent, { done: 1, intermediate: 0, total: 4 });

        expect(parent.querySelector('.tasks-progress-intermediate')).toBeNull();
        expect(parent.querySelector('.tasks-progress')!.getAttribute('aria-label')).toEqual('Subtasks done: 1 of 4');
    });
});
