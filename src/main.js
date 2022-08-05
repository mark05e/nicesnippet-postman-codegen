import { loadMockRequests } from './mockData';
import { hasData, doubleParse } from './utils';

var DEBUG_PRINT = false;
var version = '0.6.4';
var showSystemHeaders = false;

var prefix = 'REQUEST';

var pm_request;
var insidePostman = false;
var UnsupportedFeatureFoundflag = false;
var UnsupportedFeatureFoundLocation;
var sampleCode = '';
var finalProtocol, finalHost, finalPath, finalQuery, finalBody, finalHeader, finalAuth, finalMethod;

function insidePostmanCheck() {
    return typeof pm !== 'undefined';
}

let options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZoneName: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
};
var startTimeStamp = new Date().toLocaleString('en-US', options);

function main() {
    // Check if we are inside postman
    if (insidePostmanCheck()) {
        insidePostman = true;
        loadDataFromPostman();
    } else {
        console.clear(); // does not work inside postman
        pm_request = loadMockRequests();

        console.log('//////////////////// SAMPLE DATA ////////////////////');
        console.log(pm_request);
        console.log('//////////////////// SAMPLE DATA ////////////////////');
        loadDataFromSample(pm_request);
    }
    // Code Execution Workflow
    // displayDataFromMemory()
    buildHeader();
    if (checkRules()) {
        buildCode();
        buildFooter();
        printSampleCode();
    }
}

function loadDataFromSample(request) {
    DEBUG_PRINT && console.log('Running loadDataFromSample');
    // if (request.includes('\\')) {request.replaceAll('\\','\\\\\')}
    request = JSON.parse(request);
    DEBUG_PRINT && console.log({ request });

    // request.url
    // url.protocol - string
    // console.log(request.url.protocol)
    finalProtocol = request.url.protocol;

    // method - string
    finalMethod = request.method;

    // url.host (combine) - array -> string
    // console.log(request.url.host)
    finalHost = '';
    let host = request.url.host;
    host.forEach((h, i) => {
        if (i < host.length - 1) {
            finalHost += h.concat('.');
        } else {
            finalHost += h;
        }
    });
    // DEBUG_PRINT && { console.log({finalHost}) }

    // url.path (combine) - array -> string
    // console.log(request.url.path)
    finalPath = request.url.path;
    // let path = request.url.path
    // path.forEach((p,i) => {
    //     if(i < path.length - 1) { finalPath += p.concat("/") }
    //     else { finalPath += p }
    // });
    // DEBUG_PRINT && { console.log({finalPath})}

    // url.query (combine) - JsonObject -> string
    // console.log(request.url.query)
    if (request.url.query && request.url.query.length > 0) {
        finalQuery = '';
        let query = request.url.query;
        query.forEach((q, i) => {
            finalQuery += q.key;
            finalQuery += '=';
            finalQuery += q.value;
            if (i < query.length - 1) {
                finalQuery += '&';
            }
        });
        finalQuery = finalQuery.split('&');
        // console.log({finalQuery})
    }

    // request.header - array
    // console.log(request.header)
    finalHeader = request.header;
    // console.log({finalHeader})

    // request.auth - JsonObject
    // console.log(request.auth)
    finalAuth = request.auth;
    // console.log(finalAuth)

    // request.body - JsonObject
    // console.log(request.body)
    finalBody = request.body;
    // console.log({finalBody})
}

function loadDataFromPostman() {
    try {
        finalProtocol = pm.request.url.protocol.toString();
    } catch (e) {
        DEBUG_PRINT && console.log('FinalProtocol not found - ', e);
        finalProtocol = '';
    }
    finalHost = pm.request.url.host.join('.');
    finalPath = pm.request.url.path; // array
    finalQuery = pm.request.url.query.toString().split('&'); // array
    finalHeader = doubleParse(pm.request.headers); // object
    finalMethod = pm.request.method; // string
    try {
        finalAuth = pm.request.auth.toJSON(); // json
    } catch (e) {
        DEBUG_PRINT && console.log('FinalAuth not found - ', e);
        finalAuth = '';
    }
    finalBody = pm.request.body;
}

function displayDataFromMemory() {
    DEBUG_PRINT && console.log('//////////////////// displayDataFromMemory ////////////////////');
    DEBUG_PRINT && console.log({ insidePostman });
    DEBUG_PRINT && console.log({ finalProtocol }, typeof finalProtocol, '// string');
    DEBUG_PRINT && console.log({ finalMethod }, typeof finalMethod, '// string');
    DEBUG_PRINT && console.log({ finalHost }, typeof finalHost, '// string');
    DEBUG_PRINT && console.log({ finalPath }, typeof finalPath, '// array?');
    DEBUG_PRINT && console.log({ finalQuery }, typeof finalQuery, '// array?');
    DEBUG_PRINT && console.log({ finalHeader }, typeof finalHeader, '// object?');
    DEBUG_PRINT && console.log({ finalAuth }, typeof finalAuth, '// jsonObject?');
    DEBUG_PRINT && console.log({ finalBody }, typeof finalBody, '// object?');
    DEBUG_PRINT && console.log('//////////////////// displayDataFromMemory ////////////////////');
}

function checkRules() {
    let checkRulesMsg = '';
    let checkRulesStatus = true;
    if (finalMethod === 'GET' && hasData.body(finalBody)) {
        checkRulesMsg = 'Method and Body data combinations are incompatible in studio \n';
        checkRulesMsg += JSON.stringify({ finalMethod }) + '\n';
        checkRulesMsg += JSON.stringify({ finalBody });

        checkRulesStatus = false;
    }

    if (!checkRulesStatus) {
        let msg = '////////////////////////// RULES ERROR ///////////////////////////' + '\n';
        msg += checkRulesMsg + '\n';
        msg += '////////////////////////// RULES ERROR ///////////////////////////';
        console.error(msg);
        throw new Error('Rules Error - Check console for additional details');
    }
    return checkRulesStatus;
}

function buildCode() {
    // sampleCode = ''

    // start
    sampleCode += 'ASSIGN ' + prefix + ' = GetRestProxy()\n';

    // url
    sampleCode += '\n// SECTION: URL\n';
    // -- base
    let urlBase = prefix + '_URL_BASE';
    if (finalProtocol && finalHost) {
        sampleCode += 'ASSIGN ' + urlBase + '   = "' + finalProtocol + '://' + finalHost + '"\n';
    } else if (finalHost) {
        sampleCode += 'ASSIGN ' + urlBase + '   = "' + finalHost + '"\n';
    }
    // -- path
    let urlPath = prefix + '_URL_PATH';
    if (finalPath && finalPath.length > 0) {
        sampleCode += 'ASSIGN ' + urlPath + '   = "';
        finalPath.forEach((pathLine, i) => {
            if (i < finalPath.length - 1) {
                sampleCode += pathLine + '/';
            } else {
                sampleCode += pathLine;
            }
        });
        sampleCode += '"\n';
    }
    // -- method
    let urlMethod = prefix + '_URL_METHOD';
    if (finalProtocol) {
        sampleCode += 'ASSIGN ' + urlMethod + ' = "' + finalMethod + '"\n';
    }
    // -- query
    // TODO: Rewrite this to add appending multiple lines
    // console.log({finalQuery})
    let urlQuery = prefix + '_URL_QUERY';
    if (hasData.query(finalQuery)) {
        //xx
        sampleCode += 'ASSIGN ' + urlQuery + '  = $"';
        finalQuery.forEach((queryLine, i) => {
            if (i < finalQuery.length - 1) {
                // fix single quote
                if (queryLine.indexOf("'") >= 0) {
                    queryLine = queryLine.replaceAll("'", "\\'");
                }
                // TODO: Do I need to fix double quotes and others?
                sampleCode += queryLine + '&';
            } else {
                sampleCode += queryLine;
            }
        });
        sampleCode += '"\n';
    }

    // -- final url combine code
    sampleCode += 'ASSIGN ' + prefix + '_URL        = "{' + urlBase + '}/{' + urlPath + '}';
    if (hasData.query(finalQuery)) {
        sampleCode += '?{' + urlQuery + '}';
    }
    sampleCode += '"\n';

    // header
    // console.log({finalHeader})
    if (hasData.header(finalHeader, showSystemHeaders)) {
        sampleCode += '\n// SECTION: HEADER\n';

        finalHeader.forEach((headerLine, i) => {
            // if ()
            // console.log(h)
            if (headerLine.key.includes('Content-Type')) {
                sampleCode += prefix + '.ContentType = "' + headerLine.value + '"\n';
            } else if (headerLine.hasOwnProperty('system')) {
                if (showSystemHeaders) {
                    sampleCode += '// // Postman Hidden System Headers \n';
                    sampleCode +=
                        '//   ' +
                        prefix +
                        '.AddHeader("' +
                        headerLine.key +
                        '","' +
                        headerLine.value +
                        '")\n';
                }
                // else do not show anything
            } else {
                sampleCode +=
                    prefix + '.AddHeader("' + headerLine.key + '","' + headerLine.value + '")\n';
            }
        });
    }

    // auth
    // console.log({finalAuth})
    if (finalAuth) {
        sampleCode += '\n// SECTION: AUTH\n';

        let username, password;
        if (finalAuth.type === 'basic') {
            finalAuth.basic.forEach((b, i) => {
                if (b.key === 'password') {
                    password = b.value;
                }
                if (b.key === 'username') {
                    username = b.value;
                }
            });
            sampleCode += 'ASSIGN ' + prefix + '_USERNAME = "' + username + '"\n';
            sampleCode += 'ASSIGN ' + prefix + '_PASSWORD = "' + password + '"\n';
            // GetRESTProxy().EncodeBase64("{username}:{password}")
            sampleCode +=
                'ASSIGN ' +
                prefix +
                '_BASICAUTHCREDS = GetRESTProxy().EncodeBase64("{' +
                prefix +
                '_USERNAME' +
                '}';
            sampleCode += ':';
            sampleCode += '{' + prefix + '_PASSWORD' + '}';
            sampleCode += '")\n';
            sampleCode +=
                prefix +
                '.AddHeader("Authorization","Basic {' +
                prefix +
                '_BASICAUTHCREDS}")' +
                '\n';
        }
        if (finalAuth.type === 'bearer') {
            // console.log(finalAuth)
            // finalAuth.bearer
            sampleCode += 'ASSIGN ' + prefix + '_AUTHTOKEN = "' + finalAuth.bearer[0].value + '"\n';
            sampleCode +=
                prefix + '.AddHeader("Authorization","Bearer {' + prefix + '_AUTHTOKEN' + '}")\n';
        } else {
            UnsupportedFeatureFoundflag = true;
            UnsupportedFeatureFoundLocation = 'AUTH';
        }
    }

    // body
    if (hasData.body(finalBody)) {
        DEBUG_PRINT && console.log(finalBody);
        sampleCode += '\n// SECTION: BODY\n';
        if (finalBody.mode === 'raw') {
            let finalbodyraw = JSON.stringify(finalBody.raw);
            finalbodyraw = finalbodyraw.replaceAll('{', '\\{');
            // finalbodyraw = finalbodyraw.replaceAll('\,','\\,')
            sampleCode += 'ASSIGN ' + prefix + '_BODY = ""' + '\n';
            // sampleCode += finalbodyraw
            // remove first and last quote
            finalbodyraw = finalbodyraw.substring(1);
            finalbodyraw = finalbodyraw.substring(0, finalbodyraw.length - 1);
            // console.log({finalbodyraw})
            // console.log(finalbodyraw.split('\\r\\n').forEach((line)=>{console.log({line})}))
            finalbodyraw.split('\\r\\n').forEach((line) => {
                sampleCode += prefix + '_BODY.append($"' + line + '")\n';
            });
        } else {
            UnsupportedFeatureFoundflag = true;
            UnsupportedFeatureFoundLocation = 'BODY';
        }
        sampleCode += '\n';
    }

    // trigger request
    sampleCode += '\n// SECTION: TRIGGER REQUEST\n';

    // MakeRestRequest
    sampleCode += 'ASSIGN RESPONSE = ' + prefix + '.MakeRestRequest(';
    // url
    sampleCode += prefix + '_URL' + ', ';
    // body
    if (hasData.body(finalBody)) {
        sampleCode += prefix + '_BODY';
    } else {
        sampleCode += '""';
    }
    sampleCode += ', ';
    // json or xml
    // TODO: perform checks here
    sampleCode += '0' + ', ';
    // http method
    sampleCode += prefix + '_URL_METHOD';
    sampleCode += ')\n';

    // handle response
    sampleCode += '\n// SECTION: HANDLE RESPONSE\n';
    // Tag Response code and desc
    sampleCode += 'ASSIGN ' + 'RESPONSE' + '_STATUSCODE = ' + prefix + '.StatusCode\n';
    sampleCode += 'ASSIGN ' + 'RESPONSE' + '_STATUSDESC = ' + prefix + '.StatusDescription\n';

    sampleCode += '\n';
    sampleCode +=
        'IF (' + 'RESPONSE' + '_STATUSCODE >= 200 & ' + 'RESPONSE' + '_STATUSCODE < 300) {' + '\n';
    sampleCode += '    // ' + '\n';
    sampleCode += '    // Handle Sucessfull Response' + '\n';
    sampleCode += '    // ' + '\n';
    sampleCode += '}' + '\n';
    sampleCode += 'ELSE {' + '\n';
    sampleCode += '   // ' + '\n';
    sampleCode += '   // Handle UnSucessfull Response' + '\n';
    sampleCode += '   // ' + '\n';
    sampleCode += '   //            (╯°□°）╯︵ ┻━┻)' + '\n';
    sampleCode += '   // ASSIGN ERROR_MESSAGE = "We have a Boo Boo! =( "' + '\n';
    sampleCode += '   // ERROR_MESSAGE.throw()' + '\n';
    sampleCode += '}' + '\n';
}

function printPmRequest(insidePostman) {
    if (insidePostman) {
        console.log('//////////////////  SEND THIS TO MARK!  ////////////////////////////');
        console.log('//--LOCATION: ' + UnsupportedFeatureFoundLocation);
        console.log('//--COPY START------------------------------------------------------');
        console.log(JSON.stringify(pm.request));
        console.log('//--COPY END--------------------------------------------------------');
    } else {
        console.log('//--UNSUPPORTED ENTRY FOUND -----------------------------------');
        console.log('//--LOCATION: ' + UnsupportedFeatureFoundLocation);
    }
}

function printSampleCode() {
    if (!UnsupportedFeatureFoundflag) {
        console.log(sampleCode);
    } else {
        printPmRequest(insidePostman);
    }
}

function buildHeader() {
    let copyStart = '//----------------------------COPY START----------------------------//' + '\n';
    let hrLine = '//////////////////////////////////////////////////////////////////////' + '\n';
    let title =
        "//▂▃▅▇█▓▒░ Mark's Nice Sudio Snippet CodeGen 【ツ】 v" + version + ' ░▒▓█▇▅▃▂' + '\n';
    let brLine = '\n';
    sampleCode += copyStart + hrLine + title + hrLine + brLine;
    if (insidePostman) {
        sampleCode += '// ' + pm.info.requestName + '\n\n';
    }
}

function buildFooter() {
    let copyEnd = '//----------------------------COPY END------------------------------//' + '\n';
    let hrLine = '//////////////////////////////////////////////////////////////////////' + '\n';
    let msg = '// Generated on: ' + startTimeStamp + '\n';
    sampleCode += hrLine + msg + hrLine + copyEnd;
}

// Run Main function
main();
