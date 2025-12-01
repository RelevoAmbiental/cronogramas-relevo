export async function waitForRelevoFirebase() {
  if (window.__RELEVO_DB__) return window.__RELEVO_DB__;

  return new Promise((resolve) => {
    document.addEventListener("RELEVO_FIREBASE_READY", () => {
      resolve(window.__RELEVO_DB__);
    });
  });
}
