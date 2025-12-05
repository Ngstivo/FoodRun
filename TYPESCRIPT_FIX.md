# TypeScript Build Errors - Quick Fix Guide

The Vercel build is failing due to TypeScript errors in admin pages. Here's how to fix them:

## Problem
The Supabase query type inference fails when proper error handling isn't added.

## Solution - Fix All Admin Pages

Replace the auth check sections in these 4 files:

###  1. `app/admin/commission-management/page.tsx`

**Find lines 35-45:**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('user_type')
  .eq('id', user.id)
  .single();

if (profile?.user_type !== 'admin') {
  router.push('/');
  return;
}
```

**Replace with:**
```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('user_type')
  .eq('id', user.id)
  .single();

if (profileError || !profile || profile.user_type !== 'admin') {
  router.push('/');
  return;
}
```

---

### 2. `app/admin/dashboard/page.tsx`

**Find lines 33-40:**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('user_type')
  .eq('id', user.id)
  .single();

if (profile?.user_type !== 'admin') {
  router.push('/');
```

**Replace with:**
```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('user_type')
  .eq('id', user.id)
  .single();

if (profileError || !profile || profile.user_type !== 'admin') {
  router.push('/');
```

---

### 3. `app/admin/verify-drivers/page.tsx`

**Find lines 53-60:**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('user_type')
  .eq('id', user.id)
  .single();

if (profile?.user_type !== 'admin') {
  router.push('/');
```

**Replace with:**
```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('user_type')
  .eq('id', user.id)
  .single();

if (profileError || !profile || profile.user_type !== 'admin') {
  router.push('/');
```

---

### 4. `app/admin/verify-restaurants/page.tsx`

**Find lines 36-43:**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('user_type')
  .eq('id', user.id)
  .single();

if (profile?.user_type !== 'admin') {
  router.push('/');
```

**Replace with:**
```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('user_type')
  .eq('id', user.id)
  .single();

if (profileError || !profile || profile.user_type !== 'admin') {
  router.push('/');
```

---

## After Fixing

1. **Save all 4 files**
2. **Test locally:**
   ```bash
   npm run build
   ```
   Should complete successfully

3. **Push to GitHub:**
   ```bash
   git add -A
   git commit -m "Fix TypeScript errors in admin auth checks"
   git push origin main
   ```

4. **Vercel will auto-deploy!**

---

## Why This Fixes It

TypeScript can't infer types when you don't handle errors. By destructuring the error AND checking for both conditions (`!profile` AND `profile.user_type !== 'admin'`), TypeScript knows the profile is defined and has the correct shape.
