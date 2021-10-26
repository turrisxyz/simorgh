import path from 'path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ChunkExtractor } from '@loadable/server';
import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';
import createCache from '@emotion/cache';
import { Helmet } from 'react-helmet';
import { minify } from 'html-minifier';

import {
  AMP_SCRIPT,
  AMP_NO_SCRIPT,
  AMP_JS,
  AMP_CONSENT_JS,
  AMP_ANALYTICS_JS,
  AMP_GEO_JS,
} from './ampAssets';
import { ServerApp } from '#app/containers/App';
import getAssetOrigins from '../utilities/getAssetOrigins';
import serialiseForScript from '#lib/utilities/serialiseForScript';
import encodeChunkFilename from '../utilities/encodeChunkUri';

const extractChunk = chunk => {
  const hasUrl = Boolean(chunk && chunk.url);

  return {
    crossOrigin: 'anonymous',
    defer: true,
    ...(hasUrl && {
      src: encodeChunkFilename(chunk),
    }),
  };
};

const renderDocument = async ({
  bbcOrigin,
  data,
  isAmp,
  routes,
  service,
  url,
}) => {
  const cache = createCache({ key: 'bbc' });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache);
  const statsFile = path.resolve(
    `${__dirname}/public/loadable-stats-${process.env.SIMORGH_APP_ENV}.json`,
  );
  const extractor = new ChunkExtractor({
    statsFile,
  });

  const context = {};

  if (context.url) {
    /**
     * React Router automatically adds an url property with the
     * redirected url to the context object when a Redirect component
     * is used - https://alligator.io/react/react-router-ssr/
     */
    // I'M SUSPICIOUS THAT THIS CODE WILL NEVER BE EXECUTED
    return { redirectUrl: context.url, html: null };
  }

  const jsx = extractor.collectChunks(
    <CacheProvider value={cache}>
      <ServerApp
        location={url}
        routes={routes}
        data={data}
        bbcOrigin={bbcOrigin}
        context={context}
        service={service}
        isAmp={isAmp}
      />
    </CacheProvider>,
  );

  const html = renderToString(jsx);
  const chunks = extractCriticalToChunks(html);
  const styles = constructStyleTagsFromChunks(chunks);
  const modernScripts = extractor.getScriptTags(extractChunk);
  const helmet = Helmet.renderStatic();
  const assetOrigins = getAssetOrigins(service);
  const resourceHints = assetOrigins
    .map(
      origin =>
        `<link rel="preconnect" href="${origin}" crossOrigin="anonymous" />` +
        `<link rel="dns-prefetch" href="${origin}" />`,
    )
    .join('');
  const noJsClass = !isAmp ? 'class="no-js"' : ''; // The JS to remove the no-js class will not run on AMP, therefore only add it to canonical
  const htmlAttributes = helmet.htmlAttributes.toString();
  const meta = helmet.meta.toString();
  const title = helmet.title.toString();
  const helmetLinkTags = helmet.link.toString();
  const headScript = helmet.script.toString();
  const serialisedData = serialiseForScript(data);
  const scriptsAllowed = !isAmp;
  const ampAssets = `
    <style amp-boilerplate="">${AMP_SCRIPT}</style>
    <noscript>
      <style amp-boilerplate="">${AMP_NO_SCRIPT}</style>
    </noscript>
    ${AMP_JS}
    ${AMP_GEO_JS}
    ${AMP_CONSENT_JS}
    ${AMP_ANALYTICS_JS}
  `;
  const scripts = `
    <script>window.SIMORGH_DATA=${serialisedData}</script>
    <!--[if !IE]><!-->
    ${modernScripts}
    <!--<![endif]-->
    <script>document.documentElement.classList.remove("no-js");</script>
  `;
  // In order to block relevant components rendering until we have AMP GeoIP information, we need to add
  // this class to the body of the document: https://amp.dev/documentation/components/amp-geo/#render-blocking
  const ampGeoPendingAttrs = isAmp ? 'class="amp-geo-pending"' : '';

  const doc = `
  <!doctype html>
    <html lang="en-GB" ${noJsClass} ${htmlAttributes}>
    <head>
      ${meta}
      <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      ${resourceHints}
      ${title}
      ${styles}
      ${helmetLinkTags}
      ${headScript}
      ${isAmp ? ampAssets : ''}
    </head>
    <body ${ampGeoPendingAttrs}>
      <div id="root">${html}</div>
      ${scriptsAllowed ? scripts : ''}
    </body>
  </html>
  `;

  return {
    html: minify(doc, {
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true,
      removeAttributeQuotes: true,
      minifyCSS: true,
      minifyJS: true,
      removeTagWhitespace: true,
    }),
    redirectUrl: null,
  };
};

export default renderDocument;
