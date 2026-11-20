import type { App } from 'obsidian';
import { State } from '../../src/Obsidian/Cache';
import type { FilterOrErrorMessage } from '../../src/Query/Filter/FilterOrErrorMessage';
import { Query } from '../../src/Query/Query';
import type {
    HTMLQueryRendererParameters,
    HtmlQueryResultsRenderer,
} from '../../src/Renderer/HtmlQueryResultsRenderer';
import { MarkdownQueryResultsRenderer } from '../../src/Renderer/MarkdownQueryResultsRenderer';
import { ListItem } from '../../src/Task/ListItem';
import { Task } from '../../src/Task/Task';
import { TaskLocation } from '../../src/Task/TaskLocation';
import { verifyWithFileExtension } from '../TestingTools/ApprovalTestHelpers';
import { prettifyHTML } from '../TestingTools/HTMLHelpers';
import { createTestTasksFile } from '../TestingTools/TasksFileHelpers';
import { toMarkdown } from '../TestingTools/TestHelpers';

export const mockHTMLRenderer = async (_obsidianApp: App, text: string, element: HTMLSpanElement, _path: string) => {
    // Contrary to the default mockTextRenderer(),
    // instead of the rendered HTMLSpanElement.innerText,
    // we need the plain HTML here like in TaskLineRenderer.renderComponentText(),
    // to ensure that description and tags are retained.
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    while (doc.body.firstChild) {
        element.appendChild(doc.body.firstChild);
    }
};

export const mockTextRenderer = async (_obsidianApp: App, text: string, element: HTMLSpanElement, _path: string) => {
    element.innerText = text;
};

export function makeHtmlQueryRendererParameters(allTasks: Task[]): HTMLQueryRendererParameters {
    return {
        allTasks: () => allTasks,
        allMarkdownFiles: () => [],
        backlinksClickHandler: () => Promise.resolve(),
        backlinksMousedownHandler: () => Promise.resolve(),
        editTaskPencilClickHandler: () => {},
    };
}

/**
 * Read the tasks from indented Markdown lines, linking each task and list item to its parent.
 * Each nesting level must be indented by 4 spaces.
 * @returns the tasks, without the plain list items, which are reachable through the tasks' parents and children.
 */
export function readNestedTasks(markdown: string): Task[] {
    const tasksFile = createTestTasksFile('nested.md');
    const lines = markdown.split('\n').filter((line) => line.trim() !== '');
    const parentAtDepth: ListItem[] = [];
    const tasks: Task[] = [];
    for (const [lineNumber, line] of lines.entries()) {
        const depth = line.search(/\S/) / 4;
        const parent = depth > 0 ? parentAtDepth[depth - 1] : null;
        const taskLocation = new TaskLocation(tasksFile, lineNumber, 0, tasks.length, null);

        const taskWithoutParent = Task.fromLine({ line, taskLocation, fallbackDate: null });
        let listItem: ListItem;
        if (taskWithoutParent) {
            const task = new Task({ ...taskWithoutParent, parent });
            tasks.push(task);
            listItem = task;
        } else {
            listItem = ListItem.fromListItemLine(line, parent, taskLocation)!;
        }
        parentAtDepth[depth] = listItem;
        parentAtDepth.length = depth + 1;
    }
    return tasks;
}

export function createMarkdownRenderer(source: string) {
    const tasksFile = createTestTasksFile('query.md');
    const query = new Query(source, tasksFile);

    const renderer = new MarkdownQueryResultsRenderer(source, tasksFile, query);
    return { renderer, query };
}

export async function renderMarkdown(source: string, tasks: Task[]) {
    const { renderer, query } = createMarkdownRenderer(source);
    const queryResult = query.applyQueryToTasks(tasks);
    await renderer.renderQuery(State.Warm, queryResult);
    return {
        markdown: '\n' + renderer.markdown,
        queryResult,
        rerenderWithFilter: async (filter: FilterOrErrorMessage) => {
            expect(filter).toBeValid();

            const filteredResult = queryResult.applyFilter(filter.filter!);
            await renderer.renderQuery(State.Warm, filteredResult);
            return { filteredMarkdown: '\n' + renderer.markdown };
        },
    };
}

export async function tasksMarkdownAndPrettifiedHtml(container: HTMLDivElement, allTasks: Task[]) {
    const tasksAsMarkdown = `<!--
${toMarkdown(allTasks)}
-->\n\n`;

    const prettyHTML = await prettifyHTML(container.outerHTML);
    return { tasksAsMarkdown, prettyHTML };
}

export async function verifyHtmlFromRenderer(
    renderer: HtmlQueryResultsRenderer,
    state: State,
    query: Query,
    allTasks: Task[],
): Promise<HTMLDivElement> {
    const container = document.createElement('div');
    renderer.content = container;
    await renderer.renderQuery(state, query.applyQueryToTasks(allTasks));

    await verifyRenderedTasks(container, allTasks);
    return container;
}

export async function verifyRenderedTasks(container: HTMLDivElement, allTasks: Task[]): Promise<string> {
    const { tasksAsMarkdown, prettyHTML } = await tasksMarkdownAndPrettifiedHtml(container, allTasks);
    verifyWithFileExtension(tasksAsMarkdown + prettyHTML, 'html');
    return prettyHTML;
}

export async function renderTasks(
    state: State,
    renderer: HtmlQueryResultsRenderer,
    allTasks: Task[],
    query: Query,
): Promise<HTMLDivElement> {
    const container = document.createElement('div');

    renderer.content = container;
    await renderer.renderQuery(state, query.applyQueryToTasks(allTasks));
    return container;
}
