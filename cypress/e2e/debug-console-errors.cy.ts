/// <reference types="cypress" />

describe('🔍 Debug Console Errors', () => {
  it('should detect JavaScript console errors that prevent React from rendering', () => {
    // Capturar errores de consola antes de visitar la página
    const consoleErrors: any[] = [];
    const consoleWarnings: any[] = [];
    
    cy.window().then((win) => {
      // Interceptar console.error
      cy.stub(win.console, 'error').callsFake((...args) => {
        consoleErrors.push(args);
        console.error('[CAPTURED ERROR]:', ...args);
      });
      
      // Interceptar console.warn
      cy.stub(win.console, 'warn').callsFake((...args) => {
        consoleWarnings.push(args);
        console.warn('[CAPTURED WARNING]:', ...args);
      });
    });

    // Visitar la página
    cy.visit('/', { failOnStatusCode: false });
    
    // Esperar un momento para que se ejecute el JavaScript
    cy.wait(2000);
    
    // Verificar si el elemento root existe pero está vacío
    cy.get('#root').should('exist').then(($root) => {
      const rootHtml = $root.html();
      cy.log(`Root HTML content: "${rootHtml}"`);
      
      if (!rootHtml || rootHtml.trim() === '') {
        cy.log('🚨 Root element is empty - React is not mounting');
      } else {
        cy.log('✅ Root element has content - React is mounting');
      }
    });
    
    // Verificar errores de consola capturados
    cy.then(() => {
      if (consoleErrors.length > 0) {
        cy.log(`🚨 Found ${consoleErrors.length} console errors:`);
        consoleErrors.forEach((error, index) => {
          cy.log(`Error ${index + 1}:`, error);
        });
      } else {
        cy.log('✅ No console errors detected');
      }
      
      if (consoleWarnings.length > 0) {
        cy.log(`⚠️ Found ${consoleWarnings.length} console warnings:`);
        consoleWarnings.forEach((warning, index) => {
          cy.log(`Warning ${index + 1}:`, warning);
        });
      }
    });
    
    // Verificar si hay excepciones no capturadas
    cy.window().then((win) => {
      let uncaughtErrors: any[] = [];
      
      win.addEventListener('error', (event) => {
        uncaughtErrors.push({
          message: event.error?.message || event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });
      
      win.addEventListener('unhandledrejection', (event) => {
        uncaughtErrors.push({
          type: 'unhandledrejection',
          reason: event.reason
        });
      });
      
      // Esperar por posibles errores asincrónicos
      cy.wait(1000).then(() => {
        if (uncaughtErrors.length > 0) {
          cy.log(`🚨 Found ${uncaughtErrors.length} uncaught errors:`);
          uncaughtErrors.forEach((error, index) => {
            cy.log(`Uncaught Error ${index + 1}:`, error);
          });
        } else {
          cy.log('✅ No uncaught errors detected');
        }
      });
    });
    
    // Intentar detectar si hay elementos React específicos
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      cy.log(`Body text content: "${bodyText}"`);
      
      // Buscar indicadores de que React se está ejecutando
      const reactIndicators = [
        'Loading...',
        'Cargando...',
        'Dashboard',
        'Bienvenido',
        'Sistema',
        'AssetLogix'
      ];
      
      let foundIndicators = 0;
      reactIndicators.forEach(indicator => {
        if (bodyText.includes(indicator)) {
          foundIndicators++;
          cy.log(`✅ Found React indicator: "${indicator}"`);
        }
      });
      
      if (foundIndicators === 0) {
        cy.log('🚨 No React indicators found - app may not be rendering');
      } else {
        cy.log(`✅ Found ${foundIndicators} React indicators`);
      }
    });
    
    // Verificar recursos cargados
    cy.window().then((win) => {
      const performance = win.performance;
      const resources = performance.getEntriesByType('resource');
      
      cy.log(`📊 Loaded ${resources.length} resources:`);
      
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const cssResources = resources.filter(r => r.name.includes('.css'));
      
      cy.log(`📄 JavaScript files: ${jsResources.length}`);
      jsResources.forEach(js => {
        cy.log(`  - ${js.name}`);
      });
      
      cy.log(`🎨 CSS files: ${cssResources.length}`);
      cssResources.forEach(css => {
        cy.log(`  - ${css.name}`);
      });
    });
  });
  
  it('should check network requests for API errors', () => {
    // Interceptar todas las llamadas de red
    cy.intercept('**').as('allRequests');
    
    cy.visit('/', { failOnStatusCode: false });
    
    // Esperar a que se realicen las llamadas de red
    cy.wait(3000);
    
    // Verificar si hay errores de red
    cy.get('@allRequests.all').then((requests: any) => {
      const requestsArray = Array.isArray(requests) ? requests : [requests];
      cy.log(`📡 Made ${requestsArray.length} network requests`);
      
      requestsArray.forEach((request: any, index: number) => {
        if (request && request.response) {
          const { response } = request;
          if (response && response.statusCode >= 400) {
            cy.log(`🚨 Failed request ${index + 1}: ${request.request.method} ${request.request.url} - Status: ${response.statusCode}`);
          } else {
            cy.log(`✅ Request ${index + 1}: ${request.request.method} ${request.request.url} - Status: ${response?.statusCode || 'No response'}`);
          }
        }
      });
    });
  });
});
