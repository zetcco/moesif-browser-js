import { _, console } from './utils';
import { getFromPersistence, STORAGE_CONSTANTS } from './persistence';

// Validate anonymous ID format
// Should be hex characters separated by dashes, reasonable length
function isValidAnonymousId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  // Limit length to prevent abuse (max 200 chars)
  if (id.length > 200) {
    return false;
  }
  // Should contain only hex characters and dashes
  // Format is: hex-hex-hex-hex (from _.UUID())
  var validPattern = /^[a-f0-9-]+$/i;
  if (!validPattern.test(id)) {
    return false;
  }
  // Should have at least one dash (segments)
  if (id.indexOf('-') === -1) {
    return false;
  }
  return true;
}

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
    try {
      var anonIdFromCrossDomainTracking = _.crossDomainTrackingUtils.getCrossDomainTrackingParamValue(cdtParamName);
      if (anonIdFromCrossDomainTracking && isValidAnonymousId(anonIdFromCrossDomainTracking)) {
        persist(STORAGE_CONSTANTS.STORED_ANONYMOUS_ID, anonIdFromCrossDomainTracking);
        // Clean the URL parameter after persisting to prevent pollution
        _.crossDomainTrackingUtils.cleanUrlParameter(cdtParamName);
        return anonIdFromCrossDomainTracking;
      } else if (anonIdFromCrossDomainTracking) {
        // Invalid format detected
        console.log('Invalid anonymous ID format from URL parameter, ignoring');
        // Clean the invalid parameter from URL
        _.crossDomainTrackingUtils.cleanUrlParameter(cdtParamName);
      } else {
        // No parameter found, nothing to do
        console.log('No anonymous ID found in URL parameter for cross-domain tracking');
      }
    } catch (err) {
      console.log('Error reading cross-domain tracking parameter: ' + err.message);
    }
  }
  var storedAnonId = getFromPersistence(STORAGE_CONSTANTS.STORED_ANONYMOUS_ID, opt);
  if (storedAnonId) {
    return storedAnonId;
  }

  return regenerateAnonymousId(persist);
}

export { getAnonymousId, regenerateAnonymousId };
