This directory contains the configuration files linked to each deployment. They expect the following grammar:

```js
{
  /**
   * Vuetify (light) theme colors to override default Vuetify options
   * @type Object
   */
  "theme": {
    "primary": "#0C2D48",
    "secondary": "#2E8BC0"
  },
  /**
   * URL to fetch 3rd party translations
   * @type String
   */
  "i18nUrl": "https://example.com/translations.json",
  /**
   * Set the locale
   * Only use this if you have your own locale switching mechanism.
   * If omitted, the default language switcher is enabled.
   * @type String
   */
  "i18nLocale": "en",
  /**
   * Override list of available locales in the language switcher.
   * The first locale in this array will be set as the default locale.
   * @type Array
   */
  "i18nLocales": ["fr"],
  /**
   * i18n messages
   * @type Object
   */
  "messages": {
    "fr": {},
    "en": {}
  },
  /**
   * A link to a filedrop service. In case the size limit is exceeded,
   * the user is invited to download the ZIP and use this link.
   * @type String
   */
  "filedrop": "https://example.com/filedrop",
  /**
   * Mapbox Token
   * @type String
   */
  "mapboxToken": "string",
  /**
   * Hashtags to add to content or a URL shared with the Share button.
   * @type Array
   */
  "hashtags": ["dataprivacy", "hestialabs"],
  /**
   * DISCLAIMER: THIS OPTION IS ONLY FOR THE NUXT APP
   * Override link to home page (absolute path to an external home page)
   * @type String
   */
  "homePath": "/index.html"
  /**
   * DISCLAIMER: THIS OPTION IS ONLY FOR THE NUXT APP
   * Name followed by the version tag of each experience to include.
   * Format: <name>@<tag>
   * If the <tag> is omitted, "latest" will be used.
   * @type Array
   */
  "experiences": ["facebook", "google", "twitter@1.0.0"],
  
  /**
   * DISCLAIMER: THIS OPTION IS ONLY FOR THE NUXT APP
   * Url prefix for experience viewer options,
   * or a map of experience name to viewer options as json,
   * or a map of experience name to url prefix
   * @type String | Object
   */
   "experienceViewerOptions": "https://raw.githubusercontent.com/some-path/",
   
  /**
   * DISCLAIMER: THIS OPTION IS ONLY FOR THE NUXT APP
   * Display the logos of experience collaborators (such as eyeballs, dating privacy)
   * @type Boolean
   */
  "displayCollaborators": true,
  /**
   * DISCLAIMER: THIS OPTION IS ONLY FOR THE NUXT APP
   * Links to existing pages to display in the app bar.
   * This are valid site wide and cannot be configured in bubbles.
   * @type Array
   */
  "appInfoLinks": [
    {
      "url": "https://hestia.ai/en/#contact",
      "name": "Contact us",
      "icon": "mdiMessageOutline",
      "external": true
    },
    {
      "url": "/about",
      "name": "About",
      "icon": "mdiHelp"
    }
  ],
  /**
   * DISCLAIMER: THIS OPTION IS ONLY FOR THE NUXT APP
   * The bubbles that are included in this website: a name on the site's default
   * bubble server (API_URL), or a URL for a bubble on another server,
   * https://<server>/bubbles/<name>. A bubble from another server is shown at
   * /space/<name>@<host>.
   * @type Array
   */
  "bubbles": [
    "workshop-x-participant",
    "workshop-x-aggregator",
    "https://bubbles.example.org/bubbles/study-participant"
  ],
  /**
   * DISCLAIMER: THIS OPTION IS ONLY FOR THE NUXT APP
   * Bubbles that are displayed on the home page.
   * Must be included in the "bubbles" above.
   * @type Array
   */
  "homePageBubbles": ["workshop-x-participant"],
  /**
   * DISCLAIMER: THIS OPTION IS ONLY FOR THE NUXT APP
   * Path or URL to override the default site logo
   * @type String
   */
  "logoImg": "/some-other-logo.png",
  /**
   * DISCLAIMER: THIS OPTION IS ONLY FOR THE NUXT APP
   * Path or URL to override the default site logo displayed in the side menu
   * @type String
   */
  "logoImgMenu": "/some-other-logo.png",
  /**
   * DISCLAIMER: THIS OPTION IS ONLY FOR THE NUXT APP
   * URL to visit when the logo is clicked
   * @type String
   */
  "logoLink": "https://digipower.academy",
}
```
