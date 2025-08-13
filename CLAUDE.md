# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UDIGN (유다인) is a Next.js 15 e-commerce platform with multi-language support, admin panel, and payment integration. The project uses React 19, TypeScript, Tailwind CSS v4, and MySQL database.

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check code formatting

# Git Progress Logging (as per Cursor rules)
git log --since=midnight > ./bg_progress/YYMMDD.txt
git log --since=midnight -p > ./bg_progress/YYMMDD_full.txt
```

## Database Architecture

### Connection Pattern
The project uses MySQL with per-request connections:
```typescript
// Always use executeQuery for database operations
import { executeQuery } from '@/lib/database';

// Connection cleanup is handled automatically
const results = await executeQuery('SELECT * FROM table WHERE id = ?', [id]);
```

### Key Tables
- `g5_member`: User accounts with legacy PHP password support
- `g5_shop_order`: Orders with status tracking
- `g5_shop_cart`: Shopping cart and order items
- `g5_shop_item`: Products/artwork listings
- `g5_shop_category`: Product categories
- `g5_board_*`: Review system tables

### Environment Variables Required
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=udign
DB_PASSWORD=your_password
DB_NAME=udign
JWT_SECRET=your_jwt_secret
TOSS_PAYMENTS_SECRET_KEY=your_toss_key
```

## Authentication System

### Password Compatibility
The system supports multiple password formats for migration from PHP:
1. bcrypt (new users)
2. PHP password_hash ($2y$, $2a$)
3. Django PBKDF2-SHA256 (sha256:iterations:salt:hash)
4. MD5 (legacy)

### JWT Token Pattern
- Stored in HTTP-only cookies (`auth-token`)
- 24-hour expiration
- Auto-login cookies: `ck_mb_id` and `ck_auto` (31 days)

### Permission Levels
```typescript
MEMBER_LEVELS = {
  GUEST: 1,
  MEMBER: 2,
  ADMIN: 9,
  SUPER_ADMIN: 10
}
```

## API Response Patterns

All API endpoints follow this structure:
```typescript
// Success
{ success: true, data?: any, message?: string }

// Error
{ success: false, error: string, message?: string }
```

### Admin API Protection
Admin routes (`/api/admin/*`) require:
1. Valid JWT token
2. User level >= 9 (ADMIN)
3. Permission checks via `PERMISSION_CHECKS` utility

## Internationalization (i18n)

### Supported Languages
- Korean (ko) - default
- English (en)
- Japanese (ja)
- Chinese (zh)

### Implementation Pattern
```typescript
// Server components
import { getDictionary } from '@/lib/dictionaries';
const dict = await getDictionary(params.lang);

// Client components receive dictionary as prop
<Component dictionary={dict} />
```

### Language Detection Priority
1. Cookie (`NEXT_LOCALE`)
2. Browser preference (fallback)
3. Default: Korean

## Payment Integration

### TossPayments Flow
1. Create order → `/api/payments/create-order`
2. Client-side payment widget
3. Confirm payment → `/api/payments/confirm`
4. Update order status and send notifications

### Order Status Flow
주문 (Order) → 입금 (Paid) → 준비 (Preparing) → 배송 (Shipping) → 완료 (Complete)

## Component Architecture

### UI Component Pattern (shadcn/ui)
- Primitives in `/components/ui/primitives/`
- Use `cn()` utility for className merging
- Variants handled via `class-variance-authority`

### State Management
- **Global**: AuthContext for user state
- **Local**: React hooks for component state
- **Server**: Direct database queries in server components
- **Client**: API calls with loading states

### Form Handling
```typescript
// Standard pattern with react-hook-form + zod
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: { ... }
});
```

## Email & SMS Integration

### Email (Nodemailer + Gmail)
- Templates in `/lib/email-templates/`
- HTML emails with consistent styling
- Admin notifications for orders

### SMS (iCode Korea)
- Token-key authentication
- Template-based messages
- EUC-KR encoding for Korean text
- Balance checking before sending

## File Upload

### Image Storage
- Vercel Blob for production
- Local development: `/tmp/` directory
- Supported formats: JPG, PNG, GIF, WEBP

### Upload Pattern
```typescript
// Use /api/upload/artwork endpoint
const formData = new FormData();
formData.append('files', file);
```

## Common Patterns to Follow

### Database Queries
- Always use parameterized queries
- Handle connection cleanup properly
- Use transactions for multi-table updates

### Error Handling
- Return appropriate HTTP status codes
- Log errors to console for debugging
- Provide user-friendly error messages

### Component Creation
1. Check existing components for patterns
2. Use TypeScript interfaces for props
3. Include loading and error states
4. Follow existing naming conventions

### API Endpoint Creation
1. Validate input data
2. Check authentication/permissions
3. Use try-catch with proper error responses
4. Follow RESTful conventions

## Project Structure

```
src/
├── app/
│   ├── [lang]/        # Internationalized shop routes
│   ├── admin/         # Admin panel (no i18n)
│   └── api/           # API endpoints
├── components/        # React components
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── lib/               # Utilities and services
├── locales/           # Translation files
└── types/             # TypeScript type definitions
```

## Critical Considerations

1. **Legacy System Compatibility**: The database schema follows GnuBoard 5 conventions (g5_ prefix)
2. **Password Migration**: Always test authentication with multiple password formats
3. **Admin Security**: Double-check permission levels for admin operations
4. **SMS Cost**: Check SMS balance before bulk operations
5. **Image Processing**: Ensure proper error handling for file uploads
6. **Transaction Integrity**: Use database transactions for order processing
7. **Cookie Security**: Use httpOnly, secure, and sameSite attributes
8. **SQL Injection**: Never concatenate user input in queries