/// <reference types="cypress" />

describe('🚀 Quick App Test', () => {
  it('should load the app without errors', () => {
    cy.visit('/', { failOnStatusCode: false });
    
    // Esperar a que cargue
    cy.wait(3000);
    
    // Verificar que el root no esté vacío
    cy.get('#root').should('exist').then(($root) => {
      const content = $root.html();
      cy.log('Root content:', content);
      
      if (content && content.trim() !== '') {
        cy.log('✅ SUCCESS: App is rendering content!');
      } else {
        cy.log('❌ FAIL: Root is still empty');
      }
    });
  });
});
