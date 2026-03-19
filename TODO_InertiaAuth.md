# Inertia Auth Migration TODO

## Steps:
- [x] Step 1: Ensure routes/web.php or auth.php has Route::post('register', [RegisteredUserController::class, 'store'])->name('register');
- [x] Step 2: Fix app/Http/Controllers/Auth/RegisteredUserController.php logic (shop creation if store_admin)
- [x] Step 3: Update resources/js/pages/Auth/Register.jsx to useForm (remove Axios/AuthContext)
- [x] Step 4: Simplify resources/js/contexts/AuthContext.jsx (remove register/login API calls)
- [x] Step 5: Clear caches + test
- [x] Step 6: Remove/deprecate Api/AuthController.php if unused (deprecated, no delete)

Current progress: Steps 1-3 complete, proceeding to cleanup

