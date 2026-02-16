# Authentication System Documentation

## Overview
The authentication system has been modernized to use React Context API, centralized state management, and type-safe API calls.

## Key Components

### 1. `AuthContext.tsx` (`frontend1/contexts/AuthContext.tsx`)
- **State**: Manages `user` object and `loading` status.
- **Methods**:
  - `signin(credentials)`: Logs in, sets token in localStorage, updates user state, redirects to dashboard.
  - `signup(credentials)`: Registers user, sets token, updates user state, redirects to dashboard.
  - `signout()`: Clears token, resets state, redirects to signin.
- **Hook**: `useAuth()` exposes these methods and state to any component.
- **HOC**: `withAuth(Component)` protects routes by checking authentication status.

### 2. `api-client.ts` (`frontend1/lib/api-client.ts`)
- **Interceptors**: Automatically attaches `Authorization` header from localStorage to every request.
- **Error Handling**: Automatically redirects to `/signin` on 401 Unauthorized responses.

### 3. `LoginCard.tsx` (`frontend1/component/LoginCard.tsx`)
- Uses `useAuth()` to perform login.
- Uses `useToast()` for error feedback.
- No longer manages tokens manually.

## Usage

### protecting a Page
```typescript
import { withAuth } from "@/contexts/AuthContext";

function MyProtectedPage() {
  return <div>Secure Content</div>;
}

export default withAuth(MyProtectedPage);
```

### Accessing User Data
```typescript
import { useAuth } from "@/contexts/AuthContext";

function UserProfile() {
  const { user } = useAuth();
  return <div>Welcome, {user?.name}</div>;
}
```

## Security Notes
- Examples use `localStorage` for simplicity. For higher security, consider migrating to HTTP-only cookies in the backend and frontend.
- Critical operations should always be verified on the backend.
