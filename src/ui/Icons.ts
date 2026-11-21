import { addIcon } from 'obsidian';
import { fontAwesomeIcons, fontAwesomeSvgContent } from 'ui/FontAwesomeIcons';

/**
 * The icons that Tasks shows in its user interface. They are for display only: notes still use the task format's symbols.
 * Names are Obsidian's Lucide icons, except 'tasks-fa-*', registered by {@link registerTasksIcons}.
 */
export const TasksIcon = {
    // NEW_TASK_FIELD_EDIT_REQUIRED
    createdDate: 'plus-circle',
    startDate: 'plane-takeoff',
    scheduledDate: 'hourglass',
    dueDate: 'calendar',
    doneDate: 'check-circle',
    cancelledDate: 'x-circle',
    recurrence: 'repeat',
    onCompletion: 'flag',
    dependsOn: 'lock',
    id: 'fingerprint',
    link: 'link',

    edit: 'pencil',
    postpone: 'fast-forward',
    newLine: 'corner-down-left',
    valid: 'check',
    remove: 'x',

    priorityHighest: 'tasks-fa-angles-up',
    priorityHigh: 'tasks-fa-angle-up',
    priorityMedium: 'tasks-fa-caret-up',
    priorityLow: 'tasks-fa-angle-down',
    priorityLowest: 'tasks-fa-angles-down',
} as const;

/**
 * Register the non-Lucide icons with Obsidian. Call once, when the plugin loads.
 */
export function registerTasksIcons() {
    for (const [name, icon] of Object.entries(fontAwesomeIcons)) {
        addIcon(`tasks-fa-${name}`, fontAwesomeSvgContent(icon));
    }
}
