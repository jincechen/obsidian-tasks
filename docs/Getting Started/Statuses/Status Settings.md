---
publish: true
---

# Status Settings

<span class="related-pages">#feature/statuses</span>

## Overview

This is what you see in the Tasks settings when you first look at the Task Statuses section:

![Initial Task Statuses Settings](../../images/settings-statuses-initial.png)<br>
*Initial Task Statuses Settings*

There are two sections:

1. **Core Statuses**
    - These are statuses that are built in to Tasks, and cannot be deleted.
    - They are the two task types that are built in to Obsidian and Tasks natively: `[ ]` and `[x]`.
    - Their status symbols cannot be changed.
    - All their other properties can be edited.
2. **Custom Statuses**
    - These statuses are what many themes call 'custom checkboxes'.
    - You will need to choose and install a Theme or CSS Snippet that supports 'custom checkboxes'
    - Tasks automatically adds `[/]` and `[-]`
    - And this is where you can add your own custom statuses.
    - Drag them to change the order they are shown in menus.

We also see that each status consists of:

- **Status Symbol** (for example, `x` and  `-`)
- **Status Name** (for example, 'In Progress')
- **Status Type** (for example, 'To do', 'Done', 'In progress' or 'Cancelled')
- **Next Status Symbol** (for example, `x` and `space`)

## Add New Task Status

This opens the status editor, where you fill in the details for your new Status.
When you save, the new Status is added to the Custom Statuses section.

## Bulk-adding Statuses

These options are in the **Tools** section. Themes are added with **Import from theme**.

### Minimal Theme

This button populates the Custom Statuses list with all the statuses supported by the Minimal Theme.

You may wish to delete the default custom statuses first, so that you only see the Minimal statuses.

![The first few statuses supported by Minimal](../../images/settings-custom-statuses-minimal-theme-first-few.png)<br>
*The first few statuses supported by Minimal*

The [[Minimal Theme]] page shows the full list statuses that will be added, and what they look like in that theme.

### ITS Theme & SlRvb Checkboxes

This button populates the Custom Statuses list with all the statuses supported by the ITS Theme, and also the identical SlRvb's Alternate Checkboxes.

![The first few statuses supported by ITS Theme and SlRvb's Alternate Checkboxes](../../images/settings-custom-statuses-its-theme-first-few.png)<br>
*The first few statuses supported by ITS Theme and SlRvb's Alternate Checkboxes*

You can see screenshots, and the statuses that will be added:

- [[SlRvb's Alternate Checkboxes|SlRvb’s Alternate Checkboxes]]
- [[ITS Theme]]

### Other supported themes

Tasks knows about a growing list of custom checkboxes in Themes and CSS Snippets.

You can find a full list, with screenshots and complete details of the supported checkboxes, in [[About Status Collections]].

### Add All Unknown Status Types

This option, **Add statuses found in vault**, searches all the tasks in your vault for any with status symbols that are not already in Tasks settings.
It then creates a new custom status for each unknown status symbol.
A notice says how many statuses were added, or that none were found.

The new statuses are sorted by their symbols.
This can be a convenient way to populate the Custom Statuses settings.

For example, in a vault that has already used a few custom statuses, we might see:

![Example result from adding all Unknown statuses](../../images/settings-custom-statuses-add-unknown-statuses.png)<br>
*Example result from adding all Unknown statuses*

## Reset Custom Status Types to Defaults

This option, **Reset custom statuses**, resets the entire Custom Statuses section back to its default list.
You are asked to confirm first, as this cannot be undone.

This allows you to try out each of the buttons above, and if you don't like them, you can quickly undo their changes.

## Limitations and Issues

- Any statuses in the settings with the same symbol as any earlier statuses will be ignored.
  - When you edit a status, you cannot save a symbol that another status already uses.
  - But there is no visual feedback in the settings pane if there are any existing duplicates
  - You have to confirm the actually loaded statuses by running the 'Create or edit task' command and looking at the Status drop-down.
- The Core and Custom Status sections in the settings are collapsible, but they keep expanding.
  - The mechanism to remember which sections were collapsed is not yet working.
- Ideally, the lists of statuses, with their delete and edit buttons, would be a table instead, with the ability to edit the properties directly in the table, instead of having to open up a modal.

> [!Tip]
> Use [[Check your Statuses]] to easily find any issues with your Custom Statuses.
