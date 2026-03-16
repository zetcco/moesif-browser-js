import { _, console } from './utils';
import { getFromPersistence, STORAGE_CONSTANTS } from './persistence';
import { getCrossDomainTrackingParamValue } from './cross-domain-tracking';


function regenerateAnonymousId(persist) {
  var newId = _.UUID();
  if (persist) {
    persist(STORAGE_CONSTANTS.STORED_ANONYMOUS_ID, newId);
  }
  return newId;
}

function getAnonymousId(persist, opt, cdtParamName) {
  // If there is an anonymous id in the url param for cross domain tracking, use that and persist it.
  if (cdtParamName) { // if cross domain tracking is enabled
    var anonIdFromCrossDomainTracking = getCrossDomainTrackingParamValue(cdtParamName);
    if (anonIdFromCrossDomainTracking) {
      persist(STORAGE_CONSTANTS.STORED_ANONYMOUS_ID, anonIdFromCrossDomainTracking);
      return anonIdFromCrossDomainTracking;
    }
  }
  var storedAnonId = getFromPersistence(STORAGE_CONSTANTS.STORED_ANONYMOUS_ID, opt);
  if (storedAnonId) {
    return storedAnonId;
  }

  return regenerateAnonymousId(persist);
}

export { getAnonymousId, regenerateAnonymousId };
