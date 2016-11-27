# exobot-plugin-calendar

Create and read events with Google Calendar.

## Usage

* `exobot schedule Raid Night every Friday at 9pm PST`
* `exobot events` or `exobot calendar list`

## Installation

* `npm install --save @exoplay/exobot/exobot-plugin-calendar`

## A Setup Example

```javascript
import Exobot from '@exoplay/exobot';
import Calendar from '@exoplay/exobot-plugin-calendar';

const Bot = new Exobot(BOT_NAME, {
  // ...
  plugins: [
    new Calendar(options);
  ],
});
```

## Options

Read up on how to set up calendar secrets and ids from
[Google documentation](https://developers.google.com/google-apps/calendar/auth).

* googleSecret or CALENDAR_GOOGLE_SECRET In environment; string required
* googleId or CALENDAR_GOOGLE_ID in environment; string required
* googleAccessToken or CALENDAR_GOOGLE_ACCESS_TOKEN in environment; string required
* googleTokenType or CALENDAR_GOOGLE_TOKEN_TYPE in environment; string required
* googleRefreshToken or CALENDAR_GOOGLE_REFRESH_TOKEN in environment; string required
* googleExpiryDate or CALENDAR_GOOGLE_EXPIRY_DATE in environment; string required

## License

LGPL licensed. Copyright 2016 Exoplay, LLC. See LICENSE file for more details.
