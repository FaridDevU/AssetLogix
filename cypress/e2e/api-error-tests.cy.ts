describe('AssetLogix - API Error Detection', () => {
  it('should test API endpoints for errors', () => {
    const apiEndpoints = [
      '/api/users',
      '/api/equipment',
      '/api/projects', 
      '/api/maintenance',
      '/api/documents',
      '/api/dashboard',
      '/api/auth/status'
    ]

    apiEndpoints.forEach((endpoint) => {
      cy.request({
        method: 'GET',
        url: endpoint,
        failOnStatusCode: false
      }).then((response) => {
        cy.log(`${endpoint}: ${response.status}`)
        
        // Log the response for debugging
        if (response.status >= 400) {
          cy.log(`Error at ${endpoint}:`, response.body)
        }
      })
    })
  })

  it('should test authentication endpoints', () => {
    // Test login endpoint
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: 'test@example.com',
        password: 'testpassword'
      },
      failOnStatusCode: false
    }).then((response) => {
      cy.log('Login test:', response.status)
      if (response.status >= 400) {
        cy.log('Login error:', response.body)
      }
    })
  })

  it('should check database connection', () => {
    cy.request({
      method: 'GET',
      url: '/api/health/db',
      failOnStatusCode: false
    }).then((response) => {
      cy.log('Database health:', response.status)
      if (response.status !== 200) {
        cy.log('Database connection issue:', response.body)
      }
    })
  })

  it('should verify file upload functionality', () => {
    cy.fixture('example.json', 'base64').then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent)
      const formData = new FormData()
      formData.append('file', blob, 'test-file.json')

      cy.request({
        method: 'POST',
        url: '/api/upload',
        body: formData,
        failOnStatusCode: false
      }).then((response) => {
        cy.log('File upload test:', response.status)
        if (response.status >= 400) {
          cy.log('Upload error:', response.body)
        }
      })
    })
  })
})
