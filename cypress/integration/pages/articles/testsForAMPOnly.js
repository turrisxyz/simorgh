import path from 'ramda/src/path';
import appConfig from '../../../../src/server/utilities/serviceConfigs';
import { getBlockData, getVideoEmbedUrl } from './helpers';
import config from '../../../support/config/services';
import { serviceNumerals } from '../../../../src/app/containers/MostRead/Canonical/Rank';

// TODO: Remove after https://github.com/bbc/simorgh/issues/2959
const serviceHasFigure = service =>
  ['arabic', 'news', 'pashto', 'persian', 'urdu'].includes(service);

// For testing important features that differ between services, e.g. Timestamps.
// We recommend using inline conditional logic to limit tests to services which differ.
export const testsThatAlwaysRunForAMPOnly = ({ service, pageType }) => {
  describe(`No testsToAlwaysRunForAMPOnly to run for ${service} ${pageType}`, () => {});
};

// For testing features that may differ across services but share a common logic e.g. translated strings.
export const testsThatFollowSmokeTestConfigForAMPOnly = ({
  service,
  pageType,
  variant,
}) =>
  describe(`Running testsForAMPOnly for ${service} ${pageType}`, () => {
    it('should contain an amp-img', () => {
      if (serviceHasFigure(service)) {
        cy.get('figure')
          .eq(0)
          .should('be.visible')
          .within(() => {
            cy.get('amp-img').should('be.visible');
          });
      }
    });

    describe('Media Player: AMP', () => {
      it('should render a placeholder image', () => {
        cy.request(`${Cypress.env('currentPath')}.json`).then(({ body }) => {
          const media = getBlockData('video', body);
          if (media && media.type === 'video') {
            cy.get('[data-e2e="media-player"]').within(() => {
              cy.get('div')
                .should('have.attr', 'data-e2e')
                .should('not.be.empty');
            });
          }
        });
      });

      it('should render an iframe with a valid URL', () => {
        cy.request(`${Cypress.env('currentPath')}.json`).then(({ body }) => {
          const media = getBlockData('video', body);
          if (media && media.type === 'video') {
            const { lang } = appConfig[service][variant];
            const embedUrl = getVideoEmbedUrl(body, lang, true);
            cy.get(`amp-iframe[src="${embedUrl}"]`).should('be.visible');
            cy.testResponseCodeAndTypeRetry({
              path: embedUrl,
              responseCode: 200,
              type: 'text/html',
              allowFallback: true,
            });
          }
        });
      });
    });

    describe('Most Read Container', () => {
      /* These cypress tests are needed as unit tests cannot be run on the jsdom.
       * web workers (which run on amp pages) do not run on the virtual dom.
       */
      before(() => {
        cy.getToggles(config[service].name);
      });

      const skipServices = ['scotland', 'sport', 'newsround'];

      const serviceVariant = variant === 'default' ? '' : `/${variant}`;

      const mostReadPath = `/${config[service].name}/mostread${serviceVariant}.json`;

      if (!skipServices.includes(service)) {
        it(`should show the correct number of items for ${service}\`s ${pageType}`, () => {
          cy.request(mostReadPath).then(({ body: mostReadJson }) => {
            const mostReadRecords = mostReadJson.totalRecords;
            cy.fixture(`toggles/${config[service].name}.json`).then(toggles => {
              const mostReadIsEnabled = path(['mostRead', 'enabled'], toggles);
              cy.log(
                `Most read container toggle enabled? ${mostReadIsEnabled}`,
              );
              if (
                Cypress.env('APP_ENV') !== 'live' &&
                mostReadIsEnabled &&
                mostReadRecords >= 5
              ) {
                const expectedMostReadItems =
                  appConfig[config[service].name][variant].mostRead
                    .numberOfItems;
                cy.get('[data-e2e="most-read"]').scrollIntoView();
                cy.get('[data-e2e="most-read"] > amp-list div')
                  .children('li')
                  .should('have.length', expectedMostReadItems);
              }
            });
          });
        });

        it(`should show numerals used for the corresponding ${service} service`, () => {
          cy.request(mostReadPath).then(({ body: mostReadJson }) => {
            const mostReadRecords = mostReadJson.totalRecords;
            cy.fixture(`toggles/${config[service].name}.json`).then(toggles => {
              const mostReadIsEnabled = path(['mostRead', 'enabled'], toggles);
              cy.log(
                `Most read container toggle enabled? ${mostReadIsEnabled}`,
              );
              if (
                Cypress.env('APP_ENV') !== 'live' &&
                mostReadIsEnabled &&
                mostReadRecords >= 5
              ) {
                const expectedMostReadRank = serviceNumerals(service);
                cy.get('[data-e2e="most-read"]').scrollIntoView();
                cy.get('[data-e2e="most-read"] > amp-list div')
                  .find('li span')
                  .each(($el, index) => {
                    expect($el.text()).equal(expectedMostReadRank[index + 1]);
                  });
              }
            });
          });
        });

        it('should not show most read list when data fetch fails', () => {
          cy.intercept(
            {
              method: 'GET',
              pathname: mostReadPath,
            },
            { status: '404' },
          );
          cy.reload();
          cy.request(mostReadPath).then(({ body: mostReadJson }) => {
            const mostReadRecords = mostReadJson.totalRecords;
            cy.fixture(`toggles/${config[service].name}.json`).then(toggles => {
              const mostReadIsEnabled = path(['mostRead', 'enabled'], toggles);
              cy.log(
                `Most read container toggle enabled? ${mostReadIsEnabled}`,
              );
              if (
                Cypress.env('APP_ENV') !== 'live' &&
                mostReadIsEnabled &&
                mostReadRecords >= 5
              ) {
                cy.get('amp-script > div amp-list').should('not.exist');
              }
            });
          });
        });
      }
    });
  });

// For testing low priority things e.g. cosmetic differences, and a safe place to put slow tests.
export const testsThatNeverRunDuringSmokeTestingForAMPOnly = ({
  service,
  pageType,
}) => {
  describe(`No testsToNeverSmokeTestForAMPOnly to run for ${service} ${pageType}`, () => {});
};
