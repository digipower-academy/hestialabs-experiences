/**
 * A bubble is referenced by name (on the default server) or by URL:
 * `https://<server>/bubbles/<name>`. Returns `{ apiUrl, name }`.
 */
export function resolveBubble(ref, defaultApiUrl) {
  const match = /^(https?:\/\/.+)\/bubbles\/([^/]+)\/?$/.exec(ref)
  if (match) {
    return { apiUrl: match[1], name: match[2] }
  }
  return { apiUrl: defaultApiUrl, name: ref }
}

/** The full URL of a bubble. */
export function bubbleUrl(apiUrl, name) {
  return `${apiUrl}/bubbles/${name}`
}

/**
 * Key for a bubble in a site's config: its name on the default server,
 * `<name>@<host>` elsewhere (usable in routes, e.g. /space/<key>).
 */
export function bubbleKey(ref, defaultApiUrl) {
  const { apiUrl, name } = resolveBubble(ref, defaultApiUrl)
  return apiUrl === defaultApiUrl ? name : `${name}@${new URL(apiUrl).host}`
}

export default class BubbleAPI {
  constructor(bubbleServerUrl) {
    this.apiUrl = bubbleServerUrl
  }

  async list() {
    const url = `${this.apiUrl}/bubbles/list`
    const options = { method: 'GET' }

    const res = await fetch(url, options)
    if (!res.ok) {
      throw new Error(
        `Unable to fetch bubble list from server: Error ${res.status}`
      )
    }
    return await res.json()
  }

  async getPlainConfig(bubbleRef) {
    const { apiUrl, name } = resolveBubble(bubbleRef, this.apiUrl)
    const url = `${bubbleUrl(apiUrl, name)}/config`
    const options = { method: 'GET' }

    const res = await fetch(url, options)
    if (!res.ok) {
      throw new Error(
        `Unable to fetch config from server: Error ${res.status}`
      )
    }
    const config = await res.json()
    return config
  }

  async getConfig(bubbleRef) {
    const { apiUrl, name } = resolveBubble(bubbleRef, this.apiUrl)
    const config = await this.getPlainConfig(bubbleRef)
    config.id = name
    config.apiUrl = apiUrl
    config.url = bubbleUrl(apiUrl, name)
    config.getConsentForm = function(experienceSlug) {
      if (this.consent) {
        const consentFormExperience = this.consent[experienceSlug]
        if (consentFormExperience === null) {
          // consent form disabled for this experience
          return null
        }
        // fall back to the default form is consentFormExperience is undefined
        const cForm = consentFormExperience || this.consent.default
        const consentForm = cForm && JSON.parse(JSON.stringify(cForm))
        return consentForm
      }
      return null
    }
    return config
  }

  getFilenames(bubbleName, callback) {
    const url = `${this.apiUrl}/bubbles/${bubbleName}/files`
    const options = { method: 'GET' }
    fetch(url, options)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Unable to fetch filenames from server: Error ${res.status}`
          )
        }
        return res.json()
      })
      .then(json => callback(null, json))
      .catch(error => callback(error))
  }

  async getFile(bubbleName, filename) {
    const url = `${this.apiUrl}/bubbles/${bubbleName}/file/${filename}`
    const options = { method: 'GET' }
    const res = await fetch(url, options)
    if (res.ok) {
      const blob = await res.blob()
      return blob
    } else {
      throw new Error(
              `Unable to fetch ${filename} from server: Error ${res.status}`
      )
    }
  }

  async login(id, codeword) {
    let errorMessage
    try {
      const resp = await fetch(
        `${this.apiUrl}/bubbles/login`,
        {
          method: 'POST',
          body: JSON.stringify({ id, codeword })
        }
      )
      if (resp.status === 403) {
        errorMessage =
            'You entered an incorrect codeword, please try again'
      } else if (!resp.ok) {
        console.error(resp)
        // use http status text in cas json() fails
        errorMessage = resp.statusText
        errorMessage = await resp.json()
      }
    } catch (error) {
      errorMessage = errorMessage || 'Error'
      console.error(error)
    }
    return errorMessage
  }

  async deleteFiles(bubble, codeword) {
    const formData = new FormData()
    formData.append('codeword', codeword)
    let errorMessage
    try {
      const resp = await fetch(
        `${this.apiUrl}/bubbles/${bubble}/delete-files`,
        {
          method: 'POST',
          body: formData
        }
      )
      if (!resp.ok) {
        console.error(resp)
        // use http status text in cas json() fails
        errorMessage = resp.statusText
        errorMessage = await resp.json()
      }
    } catch (error) {
      errorMessage = errorMessage || 'Error'
      console.error(error)
    }
    return errorMessage
  }

  /**
   * Upload to `destinationBubble` (a name on this API's server, or a URL)
   * from `sourceBubble` (a name on this API's server). A destination on
   * another server receives the source's full URL and checks the codeword
   * with this server.
   */
  async uploadFile(file, destinationBubble, sourceBubble, codeword) {
    const destination = resolveBubble(destinationBubble, this.apiUrl)
    const source =
      destination.apiUrl === this.apiUrl
        ? sourceBubble
        : bubbleUrl(this.apiUrl, sourceBubble)
    const formData = new FormData()
    formData.append('codeword', codeword)
    formData.append('source-bubble', source)
    formData.append('file', file, file.name)
    let errorMessage
    try {
      const resp = await fetch(
        `${bubbleUrl(destination.apiUrl, destination.name)}/files`,
        {
          method: 'POST',
          body: formData
        }
      )
      if (!resp.ok) {
        console.error(resp)
        // use http status text in case json() fails
        const message403 = 'You entered an incorrect codeword, please try again'
        errorMessage = resp.status === 403 ? message403 : resp.statusText
      }
    } catch (error) {
      errorMessage = errorMessage || 'Error'
      console.error(error)
    }
    return errorMessage
  }
}
