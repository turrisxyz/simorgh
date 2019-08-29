import envConfig from '../../support/config/envs';

const serviceIsGNL = service => service === 'japanese';
const serviceIsWS = service => service === 'persian';
const serviceIsPS = service => service === 'news';

// For testing important features that differ between services, e.g. Timestamps.
// We recommend using inline conditional logic to limit tests to services which differ.
export const testsThatAlwaysRunForAllCanonicalPages = ({
  service,
  pageType,
}) => {
  describe(`No testsToAlwaysRunForCanonicalPages to run for ${service} ${pageType}`, () => {});
};

// For testing feastures that may differ across services but share a common logic e.g. translated strings.
export const testsThatFollowSmokeTestConfigForAllCanonicalPages = ({
  service,
  pageType,
}) => {
  if (pageType !== 'errorPage404') {
    describe(`Running testsForAllCanonicalPages for ${service} ${pageType}`, () => {
      describe('ATI', () => {
        it('should have a noscript tag with an 1px image with the ati url', () => {
          if (serviceIsGNL(service)) {
            cy.hasNoscriptImgAtiUrl(
              envConfig.atiUrl,
              envConfig.atiAnalyticsGNLBucket,
            );
          } else if (serviceIsWS(service)) {
            cy.hasNoscriptImgAtiUrl(
              envConfig.atiUrl,
              envConfig.atiAnalyticsWSBucket,
            );
          } else if (serviceIsPS(service)) {
            cy.hasNoscriptImgAtiUrl(envConfig.atiUrl, '');
          }
        });
      });
      it('should only have expected bundle script tags', () => {
        cy.get('script[src]').each($p => {
          if ($p.attr('src').includes(envConfig.assetOrigin)) {
            return expect($p.attr('src')).to.match(
              new RegExp(
                `(\\/static\\/js\\/(main|vendor|${service})-\\w+\\.\\w+\\.js)`,
                'g',
              ),
            );
          }
          return null;
        });
      });

      it('should have 1 bundle for its service', () => {
        let matches = 0;

        cy.get('script[src]')
          .each($p => {
            const match = $p
              .attr('src')
              .match(
                new RegExp(
                  `(\\/static\\/js\\/${service}-\\w+\\.\\w+\\.js)`,
                  'g',
                ),
              );

            if (match) {
              matches += 1;
            }
          })
          .then(() => {
            expect(matches).to.equal(1);
          });
      });
    });
  }
  describe(`Canonical Tests`, () => {
    it('should not have an AMP attribute on the page', () => {
      cy.get('html').should('not.have.attr', 'amp');
    });
  });
};

// For testing low priority things e.g. cosmetic differences, and a safe place to put slow tests.
export const testsThatNeverRunDuringSmokeTestingForAllCanonicalPages = ({
  service,
  pageType,
}) => {
  describe(`No testsToNeverSmokeTestForCanonicalPages to run for ${service} ${pageType}`, () => {});
};
