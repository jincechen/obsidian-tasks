import { GlobalFilter } from 'Config/GlobalFilter';
import { Status } from 'Statuses/Status';
import { StatusType } from 'Statuses/StatusConfiguration';
import { StatusRegistry } from 'Statuses/StatusRegistry';
import type { ListItem } from 'Task/ListItem';
import type { Task } from 'Task/Task';
import { TaskRegularExpressions } from 'Task/TaskRegularExpressions';

/**
 * The counts shown by a subtask progress bar, such as '2/5':
 * - total: the subtasks at or after the 'total' step (y).
 * - done: the subtasks at or after the 'completed' step (x).
 *
 * See {@link SubtaskProgressConfig}.
 */
export interface SubtaskProgress {
    done: number;
    total: number;
}

/**
 * The statuses that subtask progress is counted against.
 * Each step is an index in {@link sequence}, and counts the subtasks with that status or a later one.
 */
export interface SubtaskProgressConfig {
    /** The steps from Todo to the first Done status, following each status's next status. */
    sequence: Status[];
    total: number;
    completed: number;
}

function isCountable(status: Status): boolean {
    switch (status.type) {
        case StatusType.TODO:
        case StatusType.IN_PROGRESS:
        case StatusType.ON_HOLD:
        case StatusType.DONE:
            return true;
        default:
            return false;
    }
}

/**
 * The steps that subtask progress is counted against: the statuses visited when toggling from Todo,
 * up to and including the first Done status.
 */
export function statusSequence(statusRegistry: StatusRegistry): Status[] {
    const sequence: Status[] = [];
    let status = statusRegistry.bySymbol(Status.TODO.symbol);
    while (status.type !== StatusType.EMPTY && isCountable(status) && !sequence.includes(status)) {
        sequence.push(status);
        if (status.type === StatusType.DONE) {
            break;
        }
        status = statusRegistry.getNextStatus(status);
    }
    return sequence;
}

/**
 * The step of a status in the sequence, or null if subtasks with this status are not counted.
 *
 * A status that is not in the sequence counts as the step before the one it leads to.
 * For example, in the sequence Todo → Scheduled → In Progress → Done, a 'Postponed' status whose next status
 * is In Progress counts like Scheduled, and one whose next status is Todo is not counted.
 */
export function progressStep(status: Status, sequence: Status[], statusRegistry: StatusRegistry): number | null {
    const index = sequence.findIndex((step) => step.symbol === status.symbol);
    if (index !== -1) {
        return index;
    }
    if (!isCountable(status)) {
        return null;
    }
    if (status.type === StatusType.DONE) {
        return sequence.length - 1;
    }

    const visited = new Set<string>([status.symbol]);
    let next = statusRegistry.getNextStatus(status);
    while (next.type !== StatusType.EMPTY && !visited.has(next.symbol)) {
        const nextIndex = sequence.findIndex((step) => step.symbol === next.symbol);
        if (nextIndex !== -1) {
            return nextIndex > 0 ? nextIndex - 0.5 : null;
        }
        visited.add(next.symbol);
        next = statusRegistry.getNextStatus(next);
    }
    return null;
}

/**
 * The steps to count against: all subtasks from Todo, and those at Done as completed.
 */
export function progressConfig(statusRegistry = StatusRegistry.getInstance()): SubtaskProgressConfig {
    const sequence = statusSequence(statusRegistry);
    return { sequence, total: 0, completed: Math.max(sequence.length - 1, 0) };
}

/**
 * Count the statuses against the chosen steps. Statuses before the 'total' step are not counted at all.
 * @returns null if there is nothing to count.
 */
export function tallyStatuses(
    statuses: Status[],
    config: SubtaskProgressConfig,
    statusRegistry = StatusRegistry.getInstance(),
): SubtaskProgress | null {
    if (config.sequence.length < 2) {
        // The status cycle does not lead from Todo to Done, so there is no progress to show.
        return null;
    }
    const progress: SubtaskProgress = { done: 0, total: 0 };
    for (const status of statuses) {
        const step = progressStep(status, config.sequence, statusRegistry);
        if (step === null || step < config.total) {
            continue;
        }
        progress.total++;
        if (step >= config.completed) {
            progress.done++;
        }
    }
    return progress.total > 0 ? progress : null;
}

/**
 * The progress of all the tasks nested under a list item, including those under plain list items.
 */
export function subtaskProgressOfListItem(
    item: ListItem,
    config: SubtaskProgressConfig = progressConfig(),
): SubtaskProgress | null {
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
    return tallyStatuses(statuses, config);
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
export function subtaskProgressFromLines(
    lines: readonly string[],
    parentIndex: number,
    config: SubtaskProgressConfig = progressConfig(),
): SubtaskProgress | null {
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
    return tallyStatuses(statuses, config, statusRegistry);
}
