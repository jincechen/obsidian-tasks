import { type App, Modal, Setting } from 'obsidian';
import { i18n } from 'i18n/i18n';
import { type SubtaskProgressConfig, progressConfig, renderSubtaskProgress, tallyStatuses } from 'Task/SubtaskProgress';
import { type Settings, updateSettings } from 'Config/Settings';

type Layer = 'completed' | 'middle' | 'total' | 'none';
type Step = 'total' | 'middle' | 'completed';

const range = (from: number, to: number) => Array.from({ length: Math.max(to - from, 0) }, (_, i) => from + i);

/**
 * The steps that each dropdown can offer, keeping them in order: Total, the middle layer, then Completed.
 */
export function subtaskProgressStepOptions(config: SubtaskProgressConfig): Record<Step, number[]> {
    const steps = config.sequence.length;
    return {
        total: range(0, steps - 1),
        middle: range(config.total + 1, config.completed),
        completed: range(config.total + 1, steps),
    };
}

/**
 * The settings for the config, with one step changed.
 * Steps are saved as status symbols. The middle layer is saved as '' when there is none.
 */
export function subtaskProgressSettingsWith(
    config: SubtaskProgressConfig,
    change: Partial<Record<Step, number | null>>,
): Settings['subtaskProgress'] {
    const steps = {
        total: config.total,
        middle: config.middle,
        completed: config.completed,
        ...change,
    };
    const symbolAt = (step: number | null | undefined) =>
        step === null || step === undefined ? '' : config.sequence[step].symbol;
    return {
        totalFrom: symbolAt(steps.total),
        middleFrom: symbolAt(steps.middle),
        completedFrom: symbolAt(steps.completed),
    };
}

function layerOf(step: number, config: SubtaskProgressConfig): Layer {
    if (step >= config.completed) {
        return 'completed';
    }
    if (config.middle !== null && step >= config.middle) {
        return 'middle';
    }
    return step >= config.total ? 'total' : 'none';
}

/**
 * Configure which statuses the subtask progress bar counts. Changes apply immediately.
 */
export class SubtaskProgressModal extends Modal {
    constructor(
        app: App,
        private readonly onChange: () => Promise<void>,
    ) {
        super(app);
        this.setTitle(i18n.t('modals.subtaskProgress.title'));
        this.modalEl.addClass('tasks-subtask-progress-modal');
        this.render();
    }

    private render() {
        const { contentEl } = this;
        contentEl.empty();

        const config = progressConfig();
        if (config.sequence.length < 2) {
            contentEl.createEl('p', {
                cls: 'setting-item-description',
                text: i18n.t('modals.subtaskProgress.noSequence'),
            });
            return;
        }

        this.renderPreview(contentEl, config);

        const options = subtaskProgressStepOptions(config);
        this.addStepDropdown(i18n.t('modals.subtaskProgress.total'), config, options.total, config.total, (step) => ({
            total: step,
        }));
        this.addStepDropdown(
            i18n.t('modals.subtaskProgress.middle'),
            config,
            options.middle,
            config.middle,
            (step) => ({ middle: step }),
            i18n.t('modals.subtaskProgress.none'),
        );
        this.addStepDropdown(
            i18n.t('modals.subtaskProgress.completed'),
            config,
            options.completed,
            config.completed,
            (step) => ({ completed: step }),
        );
    }

    /**
     * A sample bar, with one subtask at each step, and the steps coloured like the layer they count in.
     */
    private renderPreview(containerEl: HTMLElement, config: SubtaskProgressConfig) {
        const previewEl = containerEl.createDiv({ cls: 'tasks-progress-preview' });

        const progress = tallyStatuses(config.sequence, config);
        if (progress !== null) {
            renderSubtaskProgress(previewEl.createDiv({ cls: 'tasks-progress-preview-bar' }), progress, config);
        }

        const stepsEl = previewEl.createDiv({ cls: 'tasks-progress-preview-steps' });
        for (const [step, status] of config.sequence.entries()) {
            if (step > 0) {
                stepsEl.createSpan({ cls: 'tasks-progress-preview-arrow', text: '→' });
            }
            const stepEl = stepsEl.createSpan({ cls: 'tasks-progress-preview-step' });
            stepEl.dataset.layer = layerOf(step, config);
            stepEl.createSpan({ cls: 'tasks-progress-preview-swatch' });
            stepEl.createSpan({ text: status.name });
        }
    }

    private addStepDropdown(
        name: string,
        config: SubtaskProgressConfig,
        steps: number[],
        value: number | null,
        change: (step: number | null) => Parameters<typeof subtaskProgressSettingsWith>[1],
        noneLabel?: string,
    ) {
        new Setting(this.contentEl).setName(name).addDropdown((dropdown) => {
            if (noneLabel !== undefined) {
                dropdown.addOption('', noneLabel);
            }
            for (const step of steps) {
                const status = config.sequence[step];
                dropdown.addOption(step.toString(), `${status.name} [${status.symbol}]`);
            }
            dropdown.setValue(value === null ? '' : value.toString());
            dropdown.setDisabled(steps.length === 0);
            dropdown.onChange(async (selected) => {
                const step = selected === '' ? null : Number(selected);
                updateSettings({ subtaskProgress: subtaskProgressSettingsWith(config, change(step)) });
                await this.onChange();
                this.render();
            });
        });
    }
}
