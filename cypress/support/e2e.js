
Cypress.Commands.add('resetDB', () => {
  cy.request('POST', 'http://localhost:3006/api/reset');
});

Cypress.Commands.add('getItems', () => {
  return cy.request('GET', 'http://localhost:3006/api/jobs').its('body');
});

beforeEach(() => {
  cy.resetDB();
});
