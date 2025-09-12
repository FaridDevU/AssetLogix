// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-cy=email-input]').type(email)
  cy.get('[data-cy=password-input]').type(password)
  cy.get('[data-cy=login-button]').click()
})

// Custom command for data-cy selector
Cypress.Commands.add('dataCy', (selector: string) => {
  return cy.get(`[data-cy=${selector}]`)
})

// Disable Chrome web security for development
Cypress.on('before:browser:launch', (browser, launchOptions) => {
  if (browser.name === 'chrome') {
    launchOptions.args.push('--disable-web-security')
    launchOptions.args.push('--disable-features=VizDisplayCompositor')
  }
})
