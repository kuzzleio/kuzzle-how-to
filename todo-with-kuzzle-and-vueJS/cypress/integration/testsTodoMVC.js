/* eslint-disable */

describe('Tests on todoMVC step 1', () => {
  before(() => {
    cy.clearLocalStorage();
    cy.initKuzzle();
    cy.visit('http://localhost:8080/');
  })

  beforeEach(() => {
    cy.clearList('todolists', 'FirstList');
    cy.setUp();
  })

  it('Create a task', () => {
    cy.get('#Add')
      .contains('New todo')
      .parent()
      .children()
      .first()
      .next()
      .type('test task')
      .should('have.value', 'test task');
    cy.contains('ADD').click();
    cy.get('#task').contains('test task');
  })

  it('Update a task', () => {
    cy.createMultipleTasks('todolists', 'FirstList', false, ['test task']);
    cy.setUp();

    cy.contains('test task')
      .parent()
      .children()
      .first()
      .click();
    cy.checkTaskComplete('test task', /true/);
  })

  it('Delete a task', () => {
    cy.createMultipleTasks('todolists', 'FirstList', false, ['test task']);
    cy.setUp();

    cy.get('#task')
      .contains('Clear')
      .parent()
      .click();
    cy.get('#task').should('not.exist');
  })

  it('Update multiple tasks', () => {
    cy.createMultipleTasks('todolists', 'FirstList', false, [
      'Task for test n1',
      'Task for test n2',
      'Task for test n3',
      'Task for test n4'
    ]);
    cy.setUp();

    cy.get('#Menucollection')
      .contains('Complete All')
      .parent()
      .first()
      .click();
    cy.checkTaskComplete('Task for test n1', /true/);
    cy.checkTaskComplete('Task for test n2', /true/);
    cy.checkTaskComplete('Task for test n3', /true/);
    cy.checkTaskComplete('Task for test n4', /true/);

    cy.get('#Menucollection')
      .contains('Complete All')
      .parent()
      .first()
      .click();
    cy.checkTaskComplete('Task for test n1', /false/);
    cy.checkTaskComplete('Task for test n2', /false/);
    cy.checkTaskComplete('Task for test n3', /false/);
    cy.checkTaskComplete('Task for test n4', /false/);
  })

  it('Delete multiple tasks', () => {
    cy.createMultipleTasks('todolists', 'FirstList', true, [
      'Task for test n1',
      'Task for test n2',
      'Task for test n3',
      'Task for test n4'
    ]);
    cy.setUp();

    cy.get('#Menucollection')
      .contains('Clear Completed')
      .click();
    cy.contains('#task').should('not.exist');
  })

  it('Change view', () => {
    cy.createMultipleTasks('todolists', 'FirstList', false, [
      'Task for test n1'
    ]);
    cy.createMultipleTasks('todolists', 'FirstList', true, [
      'Task for test n2'
    ]);
    cy.setUp();

    cy.contains('Task for test n1').should('be.visible');
    cy.contains('Task for test n2').should('be.visible');

    cy.get('#Menucollection')
      .contains('See Active')
      .click();
    cy.get('#Menucollection')
      .contains('See Complete')
      .click();

    cy.get('Task for test n1').should('not.be.visible');
    cy.get('Task for test n2').should('not.be.visible');

    cy.get('#Menucollection')
      .contains('See Active')
      .click();
    cy.get('#Menucollection')
      .contains('See Complete')
      .click();

    cy.contains('Task for test n1').should('be.visible');
    cy.contains('Task for test n2').should('be.visible');
  })

  it('Create a list', () => {
    cy.setUp();
    cy.get('#ManageList')
      .contains('New List')
      .click();
    cy.contains('New list name.')
      .next()
      .type('SecondList');
    cy.contains('Creating new List')
      .parent()
      .contains('Create')
      .click();
    cy.contains('SecondList');
  })

  it('Change list', () => {
    cy.createMultipleTasks('todolists', 'FirstList', false, [
      'Task for test of change list'
    ]);
    cy.createCollection('todolists', 'SecondList');
    cy.setUp();

    cy.contains('Task for test of change list');
    cy.contains('arrow_drop_down').click();
    cy.contains('SecondList').click();
    cy.contains('Task for test of change list').should('not.exist');
  })

  it('Enable toasts', () => {
    cy.contains('ADD').click();
    cy.contains('ERROR');
  })

  it('Disable toasts', () => {
    cy.setUp();

    cy.contains('menu').click();
    cy.contains('Toasts:').click();
    cy.get('#NavMobile')
      .contains('Welcome !')
      .click();

    cy.contains('ADD').click();
    cy.contains('ERROR').should('not.exist');
  })
})
