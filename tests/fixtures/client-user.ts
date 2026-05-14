export interface ClientUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export const clientUsers: Record<string, ClientUser> = {
  standard: {
    email: 'test.client.e2e@calendapro.test',
    password: 'TestPassword123!',
    firstName: 'Sophie',
    lastName: 'Client',
    phone: '0612345678',
  },
  new: {
    email: 'test.client.new@calendapro.test',
    password: 'TestPassword123!',
    firstName: 'Nouveau',
    lastName: 'Client',
    phone: '0698765432',
  },
  booking: {
    email: 'test.client.booking@calendapro.test',
    password: 'TestPassword123!',
    firstName: 'Résa',
    lastName: 'Test',
    phone: '0678901234',
  },
};

export const generateUniqueClientUser = (suffix: string): ClientUser => ({
  email: `test.client.${suffix}@calendapro.test`,
  password: 'TestPassword123!',
  firstName: 'Client',
  lastName: `Test${suffix}`,
  phone: '06' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
});
