# FoodRun Platform - Production Deployment Guide

## 🚀 Deploying to Production

### Prerequisites

Before deploying, ensure you have:
- ✅ Supabase project (production)
- ✅ Vercel account
- ✅ GitHub repository
- ✅ OpenRouteService API key
- ✅ Przelewy24 production credentials (for payments)

---

## Step 1: Prepare Supabase Production

### 1.1 Create Production Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project (separate from development)
3. Choose a strong database password
4. Wait for provisioning (~2 minutes)

### 1.2 Run Database Migrations

In your production Supabase SQL Editor, run in order:

```sql
-- 1. Main schema (tables, functions, RLS)
-- Copy and run: supabase/schema.sql

-- 2. Delivery requests table
-- Copy and run: supabase/delivery_requests.sql
```

### 1.3 Create Storage Bucket

1. Storage → New bucket
2. Name: `documents`
3. Public bucket: Yes
4. Create

### 1.4 Get Production Credentials

Project Settings → API:
- Copy `Project URL`
- Copy `anon public` key
- Copy `service_role` key (keep secret!)

---

## Step 2: Deploy to Vercel

### 2.1 Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "FoodRun platform - production ready"

# Add remote and push
git remote add origin https://github.com/yourusername/foodrun.git
git branch -M main
git push -u origin main
```

### 2.2 Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2.3 Add Environment Variables

In Vercel project settings → Environment Variables, add:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Przelewy24 (Production - get from P24)
P24_MERCHANT_ID=your-production-merchant-id
P24_POS_ID=your-production-pos-id
P24_API_KEY=your-production-api-key
P24_CRC_KEY=your-production-crc-key

# OpenRouteService
NEXT_PUBLIC_OPENROUTE_API_KEY=your-ors-api-key

# App URL (will be your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 2.4 Deploy

Click "Deploy" - Vercel will build and deploy your app.

---

## Step 3: Post-Deployment Setup

### 3.1 Create Admin User

1. Go to Supabase Dashboard → Authentication
2. Add user: `admin@foodrun.pl`
3. Set strong password
4. Copy user UUID
5. Run in SQL Editor:

```sql
INSERT INTO profiles (id, user_type, full_name, phone)
VALUES ('PASTE-UUID-HERE', 'admin', 'Administrator', '+48123456789');
```

### 3.2 Update Webhooks

If using Przelewy24:
1. Login to P24 merchant panel
2. Set webhook URL: `https://your-app.vercel.app/api/payment/verify`
3. Configure signature verification

### 3.3 Test the Platform

1. **Admin Login**: Login as admin
2. **Restaurant Signup**: Create test restaurant, verify it
3. **Driver Signup**: Create test driver, verify documents
4. **Request Driver**: Create delivery request
5. **Accept Delivery**: Driver accepts and completes
6. **Check Database**: Verify delivery_requests table

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Domain in Vercel

1. Vercel project → Settings → Domains
2. Add your domain (e.g., `foodrun.pl`)
3. Follow DNS configuration instructions

### 4.2 Update Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://foodrun.pl
```

Redeploy after changing this.

### 4.3 Update Supabase Auth

1. Supabase → Authentication → URL Configuration
2. Site URL: `https://foodrun.pl`
3. Redirect URLs: Add `https://foodrun.pl/**`

---

## Step 5: Monitoring & Maintenance

### 5.1 Enable Logging

**Vercel:**
- Vercel Dashboard → Analytics (automatic)
- Monitor function execution, errors

**Supabase:**
- Dashboard → Logs
- Monitor database queries, auth events

### 5.2 Set Up Alerts

**Database Usage:**
- Supabase free tier: 500MB database
- Monitor usage in Supabase Dashboard

**API Limits:**
- OpenRouteService: 2,000 requests/day
- Monitor in ORS dashboard

### 5.3 Backup Strategy

**Database Backups:**
- Supabase Pro/Team plans have automatic daily backups
- Free tier: Manual exports via Dashboard → Database → Backups

**Code Backups:**
- GitHub repository (already backed up)

---

## Step 6: Security Checklist

### Pre-Launch Security

- [ ] All environment variables using production values
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is secret (not in client code)
- [ ] RLS policies enabled on all tables
- [ ] Storage bucket has proper access controls
- [ ] API routes validate authentication
- [ ] Rate limiting considered for public endpoints
- [ ] CORS configured correctly for API routes
- [ ] Strong admin password set
- [ ] HTTPS only (Vercel enables automatically)

### Post-Launch

- [ ] Monitor Vercel logs for errors
- [ ] Check Supabase auth logs for suspicious activity
- [ ] Regularly update dependencies
- [ ] Monitor API usage (OpenRouteService limit)

---

## Step 7: SSL & HTTPS

Vercel automatically provides:
- ✅ Free SSL certificate
- ✅ Automatic HTTPS redirect
- ✅ HTTP/2 support

No additional configuration needed.

---

## Step 8: Performance Optimization

### Enable Caching

Vercel automatically caches:
- Static files (images, CSS, JS)
- API responses (if configured)

### Image Optimization

Use Next.js `Image` component:
```tsx
import Image from 'next/image';

<Image src="/logo.png" width={200} height={50} alt="FoodRun" />
```

### Database Indexing

Already included in `schema.sql`:
- Indexes on foreign keys
- Indexes on frequently queried fields

---

## Step 9: Scaling Considerations

### Free Tier Limits

**Vercel Free:**
- 100GB bandwidth/month
- Serverless functions: 100GB-Hrs

**Supabase Free:**
- 500MB database
- 50K monthly active users
- 2GB bandwidth

**OpenRouteService Free:**
- 2,000 requests/day

### When to Upgrade

Upgrade when you hit:
- 10,000+ deliveries/month → Supabase Pro ($25/mo)
- 100,000+ page views/month → Vercel Pro ($20/mo)
- 2,000+ geocoding requests/day → ORS paid plan

---

## Troubleshooting

### Build Fails on Vercel

```bash
# Locally test build
npm run build

# Check for TypeScript errors
npm run type-check
```

### Database Connection Issues

- Verify Supabase project is not paused
- Check environment variables are correct
- Ensure RLS policies allow operations

### Maps Not Loading

- Verify `NEXT_PUBLIC_OPENROUTE_API_KEY` is set
- Check API key is valid at openrouteservice.org
- Monitor free tier limit (2,000/day)

### Authentication Errors

- Check Supabase URL and keys are correct
- Verify user exists in both `auth.users` and `profiles`
- Check RLS policies for the table

---

## Rollback Plan

If deployment has issues:

1. **Vercel**: Redeploy previous version
   - Deployments → Select working version → "Redeploy"

2. **Database**: Restore from backup
   - Supabase → Database → Backups → Restore

3. **Code**: Revert Git commit
   ```bash
   git revert HEAD
   git push
   ```

---

## Production Checklist

Before going live:

- [ ] All database migrations run successfully
- [ ] Admin user created and tested
- [ ] Test restaurant signup → verification → request driver
- [ ] Test driver signup → verification → accept delivery
- [ ] Environment variables all set correctly
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Error logging enabled
- [ ] Backup strategy in place
- [ ] Security checklist completed
- [ ] Team has admin access
- [ ] Support email configured
- [ ] Legal pages added (Terms, Privacy)

---

## Support & Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs (Vercel + Supabase)
- Check for pending verifications (restaurants/drivers)

**Weekly:**
- Review platform analytics
- Check API usage (OpenRouteService)
- Database backup verification

**Monthly:**
- Review and approve high-volume restaurants
- Update dependencies (`npm update`)
- Review RLS policies for optimization

---

## Cost Estimation

### Free Tier (0-100 deliveries/month)
- Vercel: Free
- Supabase: Free
- OpenRouteService: Free
- **Total: 0 PLN/month**

### Small Scale (100-1,000 deliveries/month)
- Vercel Free: 0 PLN
- Supabase Pro: ~100 PLN/month
- OpenRouteService: Free
- **Total: ~100 PLN/month**

### Medium Scale (1,000-10,000 deliveries/month)
- Vercel Pro: ~80 PLN/month
- Supabase Pro: ~100 PLN/month
- OpenRouteService Paid: ~200 PLN/month
- **Total: ~380 PLN/month**

---

**Your FoodRun platform is production-ready! 🚀**

Monitor closely in the first days and be ready to scale as needed.
