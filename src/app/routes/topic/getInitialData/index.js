import { BFF_FETCH_ERROR } from '#lib/logger.const';
import nodeLogger from '#lib/logger.node';
import pipe from 'ramda/src/pipe';
import Url from 'url-parse';
import { getUrlPath } from '#lib/utilities/urlParser';
import fetchPageData from '../../utils/fetchPageData';
import getErrorStatusCode from '../../utils/fetchPageData/utils/getErrorStatusCode';

const logger = nodeLogger(__filename);

const removeAmp = path => path.split('.')[0];
const popId = path => path.split('/').pop();

const getId = pipe(getUrlPath, removeAmp, popId);

export default async ({ getAgent, service, path: pathname, variant, page }) => {
  try {
    const env = pathname.includes('renderer_env=test') ? 'test' : 'live';
    const agent = await getAgent();
    const id = getId(pathname);
    const parsedBffUrl = Url(process.env.BFF_PATH).set('query', {
      id,
      service,
      ...(variant && {
        variant,
      }),
      ...(page && {
        page,
      }),
    });
    const optHeaders = { 'ctx-service-env': env };
    const { status, json } = await fetchPageData({
      path: parsedBffUrl.toString(),
      agent,
      optHeaders,
    });
    const { data } = json;

    return {
      status,
      pageData: {
        title: data.title,
        description: data.description || data.title,
        promos: data.summaries,
        activePage: data.activePage || 1,
        pageCount: data.pageCount,
        metadata: {
          type: 'Topic',
        },
      },
    };
  } catch ({ message, status = getErrorStatusCode() }) {
    logger.error(BFF_FETCH_ERROR, {
      service,
      status,
      pathname,
      message,
    });
    return { error: message, status };
  }
};
