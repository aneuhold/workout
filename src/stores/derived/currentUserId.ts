import { derived } from 'svelte/store';
import { userConfig } from '../local/userConfig/userConfig';

export const currentUserId = derived(userConfig, ($userConfig) => $userConfig.userId);
