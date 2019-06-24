// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
/* eslint-disable */

Cypress.Commands.add('initKuzzle', () => {
  cy.request('GET', 'http://localhost:7512/todolists/_exists')
  .then(response => {
      cy.log(`Request : index exist  status : ${response.status}`);
      if (response.body.result === 'true') {
        cy.request('DELETE', 'http://localhost:7512/todolists')
        .then(result => {
          cy.log(`Request : index delete  status : ${result.status}`);
        });
      }
    }
  );
});

Cypress.Commands.add('setUp', () => {
  cy.reload();
  cy.wait(500);
  cy.contains('arrow_drop_down')
  .click();
  cy.contains('FirstList')
  .click();
});

Cypress.Commands.add('createMultipleTasks', (index, collection, complete, tasks) => {
    const documents = [];
    tasks.forEach(element => {
      documents.push({
        body: {
          task: element,
          complete: complete
        }
      });
    });
    cy.request('POST', `http://localhost:7512/${index}/${collection}/_mCreate`, {documents: documents})
    .then(response => {
      cy.log(`Request : document mcreate  status : ${response.status}`);
    })
});

Cypress.Commands.add('clearList', (index, collection) => {
  const ids = [];
  cy.request('POST', `http://localhost:7512/${index}/${collection}/_search`)
  .then(response => {
    cy.log(`Request : document search  status : ${response.status}`);
    response.body.result.hits.forEach(element => {
      ids.push(element._id);
    });
  });
  cy.request('DELETE', `http://localhost:7512/${index}/${collection}/_mDelete`, { ids: ids })
  .then(response => {
    cy.log(`Request : document mdelete  status : ${response.status}`);
  });
});

Cypress.Commands.add('checkTaskComplete', (task, regexp) => {
  cy.contains(task)
    .parent()
    .children()
    .first()
    .children()
    .should('have.attr', 'aria-checked')
    .and('match', regexp);
});

Cypress.Commands.add('createCollection', (index, collection) => {
  cy.request('PUT', `http://localhost:7512/${index}/${collection}`, {
    properties: {
      complete: { type: 'boolean' },
      task: { type: 'text' }
    }
  }).then(response => {
    cy.log(`Request : collection create  status : ${response.status}`);
  });
});
