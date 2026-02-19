import { type BaseDocument, type DocumentMap, DocumentService } from '@aneuhold/core-ts-db-lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentMapStoreService, {
  type DocumentInsertOrUpdateInfo
} from './DocumentMapStoreService.svelte';

interface TestDoc extends BaseDocument {
  name: string;
  value: number;
}

const persistToLocalDataMock = vi.fn<(map: DocumentMap<TestDoc>) => void>();
const persistToDbMock = vi.fn<(updateInfo: DocumentInsertOrUpdateInfo<TestDoc>) => void>();
const prepareForSaveMock = vi.fn();

function createTestService() {
  return new DocumentMapStoreService<TestDoc>({
    persistToLocalData: persistToLocalDataMock,
    persistToDb: persistToDbMock,
    prepareForSave: prepareForSaveMock
  });
}

describe('DocumentMapStoreService', () => {
  let service: DocumentMapStoreService<TestDoc>;
  let doc1: TestDoc;
  let doc2: TestDoc;

  beforeEach(() => {
    persistToLocalDataMock.mockClear();
    persistToDbMock.mockClear();
    service = createTestService();

    doc1 = {
      _id: DocumentService.generateID(),
      name: 'Doc 1',
      value: 10
    };
    doc2 = {
      _id: DocumentService.generateID(),
      name: 'Doc 2',
      value: 20
    };
  });

  it('should initialize with empty values', () => {
    expect(service.getDocs()).toEqual([]);
  });

  it('should add a document', () => {
    service.addDoc(doc1);
    expect(service.getDoc(doc1._id)).toEqual(doc1);
    expect(persistToDbMock).toHaveBeenCalledWith({ insert: [doc1] });
    expect(persistToLocalDataMock).toHaveBeenCalled();
  });

  it('should update a document', () => {
    service.addDoc(doc1);
    persistToDbMock.mockClear();
    persistToLocalDataMock.mockClear();

    service.updateDoc(doc1._id, (doc) => {
      doc.value = 15;
      return doc;
    });

    expect(service.getDoc(doc1._id)?.value).toBe(15);
    expect(persistToDbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: [expect.objectContaining({ value: 15 })]
      })
    );
    expect(persistToLocalDataMock).toHaveBeenCalled();
  });

  it('should update many documents', () => {
    service.addDoc(doc1);
    service.addDoc(doc2);
    persistToDbMock.mockClear();

    service.updateManyDocs(
      (doc) => doc.value > 0,
      (doc) => {
        doc.value = doc.value * 2;
        return doc;
      }
    );

    expect(service.getDoc(doc1._id)?.value).toBe(20);
    expect(service.getDoc(doc2._id)?.value).toBe(40);
    expect(persistToDbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.arrayContaining([
          expect.objectContaining({ _id: doc1._id, value: 20 }),
          expect.objectContaining({ _id: doc2._id, value: 40 })
        ])
      })
    );
  });

  it('should delete a document', () => {
    service.addDoc(doc1);
    persistToDbMock.mockClear();

    service.deleteDoc(doc1._id);

    expect(service.getDoc(doc1._id)).toBeUndefined();
    expect(persistToDbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        delete: [doc1]
      })
    );
  });

  it('should upsert many documents', () => {
    service.addDoc(doc1);
    persistToDbMock.mockClear();

    const doc3: TestDoc = {
      _id: DocumentService.generateID(),
      name: 'Doc 3',
      value: 30
    };

    service.upsertManyDocs({
      filter: (doc) => doc._id === doc1._id,
      mutator: (doc) => {
        doc.value = 99;
        return doc;
      },
      newDocs: [doc3]
    });

    expect(service.getDoc(doc1._id)?.value).toBe(99);
    expect(service.getDoc(doc3._id)).toEqual(doc3);

    expect(persistToDbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        insert: [doc3],
        update: [expect.objectContaining({ _id: doc1._id, value: 99 })]
      })
    );
  });

  it('should return an empty map initially from getMap', () => {
    const map = service.getMap();
    expect(map.size).toBe(0);
  });

  it('should return a map with all added documents from getMap', () => {
    service.addDoc(doc1);
    service.addDoc(doc2);

    const map = service.getMap();
    expect(map.get(doc1._id)).toEqual(doc1);
    expect(map.get(doc2._id)).toEqual(doc2);
  });

  it('should return a deep copy from getMap so mutations do not affect the store', () => {
    service.addDoc(doc1);

    const map = service.getMap();
    const docInMap = map.get(doc1._id);
    expect(docInMap).toBeDefined();
    if (docInMap) {
      docInMap.value = 999;
    }

    expect(service.getDoc(doc1._id)?.value).toBe(10);
  });

  it('should set map', () => {
    const newMap = { [doc1._id]: doc1, [doc2._id]: doc2 };
    service.setMap(newMap);

    expect(service.getDoc(doc1._id)).toEqual(doc1);
    expect(service.getDoc(doc2._id)).toEqual(doc2);
    expect(service.getDocs()).toHaveLength(2);
    expect(persistToLocalDataMock).toHaveBeenCalled();
    // setMap does NOT persist to DB
    expect(persistToDbMock).not.toHaveBeenCalled();
  });
});
