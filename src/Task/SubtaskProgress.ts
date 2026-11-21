import { Status } from 'Statuses/Status';
import { StatusType } from 'Statuses/StatusConfiguration';
import type { StatusRegistry } from 'Statuses/StatusRegistry';

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
