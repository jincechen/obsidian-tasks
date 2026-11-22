import { StatusType } from 'Statuses/StatusConfiguration';
import { i18n } from 'i18n/i18n';

/**
 * Human-readable label for a {@link StatusType}. The enum values are
 * SCREAMING_SNAKE_CASE for storage; we surface friendlier titles in the UI.
 */
export function humanizeStatusType(type: StatusType): string {
    switch (type) {
        case StatusType.TODO:
            return i18n.t('settings.statuses.types.todo');
        case StatusType.IN_PROGRESS:
            return i18n.t('settings.statuses.types.inProgress');
        case StatusType.ON_HOLD:
            return i18n.t('settings.statuses.types.onHold');
        case StatusType.DONE:
            return i18n.t('settings.statuses.types.done');
        case StatusType.CANCELLED:
            return i18n.t('settings.statuses.types.cancelled');
        case StatusType.NON_TASK:
            return i18n.t('settings.statuses.types.nonTask');
        case StatusType.EMPTY:
            return i18n.t('settings.statuses.types.empty');
    }
}
