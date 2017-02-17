import { Plugin, respond, help, permissionGroup, PropTypes as T, AdapterOperationTypes as AO } from '@exoplay/exobot';
import moment from 'moment';
import googleAPI from 'googleapis';
import GoogleAuth from 'google-auth-library';

moment.locale('en', {
  calendar: {
    sameElse: 'L LT',
  },
});

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export default class Calendar extends Plugin {
  static type = 'calendar';

  static propTypes = {
    googleSecret: T.string.isRequired,
    googleID: T.string.isRequired,
    googleAccessToken: T.string.isRequired,
    googleTokenType: T.string.isRequired,
    googleRefreshToken: T.string.isRequired,
    googleExpiryDate: T.string.isRequired,
    calendarId: T.string,
  };

  static defaultProps = {
    calendarId: 'primary',
  };

  constructor() {
    super(...arguments);
    const redirectUrl = 'urn:ietf:wg:oauth:2.0:oob';
    const oauth = new GoogleAuth();

    const oauth2Client = new oauth.OAuth2(
      this.options.googleID,
      this.options.googleSecret,
      redirectUrl,
    );

    oauth2Client.credentials.access_token = this.options.googleAccessToken;
    oauth2Client.credentials.token_type = this.options.googleTokenType;
    oauth2Client.credentials.refresh_token = this.options.googleRefreshToken;
    oauth2Client.credentials.expiry_date = this.options.googleExpiryDate;

    this.auth = oauth2Client;
  }

  @permissionGroup('setupPlugin');
  @help('/Calendar setup to get oAuth URL to allow exobot to see your calendar');
  @respond(/^Calendar setup/i);
  setupPlugin(match, message) {
    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    this.bot.emitter.emit(AO.PROMPT_USER, message.adapter, {
      type: 'calendarSetup',
      messageText: `Please visit this URL to authorize your API client to use your calendar ${authUrl}`,
      userId: message.user.id,
    }, this.saveToken);
  }

  saveToken = (data, message) => {
    if (data.type === 'calendarSetup') {
      this.bot.log.debug(message.text);
      this.auth.getToken(message.text, (err, token) => {
        if (err) {
          this.bot.log.error('Error while trying to retrieve access token', err);
          return;
        }
        this.auth.credentials = token;
        this.options.googleAccessToken = this.auth.credentials.access_token;
        this.options.googleTokenType = this.auth.credentials.token_type;
        this.options.googleRefreshToken = this.auth.credentials.refresh_token;
        this.options.googleExpiryDate = this.auth.credentials.expiry_date;
      });
      return true;
    }
    return false;
  }

  @permissionGroup('addEvents');
  @help('/Schedule event name on date at time');
  @respond(/^(?:schedule)\s*(.+)/i);
  async quickAddEvents(eventString) {
    const calendar = googleAPI.calendar('v3');

    const response = await new Promise((resolve, reject) => {
      calendar.events.quickAdd({
        auth: this.auth,
        calendarId: this.options.calendarId,
        text: eventString[1],
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    const eventStart = moment.parseZone(response.start.dateTime).calendar();
    return `${eventStart} - ${response.summary} created succesfully.`;
  }

  @permissionGroup('public');
  @help('/Events to list the next 5 events');
  @respond(/^(?:events|calendar list).*/i);
  async listEvents() {
    const calendar = googleAPI.calendar('v3');
    return new Promise((resolve, reject) => {
      calendar.events.list({
        auth: this.auth,
        calendarId: this.options.calendarId,
        timeMin: (new Date()).toISOString(),
        maxResults: 5,
        singleEvents: true,
        orderBy: 'startTime',
      }, (err, response) => {
        if (err) {
          reject(err);
        }

        const events = response.items;

        if (events.length === 0) {
          resolve('No upcoming events found.');
        } else {
          let eventlist = `${events.length} event${events.length === 1 ? '' : 's'} found\n`;
          events.forEach((event) => {
            const date = moment.parseZone(event.start.dateTime);
            const start = date.calendar() || event.start.date;
            const fromNow = date.fromNow();
            eventlist += `${start} - ${event.summary} (${fromNow})\n`;
          });
          resolve(eventlist);
        }
      });
    });
  }

 }
