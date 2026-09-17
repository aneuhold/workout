import { DocumentService, type UserCTO } from '@aneuhold/core-ts-db-lib';

/**
 * The user identities that all mock data belongs to. Kept standalone so the
 * mock document builders can share an owner without importing each other.
 */
export default class MockUsers {
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
