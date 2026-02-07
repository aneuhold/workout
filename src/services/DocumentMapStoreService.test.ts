import { type BaseDocument, type DocumentMap, DocumentService } from '@aneuhold/core-ts-db-lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentMapStoreService, {
  type DocumentInsertOrUpdateInfo
} from './DocumentMapStoreService.svelte';

// Define a concrete implementation for testing
interface TestDoc extends BaseDocument {
  name: string;
  value: number;
}

class TestDocumentMapStoreService extends DocumentMapStoreService<TestDoc> {
  public constructor() {
    super();
  }

  // Mocks for abstract methods
  public static persistToLocalDataMock = vi.fn<() => DocumentMap<TestDoc>>().mockReturnValue({});
  public static getFromLocalDataMock = vi
    .fn<() => DocumentMap<TestDoc> | null>()
    .mockReturnValue(null);
  public static persistToDbMock =
    vi.fn<(updateInfo: DocumentInsertOrUpdateInfo<TestDoc>) => void>();

  protected persistToLocalData(): DocumentMap<TestDoc> {
    return TestDocumentMapStoreService.persistToLocalDataMock();
  }

  protected getFromLocalData(): DocumentMap<TestDoc> | null {
    return TestDocumentMapStoreService.getFromLocalDataMock();
  }

  protected persistToDb(updateInfo: DocumentInsertOrUpdateInfo<TestDoc>): void {
    TestDocumentMapStoreService.persistToDbMock(updateInfo);
  }
}

describe('DocumentMapStoreService', () => {
  let service: TestDocumentMapStoreService;
  let doc1: TestDoc;
  let doc2: TestDoc;

  beforeEach(() => {
    TestDocumentMapStoreService.persistToLocalDataMock.mockClear();
    TestDocumentMapStoreService.getFromLocalDataMock.mockClear();
    TestDocumentMapStoreService.persistToDbMock.mockClear();
    service = new TestDocumentMapStoreService();

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

  it('should initialize with empty map', () => {
    expect(service.mapState).toEqual({});
  });

  it('should add a document', () => {
    service.addDoc(doc1);
    expect(service.mapState[doc1._id]).toEqual(doc1);
    expect(TestDocumentMapStoreService.persistToDbMock).toHaveBeenCalledWith({ insert: [doc1] });
    expect(TestDocumentMapStoreService.persistToLocalDataMock).toHaveBeenCalled();
  });

  it('should update a document', () => {
    service.addDoc(doc1);
    // Clear mocks to verify update specifically
    TestDocumentMapStoreService.persistToDbMock.mockClear();
    TestDocumentMapStoreService.persistToLocalDataMock.mockClear();

    service.updateDoc(doc1._id, (d) => {
      d.value = 15;
      return d;
    });

    expect(service.mapState[doc1._id]?.value).toBe(15);
    expect(TestDocumentMapStoreService.persistToDbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        update: [expect.objectContaining({ value: 15 })]
      })
    );
    expect(TestDocumentMapStoreService.persistToLocalDataMock).toHaveBeenCalled();
  });

  it('should update many documents', () => {
    service.addDoc(doc1);
    service.addDoc(doc2);
    TestDocumentMapStoreService.persistToDbMock.mockClear();

    service.updateManyDocs(
      (doc) => doc.value > 0,
      (doc) => {
        doc.value = doc.value * 2;
        return doc;
      }
    );

    const map = service.mapState;
    expect(map[doc1._id]?.value).toBe(20);
    expect(map[doc2._id]?.value).toBe(40);
    expect(TestDocumentMapStoreService.persistToDbMock).toHaveBeenCalledWith(
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
    TestDocumentMapStoreService.persistToDbMock.mockClear();

    service.deleteDoc(doc1._id);

    expect(service.mapState[doc1._id]).toBeUndefined();
    expect(TestDocumentMapStoreService.persistToDbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        delete: [doc1]
      })
    );
  });

  it('should upsert many documents', () => {
    service.addDoc(doc1);
    TestDocumentMapStoreService.persistToDbMock.mockClear();

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

    const map = service.mapState;
    expect(map[doc1._id]?.value).toBe(99);
    expect(map[doc3._id]).toEqual(doc3);

    expect(TestDocumentMapStoreService.persistToDbMock).toHaveBeenCalledWith(
      expect.objectContaining({
        insert: [doc3],
        update: [expect.objectContaining({ _id: doc1._id, value: 99 })]
      })
    );
  });

  it('should set map', () => {
    const newMap = { [doc1._id]: doc1, [doc2._id]: doc2 };
    service.setMap(newMap);

    expect(service.mapState).toEqual(newMap);
    expect(TestDocumentMapStoreService.persistToLocalDataMock).toHaveBeenCalled();
    // setMap does NOT persist to DB
    expect(TestDocumentMapStoreService.persistToDbMock).not.toHaveBeenCalled();
  });
});
