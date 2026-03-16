function isTargetDomain(urlObj, decoratableDomains) {
  if (decoratableDomains === null) return true; // Decorate all domains if decoratableDomains is null
  if (Array.isArray(decoratableDomains) && decoratableDomains.length === 0) return false;
  return decoratableDomains.some(domain => {
    const target = domain.toLowerCase();
    const current = urlObj.hostname.toLowerCase();
    return current === target || current.endsWith('.' + target);
  });
}

export function decorator(url, decoratableDomains, trackingParam, trackingValue) {
  if (!url) return url; // Added check for empty/undefined URLs
  try {
    const urlObj = new URL(url, window.location.origin);

    // Check if the hostname of the URL matches any of the decoratable domains
    const isTarget = isTargetDomain(urlObj, decoratableDomains);

    if (isTarget) {
      urlObj.searchParams.set(trackingParam, trackingValue);
      return urlObj.href;
    }
  } catch (e) {
    return url;
  }
  return url;
}

export default function decorateLinks(trackingDomains, trackingParamName, trackingParamValue, recorder, env) {
  const myenv = env || window || self;

  // Link click handler - handles various click events
  const linkClickHandler = (e) => {
    const link = e.target.closest('a');
    if (link && link.href) {
      link.href = decorator(
        link.href,
        trackingDomains,
        trackingParamName,
        trackingParamValue
      );
    }
  };

  // Form submission handler
  const formSubmitHandler = (e) => {
    const form = e.target;
    try {
      const actionUrl = new URL(form.action, myenv.location.origin);
      const isTarget = isTargetDomain(actionUrl, trackingDomains);

      if (isTarget) {
        // Avoid duplicates
        let trackingInput = form.querySelector(`input[name="${trackingParamName}"]`);

        if (!trackingInput) {
          trackingInput = myenv.document.createElement('input');
          trackingInput.type = 'hidden';
          trackingInput.name = trackingParamName;
          form.appendChild(trackingInput);
        }

        trackingInput.value = trackingParamValue;
      }
    } catch (err) {
      // skip decoration
    }
  };

  // Add event listeners for various interaction types
  // regular clicks
  myenv.addEventListener('mousedown', linkClickHandler, true);
  // keyboard navigation (Tab + Enter)
  myenv.addEventListener('click', linkClickHandler, true);
  // middle-click and other auxiliary button clicks
  myenv.addEventListener('auxclick', linkClickHandler, true);
  // right-click (for copy link address)
  myenv.addEventListener('contextmenu', linkClickHandler, true);

  // Form submissions
  myenv.addEventListener('submit', formSubmitHandler, true);

  // Return cleanup function to remove event listeners
  return function cleanup() {
    myenv.removeEventListener('mousedown', linkClickHandler, true);
    myenv.removeEventListener('click', linkClickHandler, true);
    myenv.removeEventListener('auxclick', linkClickHandler, true);
    myenv.removeEventListener('contextmenu', linkClickHandler, true);
    myenv.removeEventListener('submit', formSubmitHandler, true);
  };
}

export function getCrossDomainTrackingParamValue(paramName) {
  try {
    if (!window || !window.location || !window.location.search) {
      return null;
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
  } catch (err) {
    // URLSearchParams might not be available in older browsers
    // or window.location might not be accessible
    return null;
  }
}
