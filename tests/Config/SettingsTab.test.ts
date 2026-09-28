import { verifyAsJson } from 'approvals/lib/Providers/Jest/JestApprovals';
import {
    lastModalState,
    noticeMessages,
    recordedLegacySettings,
    resetLastModalState,
    resetRecordedLegacySettings,
} from '../__mocks__/obsidian';

import { SettingsTab } from '../../src/Config/SettingsTab';
import { getSettings, resetSettings } from '../../src/Config/Settings';
import { Status } from '../../src/Statuses/Status';
import { StatusConfiguration, StatusType } from '../../src/Statuses/StatusConfiguration';
import { StatusRegistry } from '../../src/Statuses/StatusRegistry';
import { i18n } from '../../src/i18n/i18n';

// Convert the declarative settings tree into approval-friendly JSON.
// This preserves visible text/HTML and replaces callbacks with stable markers.

// The promoted keys will be saved first, in that order.
// All other keys will be sorted alphabetically.
const promotedKeys = ['name', 'heading', 'desc'] as const;
const promotedKeySet = new Set<string>(promotedKeys);

function compareApprovalKeys(a: string, b: string): number {
    const aPromoted = promotedKeySet.has(a);
    const bPromoted = promotedKeySet.has(b);

    if (aPromoted && bPromoted) {
        return (
            promotedKeys.indexOf(a as (typeof promotedKeys)[number]) -
            promotedKeys.indexOf(b as (typeof promotedKeys)[number])
        );
    }

    if (aPromoted) {
        return -1;
    }

    if (bPromoted) {
        return 1;
    }

    return a.localeCompare(b);
}

function serializeForApproval(value: unknown): unknown {
    if (value instanceof DocumentFragment) {
        const div = document.createElement('div');
        div.appendChild(value.cloneNode(true));
        return div.innerHTML;
    }

    if (Array.isArray(value)) {
        return value.map((item) => serializeForApproval(item));
    }

    if (typeof value === 'function') {
        return '[Function]';
    }

    if (value !== null && typeof value === 'object') {
        const record = Object.fromEntries(
            Object.entries(value)
                .sort(([a], [b]) => compareApprovalKeys(a, b))
                .map(([key, entryValue]) => {
                    // Extra buttons can hide user-visible modal text behind onClick handlers,
                    // so capture a little more than just "[Function]" for these.
                    if (key === 'extraButtons' && Array.isArray(entryValue)) {
                        return [
                            key,
                            entryValue.map((buttonFactory) => serializeExtraButton(buttonFactory as Function)),
                        ];
                    }
                    return [key, serializeForApproval(entryValue)];
                }),
        );
        return record;
    }

    return value;
}

// Some extraButtons open modals from their onClick handlers.
// Give the factory a fake button, then run the captured click callback
// so approval tests can see the modal title and body text.
function serializeExtraButton(buttonFactory: Function): unknown {
    resetLastModalState();

    let onClickCallback: (() => void) | undefined;

    const buttonRecord: Record<string, unknown> = {};

    const fakeButton = {
        setIcon(icon: string) {
            buttonRecord.icon = icon;
            return this;
        },
        setTooltip(tooltip: string) {
            buttonRecord.tooltip = tooltip;
            return this;
        },
        onClick(callback: () => void) {
            onClickCallback = callback;
            buttonRecord.onClick = '[Function]';
            return this;
        },
    };

    buttonFactory(fakeButton);

    if (onClickCallback) {
        onClickCallback();

        if (lastModalState.opened) {
            buttonRecord.modal = {
                title: lastModalState.title,
                html: lastModalState.html,
            };
        }
    }

    return buttonRecord;
}

const plugin = {
    app: {} as any,
    manifest: { version: 'test-version' },
    saveSettings: jest.fn(async () => {}),
    getTasks: jest.fn(() => []),
} as any;

const events = {
    triggerReloadVault: jest.fn(),
    triggerReloadOpenSearchResults: jest.fn(),
} as any;

describe('SettingsTab post-1.13', () => {
    const settingsTab = new SettingsTab({ plugin, events });

    it('all settings', () => {
        // TODO Show the 'Global Query' modal
        // TODO Show the 'Enable custom searches' modal.
        // TODO Show options in the 'Task count location' dropdown.
        verifyAsJson(serializeForApproval(settingsTab.getSettingDefinitions()));
    });
});

describe('SettingsTab pre-1.13', () => {
    const settingsTab = new SettingsTab({ plugin, events });

    it('all settings', () => {
        resetRecordedLegacySettings();
        resetLastModalState();

        settingsTab.display();

        verifyAsJson(serializeForApproval(recordedLegacySettings));
    });
});

describe('SettingsTab adding statuses', () => {
    const settingsTab = new SettingsTab({ plugin, events });

    beforeEach(() => {
        resetSettings();
        resetRecordedLegacySettings();
        resetLastModalState();
        noticeMessages.length = 0;
    });

    afterEach(() => {
        resetSettings();
        StatusRegistry.getInstance().resetToDefaultStatuses();
    });

    function customSymbols() {
        return getSettings().statusSettings.customStatuses.map((status) => status.symbol);
    }

    function clickLegacyButton(text: string) {
        const controls = recordedLegacySettings.flatMap((record) => record.controls as Array<Record<string, unknown>>);
        (controls.find((control) => control.text === text)!.callback as () => void)();
    }

    function findDefinition(items: unknown[], name: string): Record<string, unknown> | undefined {
        for (const item of items as Array<Record<string, unknown>>) {
            const found = item.name === name ? item : findDefinition((item.items as unknown[]) ?? [], name);
            if (found) {
                return found;
            }
        }
        return undefined;
    }

    const addAllUnknownName = () => i18n.t('settings.statuses.customStatuses.buttons.addAllUnknown.name');

    it('pre-1.13: add new task status opens the status editor', () => {
        const symbolsBefore = customSymbols();
        settingsTab.display();

        clickLegacyButton(i18n.t('settings.statuses.customStatuses.buttons.addNewStatus.name'));

        expect(customSymbols()).toEqual(symbolsBefore);
        expect(lastModalState.opened).toBe(true);
    });

    it('pre-1.13: add all unknown statuses says when none are found', () => {
        settingsTab.display();

        clickLegacyButton(addAllUnknownName());

        expect(noticeMessages).toEqual([i18n.t('settings.statuses.customStatuses.buttons.addAllUnknown.noneFound')]);
    });

    it('post-1.13: add all unknown statuses says how many were added', () => {
        const unknownStatus = new Status(new StatusConfiguration('?', 'Question', 'x', false, StatusType.TODO));
        plugin.getTasks.mockReturnValueOnce([{ status: unknownStatus }]);

        const addAllUnknown = findDefinition(settingsTab.getSettingDefinitions(), addAllUnknownName());
        (addAllUnknown!.action as () => void)();

        expect(customSymbols()).toContain('?');
        expect(noticeMessages).toContain(
            i18n.t('settings.statuses.customStatuses.buttons.addAllUnknown.added', { count: 1 }),
        );
    });
});
