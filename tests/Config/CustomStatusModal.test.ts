import type { Plugin } from 'obsidian';
import { CustomStatusModal } from 'Config/CustomStatusModal';
import { resetSettings } from 'Config/Settings';
import { StatusConfiguration, StatusType } from 'Statuses/StatusConfiguration';
import { i18n } from 'i18n/i18n';

describe('CustomStatusModal', () => {
    const plugin = { app: {} } as Plugin;

    beforeEach(() => {
        resetSettings();
    });

    it('should reject a symbol already used by another status', () => {
        // The default custom statuses include '/'.
        const status = new StatusConfiguration('!', 'Important', 'x', false, StatusType.TODO);
        const modal = new CustomStatusModal(plugin, status, false);

        modal.statusSymbol = '/';

        expect(modal.validationErrors()).toContain(i18n.t('modals.customStatusModal.duplicateSymbol', { symbol: '/' }));
    });

    it('should accept an unchanged symbol', () => {
        const status = new StatusConfiguration('/', 'In Progress', 'x', false, StatusType.IN_PROGRESS);
        const modal = new CustomStatusModal(plugin, status, false);

        expect(modal.validationErrors()).toEqual([]);
    });
});
