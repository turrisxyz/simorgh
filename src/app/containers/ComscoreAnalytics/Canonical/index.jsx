/* eslint-disable jsx-a11y/alt-text */
import React, { useContext } from 'react';
import { Helmet } from 'react-helmet';
import { UserContext } from '#contexts/UserContext';

const CanonicalComscoreAnalytics = () => {
  const { personalisationEnabled } = useContext(UserContext);
  const staticAssetsPath = `${process.env.SIMORGH_PUBLIC_STATIC_ASSETS_ORIGIN}${process.env.SIMORGH_PUBLIC_STATIC_ASSETS_PATH}`;
  const csUcfr = personalisationEnabled ? '1' : '0';

  return (
    <Helmet>
      <script
        async
        type="text/javascript"
        src={`${staticAssetsPath}static/js/comscore.js`}
      />
      <noscript>
        {`<img src="https://sb.scorecardresearch.com/p?c1=2&c2=17986528&cs_ucfr=${csUcfr}&cv=2.0&cj=1" />`}
      </noscript>
    </Helmet>
  );
};

export default CanonicalComscoreAnalytics;
