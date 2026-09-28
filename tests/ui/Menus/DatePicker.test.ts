import moment from 'moment/moment';

import { promptForDate } from '../../../src/ui/Menus/DatePicker';
import { TaskBuilder } from '../../TestingTools/TaskBuilder';
import { TestableTaskSaver } from './MenuTestingHelpers';

window.moment = moment;

// Mimic of Obsidian's setCssProps(), which the Jest setup does not provide.
HTMLElement.prototype.setCssProps = function (this: HTMLElement, props: Record<string, string>) {
    Object.entries(props).forEach(([name, value]) => this.style.setProperty(name, value));
};

function openPicker() {
    const anchor = document.body.createSpan();
    const task = new TaskBuilder().dueDate('2023-12-03').build();
    promptForDate(anchor, task, 'dueDate', TestableTaskSaver.testableTaskSaver);
    jest.runAllTimers();
    return document.querySelector('.tasks-date-picker-popover input') as HTMLInputElement;
}

beforeEach(() => {
    jest.useFakeTimers();
    TestableTaskSaver.reset();
    document.body.empty();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('promptForDate', () => {
    it('should show a date input with the current date', () => {
        const input = openPicker();

        expect(input.type).toEqual('date');
        expect(input.value).toEqual('2023-12-03');
    });

    it('should close on Escape without saving', () => {
        openPicker();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        expect(document.querySelector('.tasks-date-picker-popover')).toBeNull();
        expect(TestableTaskSaver.tasksBeingSaved).toBeUndefined();
    });

    it('should save the new date and close', () => {
        const input = openPicker();

        input.value = '2024-01-15';
        input.dispatchEvent(new Event('change'));

        expect(document.querySelector('.tasks-date-picker-popover')).toBeNull();
        expect(TestableTaskSaver.tasksBeingSaved?.[0].due.formatAsDate()).toEqual('2024-01-15');
    });

    it('should remove the date when cleared', () => {
        const input = openPicker();

        input.value = '';
        input.dispatchEvent(new Event('change'));

        expect(TestableTaskSaver.tasksBeingSaved?.[0].dueDate).toBeNull();
    });
});
