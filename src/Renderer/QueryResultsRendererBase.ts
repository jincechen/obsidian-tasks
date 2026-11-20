import { GlobalFilter } from '../Config/GlobalFilter';
import { GlobalQuery } from '../Config/GlobalQuery';
import type { IQuery } from '../IQuery';
import { State } from '../Obsidian/Cache';
import type { GroupDisplayHeading } from '../Query/Group/GroupDisplayHeading';
import type { TaskGroups } from '../Query/Group/TaskGroups';
import { explainResults } from '../Query/QueryRendererHelper';
import type { QueryResult } from '../Query/QueryResult';
import type { TasksFile } from '../Scripting/TasksFile';
import type { ListItem } from '../Task/ListItem';
import { Task } from '../Task/Task';
import type { TaskGroup } from '../Query/Group/TaskGroup';

/** A list item, and its index in the list it was found in. */
type IndexedListItem = [listItem: ListItem, index: number];

export abstract class QueryResultsRendererBase {
    private readonly source: string;
    protected readonly tasksFile: TasksFile;
    protected readonly query: IQuery;

    /** The tasks in the group being rendered, which are the tasks that matched the query. */
    private matchedTasks: Set<ListItem> = new Set<ListItem>();

    /**
     * When rendering a tree, the matched tasks in the group being rendered, and their ancestors.
     * See {@link matchedTasksAndAncestors}.
     */
    private matchedTasksAndTheirAncestors: Set<ListItem> = new Set<ListItem>();

    /**
     * The current depth in the rendered task tree: 0 for top-level (outermost) tasks,
     * and 1 or more for tasks rendered recursively as children. See {@link addChildren}.
     */
    protected nestingLevel = 0;

    protected constructor(source: string, tasksFile: TasksFile, query: IQuery) {
        this.source = source;
        this.tasksFile = tasksFile;
        this.query = query;
    }

    protected get filePath(): string | undefined {
        return this.tasksFile.path;
    }

    public async renderQuery(state: State, queryResult: QueryResult) {
        this.beginRender();

        // Don't log anything here, for any state, as it generates huge amounts of
        // console messages in large vaults, if Obsidian was opened with any
        // notes with tasks code blocks in Reading or Live Preview mode.
        const query = this.query;
        const error = query.error;

        if (state === State.Warm && error === undefined) {
            await this.renderQuerySearchResults(queryResult);
        } else if (error) {
            this.renderErrorMessage(error);
        } else {
            this.renderLoadingMessage();
        }
    }

    /**
     * This is called at the start of every render, implement this if you want to reset some state for each render.
     *
     * @protected
     */
    protected abstract beginRender(): void;

    private async renderQuerySearchResults(queryResult: QueryResult) {
        this.explainQuery();

        if (queryResult.searchErrorMessage !== undefined) {
            // There was an error in the search, for example due to a problem custom function.
            this.renderErrorMessage(queryResult.searchErrorMessage);
            return;
        }

        await this.renderSearchResults(queryResult);
    }

    private explainQuery() {
        if (this.query.queryLayoutOptions.explainQuery) {
            const explanation = explainResults(
                this.source,
                GlobalFilter.getInstance(),
                GlobalQuery.getInstance(),
                this.tasksFile,
            );

            this.renderExplanation(explanation);
        }
    }

    private async renderSearchResults(queryResult: QueryResult) {
        this.renderSearchResultsHeader(queryResult);

        await this.addAllTaskGroups(queryResult.taskGroups);

        const totalTasksCount = queryResult.totalTasksCount;
        this.query.debug(`[render] ${totalTasksCount} tasks displayed`);

        this.renderSearchResultsFooter(queryResult);
    }

    protected abstract renderSearchResultsHeader(queryResult: QueryResult): void;

    protected abstract renderSearchResultsFooter(queryResult: QueryResult): void;

    protected abstract renderErrorMessage(errorMessage: string): void;

    protected abstract renderLoadingMessage(): void;

    protected abstract renderExplanation(explanation: string | null): void;

    protected async addAllTaskGroups(tasksSortedLimitedGrouped: TaskGroups) {
        for (const group of tasksSortedLimitedGrouped.groups) {
            // If there were no 'group by' instructions, no headings will be added.
            await this.addGroupHeadings(group);

            await this.addGroupTaskList(group.tasks);
        }
    }

    /**
     * Render the tasks of one group.
     * @param tasks - the tasks in the group, which are the tasks that matched the query, in sorted order.
     */
    protected async addGroupTaskList(tasks: ListItem[]): Promise<void> {
        this.nestingLevel = 0;
        this.matchedTasks = new Set(tasks);
        this.matchedTasksAndTheirAncestors = QueryResultsRendererBase.matchedTasksAndAncestors(tasks);

        this.beginTaskList();
        try {
            if (this.query.queryLayoutOptions.hideTree) {
                await this.addFlatTaskList(tasks);
            } else {
                await this.addTreeTaskList(tasks);
            }
        } finally {
            this.endTaskList();
        }
    }

    /**
     * Whether a task is only shown to give context to its matching subtasks, because it did not match the query itself.
     */
    protected isContextOnly(listItem: ListItem): boolean {
        return listItem.isTask && !this.matchedTasks.has(listItem);
    }

    protected abstract beginTaskList(): void;

    protected abstract endTaskList(): void;

    /**
     * Old-style rendering of tasks:
     * - What is rendered:
     *     - Only task lines that match the query are rendered, as a flat list
     * - The order that lines are rendered:
     *     - Tasks are rendered in the order specified in 'sort by' instructions and default sort order.
     * @param listItems
     * @private
     */
    private async addFlatTaskList(listItems: ListItem[]): Promise<void> {
        for (const [listItemIndex, listItem] of listItems.entries()) {
            if (listItem instanceof Task) {
                this.beginListItem();
                await this.addTask(listItem, listItemIndex);
            }
        }
    }

    /** New-style rendering of tasks:
     *  - What is rendered:
     *      - Task lines that match the query are rendered, as a tree.
     *      - Only the subtasks that match the query are shown.
     *      - The parent tasks of matching subtasks are always shown, even if they do not match the query themselves,
     *        so that every subtask is shown in context. See {@link isContextOnly}.
     *      - Plain list items, such as notes, are shown under the tasks that are shown,
     *        unless they only contain subtasks that are not shown.
     *  - The order that lines are rendered:
     *      - The top-level/outermost tasks are sorted in the order specified in 'sort by'
     *        instructions and default sort order. An outermost task that did not match the query is
     *        placed where its first matching subtask would have been.
     *      - Child tasks (and list items) are shown in their original order in their Markdown file.
     * @param tasks - the tasks that matched the query, in sorted order.
     * @private
     */
    private async addTreeTaskList(tasks: ListItem[]): Promise<void> {
        const outermostTasks: IndexedListItem[] = [];
        for (const [index, task] of tasks.entries()) {
            const outermostTask = QueryResultsRendererBase.outermostTask(task);
            if (outermostTask !== task && this.matchedTasks.has(outermostTask)) {
                // The outermost task matched too, so it is placed in its own sorted position.
                continue;
            }
            if (!outermostTasks.some(([listItem]) => listItem === outermostTask)) {
                outermostTasks.push([outermostTask, index]);
            }
        }

        await this.addTreeItems(outermostTasks);
    }

    /**
     * @param listItems - the items to render, each with its index in the list it was found in.
     */
    private async addTreeItems(listItems: IndexedListItem[]): Promise<void> {
        for (const [listItem, listItemIndex] of listItems) {
            this.beginListItem();

            if (listItem instanceof Task) {
                await this.addTask(listItem, listItemIndex);
            } else {
                await this.addListItem(listItem, listItemIndex);
            }

            const shownChildren: IndexedListItem[] = [];
            for (const [index, child] of listItem.children.entries()) {
                if (this.isShownInTree(child)) {
                    shownChildren.push([child, index]);
                }
            }
            await this.addChildren(shownChildren);
        }
    }

    private isShownInTree(listItem: ListItem): boolean {
        if (this.matchedTasksAndTheirAncestors.has(listItem)) {
            return true;
        }
        // A plain list item with no subtasks, such as a note, is always shown under its parent.
        return !listItem.isTask && !QueryResultsRendererBase.containsTasks(listItem);
    }

    /**
     * The outermost task that contains the task, or the task itself if it is not inside another task.
     */
    private static outermostTask(task: ListItem): ListItem {
        let outermostTask = task;
        let parentTask = task.findClosestParentTask();
        while (parentTask !== null) {
            outermostTask = parentTask;
            parentTask = parentTask.findClosestParentTask();
        }
        return outermostTask;
    }

    /**
     * The tasks, together with all their parents up to their outermost tasks, including any plain list items
     * in between. Plain list items outside the outermost tasks are not included.
     */
    private static matchedTasksAndAncestors(tasks: ListItem[]): Set<ListItem> {
        const result = new Set<ListItem>();
        for (const task of tasks) {
            result.add(task);
            const outermostTask = QueryResultsRendererBase.outermostTask(task);
            let ancestor = task.parent;
            while (ancestor !== null && task !== outermostTask) {
                result.add(ancestor);
                if (ancestor === outermostTask) {
                    break;
                }
                ancestor = ancestor.parent;
            }
        }
        return result;
    }

    private static containsTasks(listItem: ListItem): boolean {
        return listItem.children.some((child) => child.isTask || QueryResultsRendererBase.containsTasks(child));
    }

    protected abstract beginListItem(): void;

    protected abstract addListItem(listItem: ListItem, listItemIndex: number): Promise<void>;

    protected abstract addTask(task: Task, taskIndex: number): Promise<void>;

    private async addChildren(children: IndexedListItem[]) {
        if (children.length === 0) {
            return;
        }

        this.nestingLevel += 1;
        this.beginTaskList();
        try {
            await this.addTreeItems(children);
        } finally {
            this.endTaskList();
            this.nestingLevel -= 1;
        }
    }

    /**
     * Display headings for a group of tasks.
     * @param group - The group whose headings are being displayed. The group may be empty,
     *                in which case no headings will be added.
     * @private
     */
    protected async addGroupHeadings(group: TaskGroup) {
        const lastHeadingIndex = group.groupHeadings.length - 1;

        for (const [index, heading] of group.groupHeadings.entries()) {
            const groupTaskCountSuffix = this.groupTaskCountSuffix(group, index, lastHeadingIndex);
            await this.addGroupHeading(heading, groupTaskCountSuffix);
        }
    }

    private groupTaskCountSuffix(group: TaskGroup, headingIndex: number, lastHeadingIndex: number): string {
        if (this.query.queryLayoutOptions.hideGroupCount) {
            return '';
        }

        if (headingIndex !== lastHeadingIndex) {
            return '';
        }

        return `(${group.describeTaskCount()})`;
    }

    protected abstract addGroupHeading(group: GroupDisplayHeading, groupTaskCountText: string): Promise<void>;
}
