/**
 * Firestore Security Rules Test Suite — Verifies all "Dirty Dozen" payloads return PERMISSION_DENIED
 */

export interface DirtyPayloadTest {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: {
    uid: string;
    email?: string;
    email_verified?: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyPayloadTest[] = [
  {
    id: 1,
    name: 'Unauthenticated Customer Read',
    operation: 'get',
    path: '/customers/user_1',
    auth: null,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoof',
    operation: 'create',
    path: '/customers/user_1',
    auth: {
      uid: 'user_1',
      email: 'krishprakashsolanki@gmail.com',
      email_verified: false,
    },
    payload: { uid: 'user_1' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User PII Read',
    operation: 'get',
    path: '/customers/user_1',
    auth: {
      uid: 'user_2',
      email: 'user2@gmail.com',
      email_verified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Customer',
    operation: 'create',
    path: '/customers/user_1',
    auth: {
      uid: 'user_1',
      email: 'user1@gmail.com',
      email_verified: true,
    },
    payload: {
      uid: 'user_1',
      email: 'user1@gmail.com',
      displayName: 'Test User',
      phone: '+919876543210',
      address: '123 MG Road',
      landmark: 'Near Metro',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      isAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Identity Spoofing on Order Creation',
    operation: 'create',
    path: '/orders/WOLKO-10001',
    auth: {
      uid: 'user_1',
      email: 'user1@gmail.com',
      email_verified: true,
    },
    payload: {
      orderId: 'WOLKO-10001',
      userId: 'user_2',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Orphaned Order Creation without Customer Profile',
    operation: 'create',
    path: '/orders/WOLKO-10002',
    auth: {
      uid: 'orphan_user',
      email: 'orphan@gmail.com',
      email_verified: true,
    },
    payload: {
      orderId: 'WOLKO-10002',
      userId: 'orphan_user',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'ID Poisoning Attack',
    operation: 'create',
    path: '/orders/BAD ID $$$',
    auth: {
      uid: 'user_1',
      email: 'user1@gmail.com',
      email_verified: true,
    },
    payload: {
      orderId: 'BAD ID $$$',
      userId: 'user_1',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Denial-of-Wallet String Overflow',
    operation: 'create',
    path: '/orders/WOLKO-10003',
    auth: {
      uid: 'user_1',
      email: 'user1@gmail.com',
      email_verified: true,
    },
    payload: {
      orderId: 'WOLKO-10003',
      userId: 'user_1',
      address: 'A'.repeat(2000),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery',
    operation: 'create',
    path: '/orders/WOLKO-10004',
    auth: {
      uid: 'user_1',
      email: 'user1@gmail.com',
      email_verified: true,
    },
    payload: {
      orderId: 'WOLKO-10004',
      userId: 'user_1',
      createdAt: '1999-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immutable Field Mutation on Update',
    operation: 'update',
    path: '/orders/WOLKO-10001',
    auth: {
      uid: 'user_1',
      email: 'user1@gmail.com',
      email_verified: true,
    },
    payload: {
      userId: 'user_2',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Value Poisoning on Update',
    operation: 'update',
    path: '/orders/WOLKO-10001',
    auth: {
      uid: 'user_1',
      email: 'user1@gmail.com',
      email_verified: true,
    },
    payload: {
      orderStatus: 999999,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Blanket List Scraping by Non-Owner',
    operation: 'list',
    path: '/orders',
    auth: {
      uid: 'user_2',
      email: 'user2@gmail.com',
      email_verified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
