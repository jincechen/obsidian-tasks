import type { Comparator } from '../Sort/Sorter';
import type { Task } from '../../Task/Task';
import { Readiness } from '../../Task/Readiness';
import { FilterInstructionsBasedField } from './FilterInstructionsBasedField';

/**
 * Support 'sort by readiness': sort tasks by how ready they are to be worked on,
 * using what each of their dates means. See {@link Readiness}.
 *
 * Unlike 'sort by urgency', which blends dates and priority into one score,
 * this only sorts by dates, so that it can be combined with 'sort by priority' in either order.
 */
export class ReadinessField extends FilterInstructionsBasedField {
    public fieldName(): string {
        return 'readiness';
    }

    // -----------------------------------------------------------------------------------------------------------------
    // Sorting
    // -----------------------------------------------------------------------------------------------------------------

    supportsSorting(): boolean {
        return true;
    }

    public comparator(): Comparator {
        return (a: Task, b: Task) => Readiness.compare(a, b);
    }
}
