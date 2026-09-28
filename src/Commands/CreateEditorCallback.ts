import {
    Editor,
    type EditorChange,
    type EditorPosition,
    type EditorSelection,
    type MarkdownFileInfo,
    MarkdownView,
} from 'obsidian';

/**
 * Represents text to be inserted into the editor
 *
 * @property text The text to insert. May span over multiple lines.
 * @property [moveTo] An {@link EditorPosition} that represents an absolute position within {@link EditorInsertion.text} that is
 *    recommended to move the cursor to.
 *
 * Any combination of subfields (or the whole {@link EditorPosition}) may be omitted.
 * Missing fields should preserve the corresponding cursor position. That is:
 *     * A {@link EditorInsertion.moveTo} that is `undefined` directs the caller to keep the cursor where it is.
 *     * A {@link EditorInsertion.moveTo} that is `{line: 1}` directs the caller of to jump to {@link EditorInsertion.text}'s
 *       second line but stay in the same column.
 *
 * @interface EditorInsertion
 */
export interface EditorInsertion {
    text: string;
    moveTo?: Partial<EditorPosition>;
}

/**
 * A function that transforms a line of text, returning the new text and cursor position.
 * Returns undefined to indicate no changes should be made.
 */
export type LineTransformer = (line: string, path: string) => EditorInsertion | undefined;

/**
 * Computes the new absolute position of the cursor so that it is positioned within the inserted text as specified
 * by {@link insertion}.moveTo.
 *
 * @note This function assumes that text was inserted at the beginning of the line, which is
 *       the case when used together with {@link Editor.setLine}. This is a simplifying assumption,
 *       but may result in incorrect behavior if used outside the intended context (i.e. not by {@link toggleDone}).
 *
 *       Example: Assume {@link insertion}=`{text: "Hello World", moveTo: {line: 0, ch: 6}}`, where {@link insertion}.text
 *                had been appended to a line with content "------":  `------Hello World`.
 *                The cursor will be offset to the left by the number of characters that were already on the line.
 *                Resulting in the incorrect result `------|Hello World` instead of the intended `------Hello |World`.
 *
 * @param startPos The starting cursor position
 * @param insertion The inserted text and suggested cursor position within that text
 */
export const getNewCursorPosition = (startPos: EditorPosition, insertion: EditorInsertion): EditorPosition => {
    const defaultMoveTo = { line: 0, ch: startPos.ch };
    // Fill in any missing moveTo values using the default
    const moveTo = { ...defaultMoveTo, ...insertion.moveTo };
    // Find the length of the line we're moving the cursor to, so that cursor isn't moved out of bounds
    const destinationLineLength = insertion.text.split('\n')[moveTo.line].length;

    return {
        line: startPos.line + moveTo.line,
        ch: Math.min(moveTo.ch, destinationLineLength),
    };
};

/**
 * The lines covered by the selections, in order. A selection that ends at the start of a line does not include that line.
 */
export const selectedLineNumbers = (selections: EditorSelection[]): number[] => {
    const lines = new Set<number>();
    for (const { anchor, head } of selections) {
        const [from, to] = anchor.line <= head.line ? [anchor, head] : [head, anchor];
        const last = to.line > from.line && to.ch === 0 ? to.line - 1 : to.line;
        for (let line = from.line; line <= last; line++) {
            lines.add(line);
        }
    }
    return [...lines].sort((a, b) => a - b);
};

/**
 * The changes that transform each of the given lines, skipping blank lines. A line transformed to nothing is deleted.
 */
export const changesForLines = (
    lineNumbers: number[],
    getLine: (line: number) => string,
    lineCount: number,
    lineTransformer: LineTransformer,
    path: string,
): EditorChange[] => {
    const changes: EditorChange[] = [];
    for (const lineNumber of lineNumbers) {
        const line = getLine(lineNumber);
        if (line.trim() === '') {
            continue;
        }
        const insertion = lineTransformer(line, path);
        if (insertion === undefined || insertion.text === line) {
            continue;
        }
        const from = { line: lineNumber, ch: 0 };
        const deleteWholeLine = insertion.text === '' && lineNumber < lineCount - 1;
        const to = deleteWholeLine ? { line: lineNumber + 1, ch: 0 } : { line: lineNumber, ch: line.length };
        changes.push({ from, to, text: insertion.text });
    }
    return changes;
};

/**
 * Creates an editor callback function that applies a line transformation to the current line,
 * or to every selected line when the selection covers several lines.
 *
 * @param lineTransformer - A function that takes the current line and file path, and returns the transformed text
 * @returns An editor callback suitable for use with Obsidian's `editorCheckCallback`
 */
export const createEditorCallback = (lineTransformer: LineTransformer) => {
    function editorCallback(checking: boolean, editor: Editor, view: MarkdownView | MarkdownFileInfo) {
        if (checking) {
            if (!(view instanceof MarkdownView)) {
                // If we are not in a markdown view, the command shouldn't be shown.
                return false;
            }

            // TODO - Decide if we want to only show these commands on lines which are tasks
            return true;
        }

        if (!(view instanceof MarkdownView)) {
            // Should never happen due to check above.
            return;
        }

        // We are certain we are in the editor due to the check above.
        const path = view.file?.path;
        if (path === undefined) {
            return;
        }

        const lineNumbers = selectedLineNumbers(editor.listSelections());
        if (lineNumbers.length > 1) {
            const changes = changesForLines(
                lineNumbers,
                (line) => editor.getLine(line),
                editor.lineCount(),
                lineTransformer,
                path,
            );
            if (changes.length > 0) {
                editor.transaction({ changes });
            }
            return;
        }

        const origCursorPos = editor.getCursor();
        const lineNumber = origCursorPos.line;
        const line = editor.getLine(lineNumber);

        const insertion = lineTransformer(line, path);

        // If the transformer returns undefined, make no changes
        if (insertion === undefined) {
            return;
        }

        const replacementTextIsNonEmpty = insertion.text.length > 0;
        const taskIsOnLastLine = lineNumber >= editor.lineCount() - 1;
        if (replacementTextIsNonEmpty || taskIsOnLastLine) {
            editor.setLine(lineNumber, insertion.text);
        } else {
            // The replacement text is empty, and our line was followed by a new line character,
            // so we delete the line and the new-line, to avoid leaving a blank line in the file.
            const from = { line: lineNumber, ch: 0 };
            const to = { line: lineNumber + 1, ch: 0 };
            editor.replaceRange('', from, to);
        }

        /* Cursor positions are 0-based for both "line" and "ch" offsets.
         * If "ch" offset bigger than the line length, will just continue to next line(s).
         * By default "editor.setLine()" appears to either keep the cursor at the end of the line if it is already there,
         * ...or move it to the beginning if it is anywhere else. Licat explained this on Discord as "sticking" to one side or another.
         */
        editor.setCursor(getNewCursorPosition(origCursorPos, insertion));
    }

    return editorCallback;
};
