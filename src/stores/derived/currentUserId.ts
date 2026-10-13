import { derived } from 'svelte/store';
import { currentUser } from '../local/currentUser/currentUser';

export const currentUserId = derived(currentUser, ($currentUser) => $currentUser.userId);
