import { GlobalFilter } from '../Config/GlobalFilter';
import { getSettings } from '../Config/Settings';
import type { Status } from '../Statuses/Status';
import { StatusType } from '../Statuses/StatusConfiguration';
import { StatusRegistry } from '../Statuses/StatusRegistry';
import type { ListItem } from './ListItem';
import type { Task } from './Task';
import { TaskRegularExpressions } from './TaskRegularExpressions';

/**
 * How many of a task's subtasks, at any depth, are done, and how many have the intermediate status, if any.
 * See {@link intermediateStatus}.
 */
export interface SubtaskProgress {
    done: number;
    intermediate: number;
    total: number;
}

function countsTowardsTotal(type: StatusType): boolean {
    switch (type) {
        case StatusType.DONE:
        case StatusType.TODO:
        case StatusType.IN_PROGRESS:
        case StatusType.ON_HOLD:
            return true;
        default:
            return false;
    }
}

/**
 * The statuses that can be shown as the middle layer of the progress bar: those that are counted, but not done.
 * The default Todo status is left out, as almost every subtask would have it.
 */
export function intermediateStatusOptions(statusRegistry: StatusRegistry): Status[] {
    return statusRegistry.registeredStatuses.filter(
        (status) => countsTowardsTotal(status.type) && status.type !== StatusType.DONE && status.symbol !== ' ',
    );
}

/**
 * The status chosen in settings to be shown as the middle layer of the progress bar.
 * @returns null if none is chosen, or the chosen status no longer exists.
 */
export function intermediateStatus(statusRegistry = StatusRegistry.getInstance()): Status | null {
    const symbol = getSettings().subtaskProgressIntermediateStatus;
    if (symbol === '') {
        return null;
    }
    return intermediateStatusOptions(statusRegistry).find((status) => status.symbol === symbol) ?? null;
}

/**
 * Count the statuses. Cancelled and non-task statuses are left out, so they do not prevent 100%.
 * @param statuses
 * @param intermediate - the status to count in {@link SubtaskProgress.intermediate}, if any.
 * @returns null if there is nothing to count.
 */
export function tallyStatuses(statuses: Status[], intermediate: Status | null): SubtaskProgress | null {
    const progress: SubtaskProgress = { done: 0, intermediate: 0, total: 0 };
    for (const status of statuses) {
        if (!countsTowardsTotal(status.type)) {
            continue;
        }
        progress.total++;
        if (status.type === StatusType.DONE) {
            progress.done++;
        } else if (intermediate !== null && status.symbol === intermediate.symbol) {
            progress.intermediate++;
        }
    }
    return progress.total > 0 ? progress : null;
}

/**
 * The progress of all the tasks nested under a list item, including those under plain list items.
 */
export function subtaskProgressOfListItem(item: ListItem): SubtaskProgress | null {
    const statuses: Status[] = [];
    const collect = (listItem: ListItem) => {
        for (const child of listItem.children) {
            if (child.isTask) {
                statuses.push((child as Task).status);
            }
            collect(child);
        }
    };
    collect(item);
    return tallyStatuses(statuses, intermediateStatus());
}

const tabWidth = 4;

/**
 * The block quote depth (number of '>') and the width of the indentation after it.
 */
function indentationOf(line: string): { quoteDepth: number; width: number } {
    const indentation = line.match(TaskRegularExpressions.indentationRegex)?.[1] ?? '';
    const quoteDepth = (indentation.match(/>/g) ?? []).length;
    const afterQuotes = indentation.substring(indentation.lastIndexOf('>') + 1);
    let width = 0;
    for (const character of afterQuotes) {
        width += character === '\t' ? tabWidth : 1;
    }
    return { quoteDepth, width };
}

/**
 * The progress of the tasks indented under the task on line `parentIndex`.
 * @returns null if the line is not a task, or it has no subtasks to count.
 */
export function subtaskProgressFromLines(lines: readonly string[], parentIndex: number): SubtaskProgress | null {
    const parentLine = lines[parentIndex] ?? '';
    const globalFilter = GlobalFilter.getInstance();
    if (!TaskRegularExpressions.taskRegex.test(parentLine)) {
        return null;
    }
    if (!globalFilter.isEmpty() && !globalFilter.includedIn(parentLine)) {
        return null;
    }
    const parent = indentationOf(parentLine);

    const statusRegistry = StatusRegistry.getInstance();
    const statuses: Status[] = [];
    for (let i = parentIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') {
            continue;
        }

        // Subtasks are more deeply indented, within the same block quote or callout, if any.
        const { quoteDepth, width } = indentationOf(line);
        if (quoteDepth !== parent.quoteDepth || width <= parent.width) {
            break;
        }

        const taskMatch = line.match(TaskRegularExpressions.taskRegex);
        if (!taskMatch) {
            continue;
        }
        if (!globalFilter.isEmpty() && !globalFilter.includedIn(line)) {
            continue;
        }
        statuses.push(statusRegistry.bySymbolOrCreate(taskMatch[3]));
    }
    return tallyStatuses(statuses, intermediateStatus(statusRegistry));
}

/**
 * Add a slim progress bar and a 'done/total' count, such as '2/5', to the element.
 *
 * The bar has up to three layers: all the subtasks (the track), then those with the intermediate status, if any,
 * then those that are done.
 * @param parent
 * @param progress
 * @param intermediate - the status counted in {@link SubtaskProgress.intermediate}, if any, to describe it.
 */
export function renderSubtaskProgress(
    parent: HTMLElement,
    progress: SubtaskProgress,
    intermediate: Status | null = intermediateStatus(),
): HTMLSpanElement {
    const { done, total } = progress;
    const donePercentage = Math.round((done / total) * 100);
    const intermediatePercentage = Math.round((progress.intermediate / total) * 100);

    let label = `Subtasks done: ${done} of ${total}`;
    if (intermediate !== null) {
        label += `, ${intermediate.name}: ${progress.intermediate}`;
    }

    const container = parent.createSpan({ cls: 'tasks-progress' });
    container.setAttribute('role', 'progressbar');
    container.setAttribute('aria-valuemin', '0');
    container.setAttribute('aria-valuemax', total.toString());
    container.setAttribute('aria-valuenow', done.toString());
    container.setAttribute('aria-label', label);
    container.setAttribute('title', label);
    if (done === total) {
        container.setAttribute('data-complete', '');
    }

    const track = container.createSpan({ cls: 'tasks-progress-track' });
    if (progress.intermediate > 0) {
        const intermediateFill = track.createSpan({ cls: 'tasks-progress-intermediate' });
        intermediateFill.style.insetInlineStart = `${donePercentage}%`;
        intermediateFill.style.width = `${intermediatePercentage}%`;
    }
    const fill = track.createSpan({ cls: 'tasks-progress-fill' });
    fill.style.width = `${donePercentage}%`;

    container.createSpan({ cls: 'tasks-progress-count', text: `${done}/${total}` });
    return container;
}
