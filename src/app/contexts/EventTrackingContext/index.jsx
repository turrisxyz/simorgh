import React, { createContext, useContext } from 'react';
import { node } from 'prop-types';

import { pageDataPropType } from '#models/propTypes/data';
import { ServiceContext } from '#contexts/ServiceContext';
import { RequestContext } from '#contexts/RequestContext';
import { buildATIClickParams } from '#containers/ATIAnalytics/params';

export const EventTrackingContext = createContext({});

export const EventTrackingContextProvider = ({ children, pageData }) => {
  let pageIdentifier;
  let platform;
  let statsDestination;

  const requestContext = useContext(RequestContext);
  const serviceContext = useContext(ServiceContext);

  try {
    ({ pageIdentifier, platform, statsDestination } = buildATIClickParams(
      pageData,
      requestContext,
      serviceContext,
    ));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `ATI Event Tracking Error: Could not parse tracking values from page data:\n${error.message}`,
    );
  }

  const trackingData = {
    pageIdentifier,
    platform,
    statsDestination,
  };

  return (
    <EventTrackingContext.Provider value={trackingData}>
      {children}
    </EventTrackingContext.Provider>
  );
};

EventTrackingContextProvider.propTypes = {
  children: node.isRequired,
  pageData: pageDataPropType.isRequired,
};
