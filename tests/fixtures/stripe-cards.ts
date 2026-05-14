export interface StripeTestCard {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
  description: string;
  expectedResult: 'success' | 'decline' | '3ds';
}

export const stripeTestCards: Record<string, StripeTestCard> = {
  success: {
    number: '4242 4242 4242 4242',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Client',
    description: 'Visa - Paiement accepté',
    expectedResult: 'success',
  },
  declineGeneric: {
    number: '4000 0000 0000 0002',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Client',
    description: 'Carte refusée - Insufficient funds',
    expectedResult: 'decline',
  },
  declineLost: {
    number: '4000 0000 0000 9987',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Client',
    description: 'Carte perdue',
    expectedResult: 'decline',
  },
  declineStolen: {
    number: '4000 0000 0000 9979',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Client',
    description: 'Carte volée',
    expectedResult: 'decline',
  },
  declineExpired: {
    number: '4000 0000 0000 0069',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Client',
    description: 'Carte expirée',
    expectedResult: 'decline',
  },
  declineIncorrectCvc: {
    number: '4000 0000 0000 0127',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Client',
    description: 'CVC incorrect',
    expectedResult: 'decline',
  },
  threeDSuccess: {
    number: '4000 0025 0000 3155',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Client',
    description: '3D Secure - Authentification réussie',
    expectedResult: '3ds',
  },
  threeDFailure: {
    number: '4000 0025 0000 3155',
    expiry: '12/30',
    cvc: '123',
    name: 'Test Client',
    description: '3D Secure - Échec authentification',
    expectedResult: '3ds',
  },
};
