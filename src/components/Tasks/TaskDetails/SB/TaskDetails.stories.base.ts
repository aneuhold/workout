import type { defineMeta } from '@storybook/addon-svelte-csf';
import SbConfettiDecorator from '$components/singletons/Confetti/SBConfettiDecorator.svelte';
import SbSingletonTaskAssignmentDialogDecorator from '$components/singletons/dialogs/SingletonTaskAssignmentDialog/SBSingletonTaskAssignmentDialogDecorator.svelte';
import SbSingletonTaskSharingDialogDecorator from '$components/singletons/dialogs/SingletonTaskSharingDialog/SBSingletonTaskSharingDialogDecorator.svelte';
import {
  MockTaskAssignment,
  MockTaskSharedWith
} from '$services/Task/TaskMapService/TaskMapService.mock';
import { createEnumArgType } from '$storybook/storybookUtil';
import SBTaskDetailsExample from './SBTaskDetailsExample.svelte';

const sbTaskDetailsMeta: Parameters<typeof defineMeta>[0] = {
  title: 'Stateful Components/TaskDetails',
  component: SBTaskDetailsExample,
  decorators: [
    () => ({ Component: SbConfettiDecorator }),
    () => ({ Component: SbSingletonTaskSharingDialogDecorator }),
    () => ({ Component: SbSingletonTaskAssignmentDialogDecorator })
  ],
  argTypes: {
    sharedWith: createEnumArgType(MockTaskSharedWith),
    assignedTo: createEnumArgType(MockTaskAssignment)
  },
  args: {
    mainTaskExists: true,
    sharedWith: MockTaskSharedWith.none,
    assignedTo: MockTaskAssignment.none
  }
};
export default sbTaskDetailsMeta;
