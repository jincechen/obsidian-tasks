import { type App, Modal, Setting } from 'obsidian';
import { i18n } from 'i18n/i18n';
import { type SubtaskProgressConfig, progressConfig, renderSubtaskProgress, tallyStatuses } from 'Task/SubtaskProgress';
import { type Settings, updateSettings } from 'Config/Settings';

type Layer = 'completed' | 'total' | 'none';
type Step = 'total' | 'completed';

const range = (from: number, to: number) => Array.from({ length: Math.max(to - from, 0) }, (_, i) => from + i);

/**
 * The steps that each dropdown can offer, keeping Total before Completed.
 */
export function subtaskProgressStepOptions(config: SubtaskProgressConfig): Record<Step, number[]> {
    const steps = config.sequence.length;
    return {
        total: range(0, steps - 1),
        completed: range(config.total + 1, steps),
    };
}

/**
 * The settings for the config, with one step changed.
 * Steps are saved as status symbols.
 */
export function subtaskProgressSettingsWith(
    config: SubtaskProgressConfig,
    change: Partial<Record<Step, number>>,
): Settings['subtaskProgress'] {
    const steps = {
        total: config.total,
        completed: config.completed,
        ...change,
    };
    const symbolAt = (step: number) => config.sequence[step].symbol;
    return {
        totalFrom: symbolAt(steps.total),
        completedFrom: symbolAt(steps.completed),
    };
}

function layerOf(step: number, config: SubtaskProgressConfig): Layer {
    if (step >= config.completed) {
        return 'completed';
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
        value: number,
        change: (step: number) => Parameters<typeof subtaskProgressSettingsWith>[1],
    ) {
        new Setting(this.contentEl).setName(name).addDropdown((dropdown) => {
            for (const step of steps) {
                const status = config.sequence[step];
                dropdown.addOption(step.toString(), `${status.name} [${status.symbol}]`);
            }
            dropdown.setValue(value.toString());
            dropdown.setDisabled(steps.length === 0);
            dropdown.onChange(async (selected) => {
                updateSettings({ subtaskProgress: subtaskProgressSettingsWith(config, change(Number(selected))) });
                await this.onChange();
                this.render();
            });
        });
    }
}
