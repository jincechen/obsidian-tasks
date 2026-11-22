import { confirmDestructiveAction } from 'Config/ConfirmModal';
import { lastModalState, mockApp, resetLastModalState } from '../__mocks__/obsidian';

describe('confirmDestructiveAction', () => {
    beforeEach(() => {
        resetLastModalState();
    });

    function askAndClick(buttonText: string) {
        const confirmed = confirmDestructiveAction(mockApp, {
            title: 'Delete it?',
            message: 'This cannot be undone.',
            confirmText: 'Delete',
        });
        expect(lastModalState.title).toEqual('Delete it?');
        const buttons = [...lastModalState.modal!.contentEl.querySelectorAll('button')];
        buttons.find((button) => button.textContent === buttonText)!.click();
        return confirmed;
    }

    it('should resolve to true when confirmed', async () => {
        expect(await askAndClick('Delete')).toEqual(true);
    });

    it('should resolve to false when cancelled', async () => {
        expect(await askAndClick('Cancel')).toEqual(false);
    });
});
