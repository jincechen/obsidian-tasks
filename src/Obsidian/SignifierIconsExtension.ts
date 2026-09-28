import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from '@codemirror/view';
import { editorLivePreviewField } from 'obsidian';
import { getSettings } from '../Config/Settings';
import { setTasksIcon } from '../ui/Icons';
import { linesInsideCodeBlocks } from './EditorDecorations';
import { type SignifierRange, propertyRangesForLine } from './SignifierIcons';

class TaskPropertyWidget extends WidgetType {
    constructor(
        private readonly property: SignifierRange,
        private readonly useIcons: boolean,
    ) {
        super();
    }

    eq(other: TaskPropertyWidget) {
        return (
            other.useIcons === this.useIcons &&
            other.property.iconId === this.property.iconId &&
            other.property.label === this.property.label &&
            other.property.emoji === this.property.emoji &&
            other.property.text === this.property.text
        );
    }

    toDOM() {
        const { iconId, label, emoji, text } = this.property;
        const container = createSpan({ cls: 'tasks-editor-property' });
        container.setAttribute('title', text ? `${label}: ${text}` : label);

        if (this.useIcons) {
            const iconSpan = container.createSpan({ cls: 'tasks-icon' });
            iconSpan.setAttribute('aria-label', label);
            iconSpan.setAttribute('role', 'img');
            setTasksIcon(iconSpan, iconId);
        } else {
            container.createSpan({ cls: 'tasks-editor-property-emoji', text: emoji });
        }

        if (text) {
            container.createSpan({ cls: 'tasks-editor-property-value', text });
        }
        return container;
    }

    ignoreEvent() {
        // Let the editor handle clicks, so that they place the cursor.
        return false;
    }
}

function buildDecorations(view: EditorView): DecorationSet {
    const settings = getSettings();
    if (!settings.showIconsInEditor || view.state.field(editorLivePreviewField, false) !== true) {
        return Decoration.none;
    }

    const useIcons = settings.signifierDisplay === 'icons';
    const { doc, selection } = view.state;
    const visibleRanges = view.visibleRanges;
    if (visibleRanges.length === 0) {
        return Decoration.none;
    }
    const lastVisibleLine = doc.lineAt(visibleRanges[visibleRanges.length - 1].to);
    const insideCodeBlock = linesInsideCodeBlocks(
        doc.sliceString(0, lastVisibleLine.to).split('\n'),
        lastVisibleLine.number - 1,
    );

    const decorations: ReturnType<Decoration['range']>[] = [];
    for (const { from, to } of visibleRanges) {
        let pos = from;
        while (pos <= to) {
            const line = doc.lineAt(pos);
            pos = line.to + 1;
            if (insideCodeBlock[line.number - 1]) {
                continue;
            }

            const properties = propertyRangesForLine(line.text, settings.taskFormat, settings.signifierDisplay);
            for (const property of properties) {
                const propertyFrom = line.from + property.from;
                const propertyTo = line.from + property.to;

                const isBeingEdited = selection.ranges.some(
                    (range) => range.from <= propertyTo && range.to >= propertyFrom,
                );
                if (isBeingEdited) {
                    continue;
                }

                decorations.push(
                    Decoration.replace({ widget: new TaskPropertyWidget(property, useIcons) }).range(
                        propertyFrom,
                        propertyTo,
                    ),
                );
            }
        }
    }
    return Decoration.set(decorations, true);
}

/**
 * In Live Preview, show task properties compactly, in the chosen property style.
 * A property's text is shown whenever the cursor or selection touches it.
 */
export function newSignifierIconsExtension() {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = buildDecorations(view);
            }

            update(update: ViewUpdate) {
                const livePreviewChanged =
                    update.startState.field(editorLivePreviewField, false) !==
                    update.state.field(editorLivePreviewField, false);
                if (update.docChanged || update.viewportChanged || update.selectionSet || livePreviewChanged) {
                    this.decorations = buildDecorations(update.view);
                }
            }
        },
        {
            decorations: (plugin) => plugin.decorations,
        },
    );
}
