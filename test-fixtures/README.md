# 📦 Sample APK Test Fixtures

This directory holds reference Android application packages used to validate `retrofit-sdk-gen` reverse-engineering, DTO parsing, multi-language code generation, and compiler compatibility.

## Recommended Test APKs

| APK Target | Domain / Public API | Retrofit Patterns Tested |
| :--- | :--- | :--- |
| `store.apk` | **E-Commerce** (DummyJSON / FakeStore) | CRUD operations (`@GET`, `@POST`, `@PUT`, `@DELETE`), `@Body`, `@Query`, OkHttp auth token interceptor. |
| `github.apk` | **Dev Explorer** (GitHub REST API) | Path parameter interpolation (`@Path`), dynamic headers (`@Header`), search queries. |
| `crypto.apk` | **Finance** (CoinGecko API) | Complex DTO trees, enums, array parsing, currency formatting queries. |

## Obtaining Fixtures On-Demand

To keep the repository clone size under **2 MB**, binary `.apk` files are **not tracked in Git**.

You can download or set up the fixtures at any time with a single command:

```bash
npm run fixtures:download
```

* **Local dev**: If the APKs are already in your workspace, the script automatically copies them to `test-fixtures/`.
* **Clean clone**: Downloads them on-demand from the official GitHub Release assets (`fixtures-v1.0`).

---

## Running the Automated Verification Suite

Once fixtures are present in `test-fixtures/`:

```bash
# Run individual verification suites:
npm run test:shopflow
npm run test:github
npm run test:crypto

# Run all 3 verification suites sequentially:
npm run test:all-apks

# Test with your own APK from anywhere:
retrofit-sdk-gen test /path/to/your-app.apk
```

---

## Publishing Fixtures (One-Time Maintainer Setup)

When ready to host the fixtures on GitHub:
```bash
# Using GitHub CLI (gh):
gh release create fixtures-v1.0 "test-fixtures/ShopFlow.apk" "test-fixtures/GitHub Client.apk" "test-fixtures/Crypto Tracker.apk" --title "Test Fixtures v1.0" --notes "Sample APKs for automated SDK verification"
```
