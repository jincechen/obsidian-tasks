import { resetSettings } from 'Config/Settings';
import { subtaskProgressSettingsWith, subtaskProgressStepOptions } from 'Config/SubtaskProgressModal';
import { StatusConfiguration, StatusType } from 'Statuses/StatusConfiguration';
import { StatusRegistry } from 'Statuses/StatusRegistry';
import { progressConfig } from 'Task/SubtaskProgress';

describe('SubtaskProgressModal', () => {
    beforeEach(() => {
        // Todo → Scheduled → In Progress → Done
        StatusRegistry.getInstance().set([
            new StatusConfiguration(' ', 'Todo', '<', true, StatusType.TODO),
            new StatusConfiguration('x', 'Done', ' ', true, StatusType.DONE),
            new StatusConfiguration('<', 'Scheduled', '/', true, StatusType.IN_PROGRESS),
            new StatusConfiguration('/', 'In Progress', 'x', true, StatusType.IN_PROGRESS),
        ]);
    });

    afterEach(() => {
        StatusRegistry.getInstance().resetToDefaultStatuses();
        resetSettings();
    });

    it('offers only steps that keep Total before the middle layer, before Completed', () => {
        expect(subtaskProgressStepOptions(progressConfig())).toEqual({
            total: [0, 1, 2],
            middle: [1, 2],
            completed: [1, 2, 3],
        });

        const config = { ...progressConfig(), total: 1, completed: 2 };
        expect(subtaskProgressStepOptions(config)).toEqual({
            total: [0, 1, 2],
            middle: [],
            completed: [2, 3],
        });
    });

    it('saves the steps as status symbols', () => {
        expect(subtaskProgressSettingsWith(progressConfig(), { middle: 1 })).toEqual({
            totalFrom: ' ',
            middleFrom: '<',
            completedFrom: 'x',
        });
        expect(subtaskProgressSettingsWith(progressConfig(), { middle: null, completed: 2 })).toEqual({
            totalFrom: ' ',
            middleFrom: '',
            completedFrom: '/',
        });
    });
});
