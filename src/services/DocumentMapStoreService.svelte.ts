import type { ProjectWorkoutPrimaryEndpointOptions } from '@aneuhold/core-ts-api-lib';
import { type BaseDocument, type DocumentMap, DocumentService } from '@aneuhold/core-ts-db-lib';
import type { UUID } from 'crypto';
import type { Updater } from 'svelte/store';
import { createLogger } from '$util/logging/logger';

const log = createLogger('DocumentMapStoreService.ts');

export type DocumentInsertOrUpdateInfo<T extends BaseDocument> = {
  insert?: T[];
  update?: T[];
  delete?: T[];
};

export type UpsertManyInfo<T> = {
  filter: (currentChild: T) => boolean;
  mutator: Updater<T>;
  newDocs: T[];
};

export interface DocumentMapStoreConfig<T extends BaseDocument> {
  persistToLocalData: (map: DocumentMap<T>) => void;
  persistToDb: (updateInfo: DocumentInsertOrUpdateInfo<T>) => void;
  prepareForSave: (
    options: ProjectWorkoutPrimaryEndpointOptions,
    info: DocumentInsertOrUpdateInfo<T>
  ) => void;
}

/**
 * A service which manages a Svelte reactive store that directly maps to a
 * document type in the database. Handles CRUD operations with automatic
 * dual persistence to both local storage and the backend API.
 *
 * Configure via constructor and export the instance as a default export
 * for singleton behavior.
 */
export default class DocumentMapStoreService<T extends BaseDocument> {
  private mapState: DocumentMap<T> = $state({});

  private config: DocumentMapStoreConfig<T>;

  constructor(config: DocumentMapStoreConfig<T>) {
    this.config = config;
  }

  /**
   * Returns all documents in the map as an array.
   */
  public getDocs(): T[] {
    return Object.values(this.mapState).filter((doc): doc is T => doc !== undefined);
  }

  /**
   * Returns a single document by ID, or undefined if not found.
   *
   * @param docId The ID of the document to retrieve
   */
  public getDoc(docId: UUID): T | undefined {
    return this.mapState[docId];
  }

  /**
   * Returns documents matching the given IDs, preserving order and
   * skipping any IDs not found in the map. O(k) where k = ids.length.
   *
   * @param ids The IDs of the documents to retrieve
   */
  public getDocsWithIds(ids: UUID[]): T[] {
    return ids.map((id) => this.mapState[id]).filter((doc): doc is T => doc !== undefined);
  }

  /**
   * Gets a snapshot of the entire document map.
   */
  public getMap(): Map<UUID, T> {
    // This has to be done because as of 2/16/2026 it seems that there is a bug in the Svelte
    // TypeScript where it says that $state.snapshot returns a map of Snapshot<T> instead of T,
    // even though the docs say it should return T. This is a workaround for now. An alternative
    // is to setup an app.d.ts file, but the below seems shorter.
    const snapshot = $state.snapshot(this.mapState) as unknown as DocumentMap<T>;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const map = new Map<UUID, T>();
    Object.values(snapshot).forEach((doc) => {
      if (doc) {
        map.set(doc._id, DocumentService.deepCopy(doc));
      }
    });
    return map;
  }

  /**
   * Adds a document to the local map without triggering persistence.
   * Useful for mocks and tests where you want to populate the store
   * without side effects.
   *
   * @param doc The document to add
   */
  public addDocWithoutPersist(doc: T): void {
    this.mapState[doc._id] = doc;
  }

  public addDoc(doc: T): void {
    this.addManyDocs([doc]);
  }

  public addManyDocs(docs: T[]): void {
    docs.forEach((doc) => {
      this.addDocWithoutPersist(doc);
    });
    this.config.persistToLocalData(this.mapState);
    this.config.persistToDb({ insert: docs });
  }

  public updateDoc(docId: UUID, mutator: Updater<T>): void {
    this.updateManyDocs([docId], mutator);
  }

  public updateManyDocs(
    filterOrDocIds: ((currentDoc: T) => boolean) | UUID[],
    mutator: Updater<T>
  ): void {
    const docsToUpdate = this.updateManyDocsWithoutPersist(filterOrDocIds, mutator);
    this.config.persistToLocalData(this.mapState);
    this.config.persistToDb({ update: docsToUpdate });
  }

  private updateManyDocsWithoutPersist(
    filterOrDocIds: ((currentDoc: T) => boolean) | UUID[],
    mutator: Updater<T>
  ): T[] {
    let docsToUpdate: T[] = [];
    if (Array.isArray(filterOrDocIds)) {
      const docIds = filterOrDocIds;
      docIds.forEach((docId) => {
        const currentDoc = this.mapState[docId];
        if (!currentDoc) {
          log.error(`Document with ID ${docId} does not exist in the map.`);
          return;
        }
        docsToUpdate.push(mutator(currentDoc));
      });
    } else {
      const filter = filterOrDocIds as (currentDoc: T) => boolean;
      docsToUpdate = this.getDocs().filter(filter);
      docsToUpdate.forEach(mutator);
    }
    return docsToUpdate;
  }

  public deleteDoc(docId: UUID): void {
    this.deleteManyDocs([docId]);
  }

  public deleteManyDocs(docIds: UUID[]): void {
    const docsToDelete: T[] = [];
    docIds.forEach((id) => {
      const doc = this.mapState[id];
      if (!doc) {
        log.error(`Document with ID ${id} does not exist in the map.`);
        return;
      }
      docsToDelete.push(doc);
      delete this.mapState[id];
    });
    this.config.persistToLocalData(this.mapState);
    this.config.persistToDb({ delete: docsToDelete });
  }

  public upsertManyDocs(upsertInfo: UpsertManyInfo<T>): void {
    const { filter, mutator, newDocs } = upsertInfo;
    newDocs.forEach((doc) => {
      this.addDocWithoutPersist(doc);
    });
    const docsToUpdate = this.updateManyDocsWithoutPersist(filter, mutator);
    this.config.persistToLocalData(this.mapState);
    this.config.persistToDb({
      insert: newDocs,
      update: docsToUpdate
    });
  }

  /**
   * Initializes or replaces the entire map. Persists to local data but
   * not to the DB (used when loading data from the API).
   *
   * @param newMap The new document map
   */
  public setMap(newMap: DocumentMap<T>): void {
    this.mapState = newMap;
    this.config.persistToLocalData(this.mapState);
  }

  /**
   * Applies document operations to local state (without triggering API persistence)
   * and returns the updated API options object with the corresponding
   * insert/update/delete operations for this document type.
   *
   * @param info The insert/update/delete operations to apply
   * @param apiOptions Optional existing options to extend. If omitted, starts fresh.
   * @returns The updated API options object (same reference if provided, new object if not)
   */
  public prepareDocsForSave(
    info: DocumentInsertOrUpdateInfo<T>,
    apiOptions: ProjectWorkoutPrimaryEndpointOptions = {}
  ): ProjectWorkoutPrimaryEndpointOptions {
    if (info.insert) {
      info.insert.forEach((doc) => this.addDocWithoutPersist(doc));
    }
    if (info.delete) {
      info.delete.forEach((doc) => delete this.mapState[doc._id]);
    }
    this.config.persistToLocalData(this.mapState);
    this.config.prepareForSave(apiOptions, info);
    return apiOptions;
  }
}
