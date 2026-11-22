import { type App, ConfirmationModal } from 'obsidian';

/**
 * Ask the user to confirm a destructive action, such as deleting or resetting settings.
 * @returns true if the user confirmed, false if they cancelled or closed the dialog.
 */
export function confirmDestructiveAction(
    app: App,
    { title, message, confirmText }: { title: string; message: string; confirmText: string },
): Promise<boolean> {
    return new Promise((resolve) => {
        const modal = new ConfirmationModal(app);
        modal.setTitle(title);
        modal.contentEl.createEl('p', { text: message });
        modal.addCancelButton();
        modal.addButton((btn) =>
            btn
                .setButtonText(confirmText)
                .setDestructive()
                .setCta()
                .onClick(() => resolve(true)),
        );
        const onClose = modal.onClose.bind(modal);
        modal.onClose = () => {
            onClose();
            // Does nothing if already confirmed.
            resolve(false);
        };
        modal.open();
    });
}
