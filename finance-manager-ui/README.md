# finance-manager-ui

Mobile/web client.

## Overview
Ionic/Angular app that calls `account-service`, `transaction-service`, `statement-loader`, and `api-gateway` (for auth) directly - there's no BFF/API-gateway-as-proxy layer; each service's base URL is configured independently per environment.

## Tech stack
- Angular 19, Ionic 8, Capacitor 7 (for iOS packaging)
- RxJS
- Karma/Jasmine for unit tests, ESLint for linting

## Local setup & run
```bash
cd finance-manager-ui
npm install
npm start              # ng serve, local environment (http://localhost:4200 by default)
# or: npm run start:dev / start:qa / start:uat / start:prod
```
`ionic serve --external` (see `scripts/local_startup/finance-manager-ui.sh`) is used instead when you need the dev server reachable from another device on the LAN. Production container listens on port **8100** (see `Dockerfile`).

### Environments
Environment config (which backend URLs to call) lives in `src/environments/environment*.ts`, selected via the Angular build `--configuration` flag:

| Env | File | Notes |
|---|---|---|
| local (default) | `environment.ts` | `localhost:5001-5004` |
| dev | `environment.dev.ts` | |
| qa | `environment.qa.ts` | |
| uat | `environment.uat.ts` | |
| prod | `environment.prod.ts` | |

```bash
npm run build          # ng build (local config)
npm run build:dev / build:qa / build:uat / build:prod
```

### iOS (Capacitor)
```bash
ionic build
npx cap copy ios
npx cap open ios        # opens Xcode
```
(`chmod 777 -R ios` and `pod install` may be needed the first time, per Capacitor's usual iOS setup.)

## Key modules
- `src/app/` - one folder per feature: `tabs` (nav shell), `account-list`, `transaction-list`, `category-list`, `statement-uploader`, `auth`, `logout`, `tab2`, `tab3`, `explore-container`.
- `src/service/` - one HTTP client service per backend concern: `account.service.ts`, `user.account.service.ts`, `transaction.service.ts`, `category.service.ts`, `statement-upload.service.ts`, `user.service.ts` (auth), plus `auth-inteceptor.service.ts` (attaches the auth token to outgoing requests) and `auth-guard.service.ts` (route protection).
- `src/model/` - shared TypeScript interfaces/types for the above.

## Testing
```bash
npm test    # ng test (Karma/Jasmine)
npm run lint
```
Spec files exist for most services (`*.service.spec.ts`) but not yet for most components/pages under `src/app/`.

## Gotchas
- No API-gateway-as-proxy: if a backend service's URL/port changes, update it in every `environment.*.ts`, not just one place.
