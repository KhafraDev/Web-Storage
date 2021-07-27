# Storage
 localStorage, sessionStorage, StorageEvent, and Storage in NodeJS

# Differences From Browser
- `Storage` is constructible (until `localStorage` and `sessionStorage` are defined globally).
- Symbol properties are likely glitchy and not guaranteed to work the same.
- No persistent layer for `localStorage`.
- Many `event-*` tests rely on DOM methods and as such are not enabled.

# TODO
- List needs to be re-ordered to follow spec.