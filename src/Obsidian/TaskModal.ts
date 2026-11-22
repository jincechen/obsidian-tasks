import { type App, setIcon, setTooltip } from 'obsidian';
import { Modal } from 'obsidian';
import { mount, unmount } from 'svelte';

import EditTask from 'ui/EditTask.svelte';
import type { Task } from 'Task/Task';
import { StatusRegistry } from 'Statuses/StatusRegistry';
import { Status } from 'Statuses/Status';
import { OptionsModal } from 'Obsidian/OptionsModal';

export interface TaskModalParams {
    app: App;
    task: Task;
    onSaveSettings: () => Promise<void>;
    onSubmit: (updatedTasks: Task[]) => void;
    onCancel?: () => void;
    allTasks: Task[];
}

/**
 * Position a button, styled like the modal's close button, just before the close button.
 *
 * The close button's size and position differ between Obsidian versions and themes,
 * so measure it rather than rely on a fixed offset.
 */
function placeBesideCloseButton(modalEl: HTMLElement, button: HTMLElement) {
    window.requestAnimationFrame(() => {
        const closeButton = Array.from(
            modalEl.querySelectorAll<HTMLElement>(':scope > .modal-close-button, :scope > .modal-header-button'),
        ).find((element) => element !== button);
        if (!closeButton || closeButton.offsetWidth === 0) {
            return;
        }

        const style = window.getComputedStyle(closeButton);
        const closeButtonEnd = parseFloat(style.insetInlineEnd) || parseFloat(style.right) || 0;
        const gap = 4;
        button.style.insetInlineEnd = `${closeButtonEnd + closeButton.offsetWidth + gap}px`;
        button.style.top = style.top;
    });
}

export class TaskModal extends Modal {
    public readonly task: Task;
    public readonly onSaveSettings: () => Promise<void>;
    public readonly onSubmit: (updatedTasks: Task[]) => void;
    public readonly allTasks: Task[];
    private _editTaskComponent: ReturnType<typeof mount> | undefined;

    constructor({ app, task, onSaveSettings, onSubmit, onCancel, allTasks }: TaskModalParams) {
        super(app);

        this.task = task;
        this.allTasks = allTasks;
        this.onSaveSettings = onSaveSettings;
        this.onSubmit = (updatedTasks: Task[]) => {
            if (updatedTasks.length > 0) {
                onSubmit(updatedTasks);
            } else if (onCancel) {
                onCancel();
            }
            this.close();
        };
    }

    public onOpen(): void {
        this.titleEl.setText('Create or edit task');
        this.modalEl.addClass('tasks-edit-modal-container');

        const optionsButton = this.modalEl.createEl('button', {
            cls: [
                // Add same classes as the default Obsidian modal close button:
                'modal-close-button',
                'mod-raised',
                'clickable-icon',
                // Fallback position, until placeBesideCloseButton() measures the close button:
                'modal-option-button',
            ],
        });
        setIcon(optionsButton, 'sliders-horizontal');
        optionsButton.setAttribute('aria-label', 'Hide and reorder fields');
        setTooltip(optionsButton, 'Hide and reorder fields');
        placeBesideCloseButton(this.modalEl, optionsButton);
        optionsButton.onclick = () => {
            const optionsModal = new OptionsModal({
                app: this.app,
                onSave: () => this.onSaveSettings(),
            });
            optionsModal.open();
        };

        const { contentEl } = this;

        const statusOptions = this.getKnownStatusesAndCurrentTaskStatusIfNotKnown();

        this._editTaskComponent = mount(EditTask, {
            target: contentEl,
            props: {
                task: this.task,
                statusOptions: statusOptions,
                onSubmit: this.onSubmit,
                allTasks: this.allTasks,
            },
        });
    }

    /**
     * If the task being edited has an unknown status, make sure it is added
     * to the dropdown list.
     * This allows the user to switch to a different status and then change their
     * mind and return to the initial status.
     */
    private getKnownStatusesAndCurrentTaskStatusIfNotKnown() {
        const statusOptions: Status[] = StatusRegistry.getInstance().registeredStatuses;
        if (StatusRegistry.getInstance().bySymbol(this.task.status.symbol) === Status.EMPTY) {
            statusOptions.push(this.task.status);
        }
        return statusOptions;
    }

    public onClose(): void {
        if (this._editTaskComponent) {
            void unmount(this._editTaskComponent);
            this._editTaskComponent = undefined;
        }
        const { contentEl } = this;
        contentEl.empty();
    }
}
