import moment from 'moment/moment';
import { GlobalFilter } from 'Config/GlobalFilter';
import { State } from 'Obsidian/Cache';
import { Priority } from 'Task/Priority';
import { readTasksFromSimulatedFile } from '../Obsidian/SimulatedFile';
import { TaskBuilder } from '../TestingTools/TaskBuilder';
import { fromMarkdown } from '../TestingTools/TestHelpers';
import { createMarkdownRenderer, readNestedTasks, renderMarkdown } from './RenderingTestHelpers';

window.moment = moment;

afterEach(() => {
    GlobalFilter.getInstance().reset();
});

describe('MarkdownQueryResultsRenderer tests', () => {
    it('should render single task', async () => {
        const { markdown } = await renderMarkdown('hide tree', [
            new TaskBuilder().description('hello').priority(Priority.Medium).build(),
        ]);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] hello 🔼
            "
        `);
    });

    it('should render single task twice', async () => {
        const source = 'hide tree';
        const { renderer, query } = createMarkdownRenderer(source);

        const task = [new TaskBuilder().description('hello').priority(Priority.Medium).build()];

        await renderer.renderQuery(State.Warm, query.applyQueryToTasks(task));
        const r1 = renderer.markdown;

        await renderer.renderQuery(State.Warm, query.applyQueryToTasks(task));
        const r2 = renderer.markdown;

        expect(r1).toEqual(r2);
    });

    it('should render two tasks', async () => {
        const { markdown } = await renderMarkdown('hide tree\nsort by priority reverse', [
            new TaskBuilder().description('hello').priority(Priority.Medium).build(),
            new TaskBuilder().description('bye').priority(Priority.High).build(),
        ]);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] hello 🔼
            - [ ] bye ⏫
            "
        `);
    });

    it('should write one grouping level', async () => {
        const tasks = fromMarkdown(`
- [ ] 4444
- [ ] 333
- [ ] 55555
`);

        const { markdown } = await renderMarkdown('hide tree\ngroup by function task.description.length', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            #### 3

            - [ ] 333

            #### 4

            - [ ] 4444

            #### 5

            - [ ] 55555
            "
        `);
    });

    it('should write four grouping levels', async () => {
        const tasks = fromMarkdown(`
- [ ] 1 ⏳ 2025-10-29
- [ ] 2 ⏬
- [ ] 3 ⏫ ⏳ 2025-10-30
- [ ] 4 ⏳ 2025-10-29
- [ ] 5 #something
- [ ] 6 🆔 id6
`);

        const { markdown } = await renderMarkdown(
            `
group by function task.tags.join(',')
group by priority
group by scheduled
group by id
`,
            tasks,
        );
        expect(markdown).toMatchInlineSnapshot(`
            "
            ##### %%1%%High priority

            ###### 2025-10-30 Thursday

            - [ ] 3 ⏫ ⏳ 2025-10-30

            ##### %%3%%Normal priority

            ###### 2025-10-29 Wednesday

            - [ ] 1 ⏳ 2025-10-29
            - [ ] 4 ⏳ 2025-10-29

            ###### No scheduled date

            ###### id6

            - [ ] 6 🆔 id6

            ##### %%5%%Lowest priority

            ###### No scheduled date

            - [ ] 2 ⏬

            #### #something

            ##### %%3%%Normal priority

            ###### No scheduled date

            - [ ] 5 #something
            "
        `);
    });

    it('should write group task count, if enabled', async () => {
        const tasks = fromMarkdown(`
- [ ] 1 ⏳ 2025-10-29
- [ ] 2 ⏬
- [ ] 3 ⏫ ⏳ 2025-10-30
- [ ] 4 ⏳ 2025-10-29
`);

        const { markdown } = await renderMarkdown(
            `
group by priority
group by scheduled
show group count
`,
            tasks,
        );
        expect(markdown).toEqual(`
#### %%1%%High priority

##### 2025-10-30 Thursday (1 task)

- [ ] 3 ⏫ ⏳ 2025-10-30

#### %%3%%Normal priority

##### 2025-10-29 Wednesday (2 tasks)

- [ ] 1 ⏳ 2025-10-29
- [ ] 4 ⏳ 2025-10-29

#### %%5%%Lowest priority

##### No scheduled date (1 task)

- [ ] 2 ⏬
`);
    });

    it('should remove indentation for nested tasks', async () => {
        const tasks = readTasksFromSimulatedFile('inheritance_2roots_listitem_listitem_task');

        const { markdown } = await renderMarkdown('', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] grandchild task 1
            - [ ] grandchild task 2
            "
        `);
    });

    it('should indent nested tasks', async () => {
        const tasks = readTasksFromSimulatedFile(
            'inheritance_1parent2children2grandchildren1sibling_start_with_heading',
        );

        const { markdown } = await renderMarkdown('show tree', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] #task parent task
                - [ ] #task child task 1
                    - [ ] #task grandchild 1
                - [ ] #task child task 2
                    - [ ] #task grandchild 2
            - [ ] #task sibling
            "
`);
    });

    it('should indent nested list items', async () => {
        const tasks = readTasksFromSimulatedFile('inheritance_task_2listitem_3task');

        const { markdown } = await renderMarkdown('show tree', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] parent task
                - child list item 1
                    - [ ] grandchild task 1
                    - [ ] grandchild task 2
                - child list item 2
                    - [ ] grandchild task 3
            "
        `);
    });

    it('should render status of non-task list items', async () => {
        GlobalFilter.getInstance().set('#task');
        const tasks = readTasksFromSimulatedFile('inheritance_non_task_child');

        const { markdown } = await renderMarkdown('show tree', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] #task task parent
                - [ ] #task task child
                - [ ] non-task child
                - [x] non-task child status x
                - list item child
            "
        `);
    });

    it('should use hyphen as list marker', async () => {
        const tasks = readTasksFromSimulatedFile('mixed_list_markers');

        const { markdown } = await renderMarkdown('', tasks);

        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] hyphen
            - [ ] asterisk
            - [ ] plus
            - [ ] numbered task with dot
            - [ ] numbered task with parenthesis
            "
        `);
    });

    it('should remove callout prefixes', async () => {
        const tasks = readTasksFromSimulatedFile('callout_labelled');

        const { markdown } = await renderMarkdown('', tasks);

        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] #task Task in 'callout_labelled'
            - [ ] #task Task indented in 'callout_labelled'
            "
        `);
    });

    it('should render the explanation', async () => {
        const tasks = readTasksFromSimulatedFile('callout_labelled');

        const { markdown } = await renderMarkdown('explain\ndescription includes indented', tasks);

        expect(markdown).toMatchInlineSnapshot(`
            "
            Explanation of this Tasks code block query:

              description includes indented

            - [ ] #task Task indented in 'callout_labelled'
            "
        `);
    });

    it('should render an error', async () => {
        const { markdown } = await renderMarkdown('abracadabra', []);

        expect(markdown).toMatchInlineSnapshot(`
            "
            do not understand query
            Problem line: "abracadabra""
        `);
    });
});

describe('show tree: only matching subtasks, with their parents', () => {
    const sample = `
- [ ] parent ⏳ 2025-10-29
    - [ ] child ⏳ 2025-10-29
    - [ ] unscheduled child
        - [ ] scheduled grandchild ⏳ 2025-10-29
    - a note
        - a nested note
    - a list item with only unscheduled tasks
        - [ ] unscheduled grandchild
- [ ] unscheduled parent
    - [ ] unscheduled child 2
- [ ] another unscheduled parent
    - a list item
        - [ ] scheduled grandchild 2 ⏳ 2025-10-29
`;

    it('should show only matching subtasks, and the notes under shown tasks', async () => {
        const { markdown } = await renderMarkdown('show tree\nhas scheduled date', readNestedTasks(sample));
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] parent ⏳ 2025-10-29
                - [ ] child ⏳ 2025-10-29
                - [ ] unscheduled child
                    - [ ] scheduled grandchild ⏳ 2025-10-29
                - a note
                    - a nested note
            - [ ] another unscheduled parent
                - a list item
                    - [ ] scheduled grandchild 2 ⏳ 2025-10-29
            "
        `);
    });

    it('should place a non-matching parent where its first matching subtask is sorted', async () => {
        const tasks = readNestedTasks(`
- [ ] b parent
    - [ ] c child
- [ ] a task
- [ ] z task
`);
        const { markdown } = await renderMarkdown(
            'show tree\nsort by description\n(description includes child) OR (description includes task)',
            tasks,
        );
        expect(markdown).toMatchInlineSnapshot(`
            "
            - [ ] a task
            - [ ] b parent
                - [ ] c child
            - [ ] z task
            "
        `);
    });

    it('should show the parent in every group that contains a matching subtask', async () => {
        const tasks = readNestedTasks(`
- [ ] parent
    - [ ] child 1 ⏳ 2025-10-29
    - [ ] child 2 ⏳ 2025-10-30
`);
        const { markdown } = await renderMarkdown('show tree\nhas scheduled date\ngroup by scheduled', tasks);
        expect(markdown).toMatchInlineSnapshot(`
            "
            #### 2025-10-29 Wednesday

            - [ ] parent
                - [ ] child 1 ⏳ 2025-10-29

            #### 2025-10-30 Thursday

            - [ ] parent
                - [ ] child 2 ⏳ 2025-10-30
            "
        `);
    });
});
