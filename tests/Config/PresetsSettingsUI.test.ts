import {
    lastModalState,
    recordedLegacySettings,
    resetLastModalState,
    resetRecordedLegacySettings,
} from '../__mocks__/obsidian';
import { PresetsSettingsUI } from '../../src/Config/PresetsSettingsUI';
import { getSettings, resetSettings, updateSettings } from '../../src/Config/Settings';

const plugin = {
    app: {} as any,
    saveSettings: jest.fn(async () => {}),
} as any;

const events = {
    triggerReloadOpenSearchResults: jest.fn(),
} as any;

function fillInAndSaveModal(name: string, query: string) {
    const contentEl = lastModalState.modal!.contentEl;
    contentEl.querySelector('input')!.value = name;
    contentEl.querySelector('textarea')!.value = query;
    const buttons = contentEl.querySelectorAll('button');
    buttons[buttons.length - 1].click();
    return contentEl;
}

describe('PresetsSettingsUI', () => {
    beforeEach(() => {
        resetSettings();
        updateSettings({ presets: { existing: 'not done' } });
        resetLastModalState();
        resetRecordedLegacySettings();
    });

    afterEach(() => {
        resetSettings();
    });

    it('legacy "Add preset" should open the preset editor', () => {
        const ui = new PresetsSettingsUI(plugin, events);
        ui.renderPresetsSettings(document.createElement('div'));

        const addButton = recordedLegacySettings
            .flatMap((record) => record.controls as Array<Record<string, unknown>>)
            .find((control) => control.text === 'Add preset')!;
        (addButton.callback as () => void)();

        expect(lastModalState.opened).toBe(true);
        expect(getSettings().presets).toEqual({ existing: 'not done' });

        fillInAndSaveModal('new_preset', 'done');
        expect(getSettings().presets).toEqual({ existing: 'not done', new_preset: 'done' });
    });

    it('preset editor should reject an empty query', () => {
        const ui = new PresetsSettingsUI(plugin, events);
        const [list] = ui.getPresetsDefinitions(() => {}) as unknown as Array<{ addItem: { action: () => void } }>;
        list.addItem.action();

        const contentEl = fillInAndSaveModal('new_preset', '   ');

        expect(getSettings().presets).toEqual({ existing: 'not done' });
        expect(contentEl.querySelector('textarea')!.getAttribute('test-displayed-tooltip')).toEqual('Required');
    });
});
