import { DocumentService, type UserCTO } from '@aneuhold/core-ts-db-lib';

/**
 * Static user data for testing to avoid circular dependencies.
 */
export default class TestUsers {
  static currentUserCto: UserCTO = {
    _id: DocumentService.generateID(),
    userName: 'storybookUser'
  };
  static collaborator1: UserCTO = {
    _id: DocumentService.generateID(),
    userName: 'Collaborator1'
  };
  static collaborator2: UserCTO = {
    _id: DocumentService.generateID(),
    userName: 'Collaborator2'
  };
}
