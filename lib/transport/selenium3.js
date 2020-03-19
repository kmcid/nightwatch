const Errors = require('./jsonwire/errors.js');
const WebdriverErrors = require('./webdriver/errors.js');
const Selenium2 = require('./selenium2.js');
const WebdriverProtocol = require('./webdriver.js');
const MethodMappings = require('./selenium3/actions.js');

class SeleniumProtocol extends Selenium2 {
  get MethodMappings() {
    return MethodMappings;
  }

  ////////////////////////////////////////////////////////////////////
  // Elements related
  ////////////////////////////////////////////////////////////////////
  getElementId(resultValue) {
    if (resultValue[WebdriverProtocol.WEB_ELEMENT_ID] !== undefined) {
      return resultValue[WebdriverProtocol.WEB_ELEMENT_ID];
    }

    return resultValue.ELEMENT;
  }

  runProtocolAction(requestOptions) {
    let request = this.createHttpRequest(requestOptions);

    return this.sendProtocolAction(request, function(resolve, reject) {
      request.on('success', (result, response) => {
        if (!result) result = { status: -1 }
        if (result.status === undefined) result.status = 0
        if (result.status && result.status !== Errors.StatusCode.SUCCESS) {
          result = this.handleProtocolError(result, response);

          return reject(result);
        }

        resolve(result);
      });

      request.on('error', (result, response, screenshotContent) => {
        let errorResult = this.handleProtocolError(result, response, screenshotContent);

        if (this.shouldRegisterError(errorResult)) {
          reject(errorResult);
        } else {
          resolve(errorResult);
        }

      });
    });
  }

  handleProtocolError(result, response, screenshotContent) {
    let errorMessage = response && response.statusCode === 404 ? 'Unknown command' : 'An unknown error has occurred.';

    if (screenshotContent) {
      this.reporter && this.reporter.saveErrorScreenshot(result, screenshotContent);
    }

    if (result.value && result.value.message) {
      errorMessage = result.value.message;
    } else if (result && result.state && WebdriverErrors.Response[result.state]) {
      errorMessage = WebdriverErrors.Response[result.state].message;
    } else if (response.status && response.statusMessage) {
      errorMessage += ` ${response.status} ${response.statusMessage}`;
    }

    return {
      status: -1,
      state: result.state || '',
      value : result && result.value || null,
      errorStatus: result && result.status || '',
      error : errorMessage,
      httpStatusCode: response.statusCode
    };
  }
}

module.exports = SeleniumProtocol;
