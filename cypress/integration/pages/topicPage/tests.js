import envConfig from '../../../support/config/envs';

export default ({ service, pageType }) => {
  describe(`Tests for ${service} ${pageType}`, () => {
    let topicId;
    let firstItemHeadline;
    beforeEach(() => {
      const currentpath = Cypress.env('currentPath');
      cy.log(currentpath);

      [topicId] = currentpath.split('topics/').pop().split('?');

      cy.log(`topic id${topicId}`);
    });

    it('should render a H1, which contains/displays topic title', () => {
      const currentpath = Cypress.env('currentPath');
      cy.log(currentpath);

      cy.request(`${envConfig.bffUrl}?id=${topicId}&service=${service}`).then(
        ({ body }) => {
          cy.log(body);

          cy.get('h1').should('contain', body.data.title);
        },
      );
    });
    it('should render the correct number of items', () => {
      cy.request(
        `https://web-cdn.api.bbci.co.uk/fd/simorgh-bff?id=${topicId}&service=${service}`,
      ).then(({ body }) => {
        cy.log(body);
        // Gets expected number of articles in the topic on this page
        const numberOfItems = body.data.summaries.length;
        cy.log(numberOfItems);
        // Checks number of items on page
        cy.get('[data-testid="topic-promos"]')
          .children()
          .its('length')
          .should('eq', numberOfItems);
      });
    });
    it('should show pagination if there is more than one page', () => {
      cy.request(
        `https://web-cdn.api.bbci.co.uk/fd/simorgh-bff?id=${topicId}&service=${service}`,
      ).then(({ body }) => {
        // Gets number of pages
        const { pageCount } = body.data;
        cy.log(`pagecount is ${pageCount}`);
        // Checks pagination only is on page if there is more than one page
        if (pageCount > 1) {
          cy.get('[data-testid="topic-pagination"]').should('exist');
        } else {
          cy.get('[data-testid="topic-pagination"]').should('not.exist');
        }
      });
    });
    it('should have the correct max pagination number', () => {
      cy.request(
        `https://web-cdn.api.bbci.co.uk/fd/simorgh-bff?id=${topicId}&service=${service}`,
      ).then(({ body }) => {
        // Gets number of pages
        const { pageCount } = body.data;
        // Gets last pagination element and checks the number is the length of pageCount
        if (pageCount > 1) {
          cy.log(`pagecount is ${pageCount}`);
          cy.get('[data-testid="topic-pagination"] li')
            .last()
            .should('have.text', pageCount);
        } else {
          cy.log('No pagination - only 1 page of items');
        }
      });
    });
    it('First item has correct headline', () => {
      cy.request(
        `https://web-cdn.api.bbci.co.uk/fd/simorgh-bff?id=${topicId}&service=${service}`,
      ).then(({ body }) => {
        // Gets the headline from 'title' of first item
        firstItemHeadline = body.data.summaries[0].title;
        cy.log(firstItemHeadline);
        // Goes down into the first item's h2 text and compares to title
        cy.get('[data-testid="topic-promos"]')
          .children()
          .first()
          .within(() => {
            cy.get('h2').should('have.text', firstItemHeadline);
          });
      });
    });
    it('Clicking the first item should navigate to the correct page (goes to live article)', () => {
      // Goes down into the first item's href
      cy.get('[data-testid="topic-promos"]')
        .children()
        .first()
        .within(() => {
          cy.get('a')
            .should('have.attr', 'href')
            .then($href => {
              cy.log($href);
              // Clicks the first item, then checks the page navigates to has the expected url
              cy.get('a').click();
              cy.url()
                .should('eq', $href)
                .then(url => {
                  // Check the page navigated to has the short headline that was on the topic item
                  cy.request(`${url}.json`).then(({ body }) => {
                    const { shortHeadline } = body.promo.headlines;
                    expect(shortHeadline).to.equal(firstItemHeadline);
                  });
                });
            });
        });
    });
  });
};
