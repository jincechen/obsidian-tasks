import type { Plugin } from 'obsidian';
import { CustomStatusModal } from '../../src/Config/CustomStatusModal';
import { resetSettings } from '../../src/Config/Settings';
import { StatusConfiguration, StatusType } from '../../src/Statuses/StatusConfiguration';
import { i18n } from '../../src/i18n/i18n';

describe('CustomStatusModal', () => {
    const plugin = { app: {} } as Plugin;

    beforeEach(() => {
        resetSettings();
    });

    function duplicateSymbolError(symbol: string) {
        return i18n.t('modals.customStatusModal.duplicateSymbol', { symbol });
    }

    it.failing('should reject a symbol already used by another status', () => {
        // The default custom statuses include '/'.
        const status = new StatusConfiguration('!', 'Important', 'x', false, StatusType.TODO);
        const modal = new CustomStatusModal(plugin, status, false);

        modal.statusSymbol = '/';

        expect(modal.validationErrors()).toContain(duplicateSymbolError('/'));
    });
});
