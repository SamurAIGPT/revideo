const DATABASE_NAME = "revideo-editor-assets";
const DATABASE_VERSION = 1;
const ASSET_STORE = "assets";

function openDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not support local media storage."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ASSET_STORE)) {
        database.createObjectStore(ASSET_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local media storage."));
  });
}

export async function storeEditorAsset(id, file) {
  const database = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(ASSET_STORE, "readwrite");
      transaction.objectStore(ASSET_STORE).put({
        id,
        blob: file,
        name: file.name || "Uploaded media",
        mimeType: file.type || "application/octet-stream",
      });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not save this media file."));
      transaction.onabort = () => reject(transaction.error || new Error("Could not save this media file."));
    });
  } finally {
    database.close();
  }
}

export async function getEditorAsset(id) {
  if (!id) return null;
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(ASSET_STORE, "readonly").objectStore(ASSET_STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Could not load this media file."));
    });
  } finally {
    database.close();
  }
}

export function editorAssetReference(id) {
  return `revideo-asset://${id}`;
}
