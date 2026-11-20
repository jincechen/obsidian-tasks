import { resetSettings } from '../../src/Config/Settings';
import { subtaskProgressSettingsWith, subtaskProgressStepOptions } from '../../src/Config/SubtaskProgressModal';
import { StatusConfiguration, StatusType } from '../../src/Statuses/StatusConfiguration';
import { StatusRegistry } from '../../src/Statuses/StatusRegistry';
import { progressConfig } from '../../src/Task/SubtaskProgress';

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
            middle2: [],
            completed: [1, 2, 3],
        });

        const config = { ...progressConfig(), total: 1, completed: 2 };
        expect(subtaskProgressStepOptions(config)).toEqual({
            total: [0, 1, 2],
            middle: [],
            middle2: [],
            completed: [2, 3],
        });
    });

    it('offers the second middle layer only after the first one, and keeps the first one before it', () => {
        expect(subtaskProgressStepOptions({ ...progressConfig(), middle: 1 })).toMatchObject({
            middle: [1, 2],
            middle2: [2],
        });
        expect(subtaskProgressStepOptions({ ...progressConfig(), middle: 1, middle2: 2 })).toMatchObject({
            middle: [1],
            middle2: [2],
        });
    });

    it('saves the steps as status symbols', () => {
        expect(subtaskProgressSettingsWith(progressConfig(), { middle: 1 })).toEqual({
            totalFrom: ' ',
            middleFrom: '<',
            middle2From: '',
            completedFrom: 'x',
        });
        expect(subtaskProgressSettingsWith(progressConfig(), { middle: null, completed: 2 })).toEqual({
            totalFrom: ' ',
            middleFrom: '',
            middle2From: '',
            completedFrom: '/',
        });
        expect(subtaskProgressSettingsWith(progressConfig(), { middle: 1, middle2: 2 })).toMatchObject({
            middleFrom: '<',
            middle2From: '/',
        });
    });
});
