# Consent Management

The Moesif Browser SDK supports consent management, allowing you to delay data transmission to Moesif until user consent is granted. This is useful for GDPR, CCPA, and other privacy regulations.

## Features

- **Opt-in consent**: Data collection happens immediately, but transmission is delayed until consent is granted
- **Request queuing**: All events, actions, and user/company updates are queued when consent is pending
- **Automatic flushing**: Once consent is granted, all queued requests are sent to Moesif
- **Dynamic consent control**: Grant or revoke consent at any time during the session

## Configuration

### Basic Setup

To enable consent management, set `requireConsent: true` when initializing the SDK:

```javascript
var moesif = moesif.init({
  applicationId: 'YOUR_APPLICATION_ID',
  requireConsent: true  // Enable consent management
});

moesif.start();
```

When `requireConsent` is enabled, the SDK will:
1. Continue capturing events and tracking user actions
2. Queue all data instead of sending it to Moesif
3. Wait for explicit consent before transmitting any data

## API Methods

### `grantConsent()`

Call this method when the user accepts your privacy policy or cookie consent:

```javascript
// User clicked "Accept" on cookie banner
moesif.grantConsent();
```

This will:
- Mark consent as granted
- Immediately send all queued events, actions, and updates to Moesif
- Send all future data immediately (no more queuing)

### `revokeConsent()`

Call this method if the user withdraws consent:

```javascript
// User clicked "Revoke" in privacy settings
moesif.revokeConsent();
```

This will:
- Mark consent as revoked
- Clear any pending queued requests
- Queue all future requests until consent is granted again

### `isConsentGranted()`

Check the current consent status:

```javascript
if (moesif.isConsentGranted()) {
  console.log('User has granted consent');
} else {
  console.log('Consent is pending');
}
```

## Complete Example

### Integration with Cookie Consent Banner

```html
<!DOCTYPE html>
<html>
<head>
  <title>Moesif with Consent Management</title>
</head>
<body>
  <!-- Cookie Consent Banner -->
  <div id="cookie-banner" style="display: none;">
    <p>We use cookies to analyze traffic. Do you accept?</p>
    <button onclick="acceptConsent()">Accept</button>
    <button onclick="rejectConsent()">Reject</button>
  </div>

  <script src="moesif.min.js"></script>
  <script>
    // Initialize Moesif with consent requirement
    var moesif = moesif.init({
      applicationId: 'YOUR_APPLICATION_ID',
      requireConsent: true
    });

    moesif.start();

    // Show banner if consent not previously given
    if (!localStorage.getItem('consent-granted')) {
      document.getElementById('cookie-banner').style.display = 'block';
    } else {
      // Consent was previously granted, grant it immediately
      moesif.grantConsent();
    }

    function acceptConsent() {
      // Grant consent in Moesif
      moesif.grantConsent();
      
      // Remember the choice
      localStorage.setItem('consent-granted', 'true');
      
      // Hide banner
      document.getElementById('cookie-banner').style.display = 'none';
    }

    function rejectConsent() {
      // Revoke consent (clears queue)
      moesif.revokeConsent();
      
      // Hide banner
      document.getElementById('cookie-banner').style.display = 'none';
    }

    // Now you can track events - they'll be queued until consent
    moesif.identifyUser('user123', { email: 'user@example.com' });
    moesif.track('page_view', { page: 'home' });
    
    // These will be sent immediately after user clicks "Accept"
  </script>
</body>
</html>
```

### Integration with Popular Consent Managers

#### OneTrust

```javascript
var moesif = moesif.init({
  applicationId: 'YOUR_APPLICATION_ID',
  requireConsent: true
});

moesif.start();

// OneTrust consent callback
function OptanonWrapper() {
  // Check if analytics category is consented
  if (window.OnetrustActiveGroups.includes('C0002')) {
    moesif.grantConsent();
  } else {
    moesif.revokeConsent();
  }
}
```

#### Cookiebot

```javascript
var moesif = moesif.init({
  applicationId: 'YOUR_APPLICATION_ID',
  requireConsent: true
});

moesif.start();

// Cookiebot consent callback
window.addEventListener('CookiebotOnAccept', function() {
  if (Cookiebot.consent.statistics) {
    moesif.grantConsent();
  }
});

window.addEventListener('CookiebotOnDecline', function() {
  moesif.revokeConsent();
});
```

## Behavior Details

### What gets queued?

When consent is not granted, the following are queued:
- **Events**: HTTP/HTTPS requests captured by the SDK
- **Actions**: Custom events tracked with `track()`
- **User updates**: Calls to `identifyUser()`
- **Company updates**: Calls to `identifyCompany()`
- **Session tracking**: Calls to `identifySession()`

### What doesn't get queued?

The SDK still performs these operations without consent:
- Reading URL parameters (UTM, campaign tracking)
- Generating anonymous IDs
- Storing data in localStorage/cookies (based on persistence settings)
- Cross-domain tracking parameter decoration

### Queue Management

- The queue is stored in memory only (not persisted)
- Queued requests are sent in FIFO order when consent is granted
- If consent is revoked, the queue is cleared (data is discarded)
- If the page is refreshed before consent is granted, queued data is lost

### Best Practices

1. **Initialize early**: Call `init()` and `start()` as early as possible to capture all user activity
2. **Persist consent choice**: Use localStorage or cookies to remember the user's consent decision across sessions
3. **Auto-grant on return**: If consent was previously granted, call `grantConsent()` immediately on page load
4. **Inform users**: Make it clear what data will be sent once they grant consent
5. **Handle revocation**: Provide UI for users to revoke consent in your privacy settings

## Default Behavior (No Consent Required)

If you don't set `requireConsent: true`, the SDK works as before:
- Data is sent immediately when captured
- No consent checks are performed
- `grantConsent()` and `revokeConsent()` have no effect

```javascript
// Traditional behavior - no consent management
var moesif = moesif.init({
  applicationId: 'YOUR_APPLICATION_ID'
  // requireConsent defaults to false
});

moesif.start();
// Data is sent immediately
```

## FAQ

**Q: Can I change consent settings after initialization?**  
A: Yes, you can call `grantConsent()` and `revokeConsent()` at any time.

**Q: What happens to data collected before consent?**  
A: It's queued in memory and sent as soon as `grantConsent()` is called.

**Q: Is queued data persisted across page refreshes?**  
A: No, the queue is memory-only. If the page refreshes before consent is granted, queued data is lost.

**Q: Can I see how many requests are queued?**  
A: Currently no, but you can check `isConsentGranted()` to see if queuing is active.

**Q: Does this affect batching?**  
A: No, consent checks happen before batching. Once consent is granted, batching works normally.

**Q: What about cookie consent specifically?**  
A: Moesif's consent management is broader than just cookies. It controls all data transmission. However, the SDK may still use localStorage/cookies for anonymous ID and user identification based on your persistence settings.
