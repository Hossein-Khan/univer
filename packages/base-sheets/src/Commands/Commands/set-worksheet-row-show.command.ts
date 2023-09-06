import { CommandType, ICommand, ICommandService, ICurrentUniverService, IUndoRedoService } from '@univerjs/core';
import { IAccessor } from '@wendellhu/redi';
import { ISetWorksheetRowShowMutationParams, SetWorksheetRowShowMutation, SetWorksheetRowShowMutationFactory } from '../Mutations/set-worksheet-row-show.mutation';
import { SetWorksheetRowHideMutation } from '../Mutations/set-worksheet-row-hide.mutation';
import { ISelectionManager } from '../../Services/tokens';

export const SetWorksheetRowShowCommand: ICommand = {
    type: CommandType.COMMAND,
    id: 'sheet.command.set-worksheet-row-show',
    handler: async (accessor: IAccessor) => {
        const selectionManager = accessor.get(ISelectionManager);
        const commandService = accessor.get(ICommandService);
        const undoRedoService = accessor.get(IUndoRedoService);
        const currentUniverService = accessor.get(ICurrentUniverService);

        const selections = selectionManager.getCurrentSelections();
        if (!selections.length) {
            return false;
        }

        const workbookId = currentUniverService.getCurrentUniverSheetInstance().getUnitId();
        const worksheetId = currentUniverService.getCurrentUniverSheetInstance().getWorkBook().getActiveSheet().getSheetId();
        const workbook = currentUniverService.getUniverSheetInstance(workbookId)?.getWorkBook();
        if (!workbook) return false;
        const worksheet = workbook.getSheetBySheetId(worksheetId);
        if (!worksheet) return false;

        const redoMutationParams: ISetWorksheetRowShowMutationParams = {
            workbookId,
            worksheetId,
            ranges: selections,
        };

        const undoMutationParams = SetWorksheetRowShowMutationFactory(accessor, redoMutationParams);
        const result = commandService.executeCommand(SetWorksheetRowShowMutation.id, redoMutationParams);

        if (result) {
            undoRedoService.pushUndoRedo({
                URI: 'sheet',
                undo() {
                    return commandService.executeCommand(SetWorksheetRowHideMutation.id, undoMutationParams);
                },
                redo() {
                    return commandService.executeCommand(SetWorksheetRowShowMutation.id, redoMutationParams);
                },
            });
            return true;
        }
        return true;
    },
};