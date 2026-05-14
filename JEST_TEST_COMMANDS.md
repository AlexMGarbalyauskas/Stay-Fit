# Jest Test Commands

Use these commands to run the Jest tests created for the Stay-Fit project.

## Unit Tests

### Crypto Tests

```powershell
$env:CI='true'; npm test -- --runTestsByPath src/tests/crypto/crypto.test.js
```

### Streak Test

```powershell
$env:CI='true'; npm test -- --runTestsByPath src/tests/streak/streak.test.js
```

### Translations Test

```powershell
$env:CI='true'; npm test -- --runTestsByPath src/tests/translations/translations.test.js
```

## Integration Tests

### api.integration.test

```powershell
Set-Location "c:\Users\smart\OneDrive\Documents\College\Year 4\semester-1\final-year-project\Project\stay-fit\backend"
$env:NODE_ENV='test'
npm run test:integration
```

## System Tests

### App Test

```powershell
Set-Location "c:\Users\smart\OneDrive\Documents\College\Year 4\semester-1\final-year-project\Project\stay-fit\frontend"
$env:CI='true'; npm test -- --runTestsByPath src/App.test.js --watch=false
```

## Class Testing

### Auth Class Test

```powershell
Set-Location "c:\Users\smart\OneDrive\Documents\College\Year 4\semester-1\final-year-project\Project\stay-fit\backend"
$env:NODE_ENV='test'
npm run test:class
```
