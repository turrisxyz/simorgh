import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import WithTimeMachine from '#testHelpers/withTimeMachine';
import arabicData from '#data/arabic/frontpage';
import igboData from '#data/igbo/frontpage';
import newsData from '#data/news/frontpage';
import serbianCyrData from '#data/serbian/frontpage/cyr';
import serbianLatData from '#data/serbian/frontpage/lat';
import { service as arabicConfig } from '#lib/config/services/arabic';
import { service as igboConfig } from '#lib/config/services/igbo';
import { service as newsConfig } from '#lib/config/services/news';
import { service as serbianConfig } from '#lib/config/services/serbian';
import { getLocalMostReadEndpoint } from '#lib/utilities/getUrlHelpers/getMostReadUrls';
import { FRONT_PAGE } from '#app/routes/utils/pageTypes';
import FrontPage from '.';

const serviceDataSets = {
  arabic: { default: arabicData },
  igbo: { default: igboData },
  news: { default: newsData },
  serbian: {
    cyr: serbianCyrData,
    lat: serbianLatData,
  },
};

const serviceConfigs = {
  arabic: arabicConfig,
  igbo: igboConfig,
  news: newsConfig,
  serbian: serbianConfig,
};

// eslint-disable-next-line react/prop-types
const Component = ({ service, variant = 'default' } = {}) => (
  <BrowserRouter>
    <FrontPage
      isAmp={false}
      pageType={FRONT_PAGE}
      status={200}
      pathname={serviceConfigs[service][variant].navigation[0].url}
      service={service}
      variant={variant}
      pageData={serviceDataSets[service][variant]}
      mostReadEndpointOverride={getLocalMostReadEndpoint({
        service,
        variant,
      })}
    />
  </BrowserRouter>
);

export default {
  Component,
  title: 'Pages/Front Page',
  decorators: [story => <WithTimeMachine>{story()}</WithTimeMachine>],
};

export const Arabic = () => <Component service="arabic" />;
export const Igbo = () => <Component service="igbo" />;
export const News = () => <Component service="news" />;
export const SerbianCyrillic = () => (
  <Component service="serbian" variant="cyr" />
);
export const SerbianLatin = () => <Component service="serbian" variant="lat" />;
