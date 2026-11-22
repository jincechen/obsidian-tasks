import { PresetsSettingsUI } from 'Config/PresetsSettingsUI';
import { getSettings, resetSettings, updateSettings } from 'Config/Settings';
import { lastModalState, resetLastModalState } from '../__mocks__/obsidian';

const plugin = {
    app: {} as any,
    saveSettings: vi.fn(async () => {}),
} as any;

const events = {
    triggerReloadOpenSearchResults: vi.fn(),
} as any;

function getPresetsList() {
    const ui = new PresetsSettingsUI(plugin, events);
    const [list] = ui.getPresetsDefinitions(() => {}) as unknown as Array<{ onDelete: (index: number) => unknown }>;
    return list;
}

function clickModalButton(text: string) {
    const buttons = [...lastModalState.modal!.contentEl.querySelectorAll('button')];
    buttons.find((button) => button.textContent === text)!.click();
}

describe('PresetsSettingsUI', () => {
    beforeEach(() => {
        resetSettings();
        updateSettings({ presets: { existing: 'not done' } });
        resetLastModalState();
    });

    afterEach(() => {
        resetSettings();
    });

    it('should only delete a preset once the deletion is confirmed', async () => {
        const deleted = getPresetsList().onDelete(0);

        expect(lastModalState.title).toEqual("Delete preset 'existing'?");
        expect(getSettings().presets).toEqual({ existing: 'not done' });

        clickModalButton('Delete');
        await deleted;
        expect(getSettings().presets).toEqual({});
    });

    it('should keep a preset if the deletion is cancelled', async () => {
        const deleted = getPresetsList().onDelete(0);

        clickModalButton('Cancel');
        await deleted;
        expect(getSettings().presets).toEqual({ existing: 'not done' });
    });
});
