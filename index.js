function writeLog(text = "Hello World") {
    console.log(text)
  }
  
  function generateSnippet(inputText) {
    console.clear()
    // Frontend protection
    if (typeof inputText === 'object') throw "Input is an object so no go!"
  
    // Check if we have valid json
    try {
        inputText = JSON.parse(inputText)
    } catch (error) {
        let msg = "ERROR: generateSnippet - JSON Parse error from input!"
        console.error(msg)
        return msg
        throw msg
    }
    // console.log({inputText})
  
    let sections = Object.keys(inputText)
    let urlCode = headerCode = authCode = methodCode = bodyCode = triggerCode = ""
    sections.forEach((section) => {
        if (section.toLowerCase()==="url") { urlCode = genUrlCode(inputText[section])}
        if (section.toLowerCase()==="header") { headerCode = genHeaderCode(inputText[section])}
        if (section.toLowerCase()==="auth") { authCode = genAuthCode(inputText[section])}
        if (section.toLowerCase()==="method") { methodCode = genMethodCode(inputText[section])}
        if (section.toLowerCase()==="body") { bodyCode = genBodyCode(inputText[section])}
    })
    
    triggerCode = genTriggerCode()
    
    // incase there are no headers
    if (!headerCode) {
        headerCode = genHeaderCode({})
    }
  
    // check for errors
    let sectionVariables = [urlCode, headerCode, authCode, methodCode, bodyCode]
    for (let codeResult in sectionVariables) {
        // console.log(sectionVariables[codeResult])
        if (sectionVariables[codeResult].startsWith('ERROR')) {
            return sectionVariables[codeResult]
        }
    }
    
    let finalCode = '//\n// Url code\n//\n'
    finalCode += urlCode
    finalCode += '\n\n//\n// Header code\n//\n'
    finalCode += headerCode
    if (authCode) {
        finalCode += '\n\n//\n// Auth code\n//\n'
        finalCode += authCode
    }
    finalCode += '\n\n//\n// Method code\n//\n'
    finalCode += methodCode
    finalCode += '\n\n//\n// Body code\n//\n'
    finalCode += bodyCode
    finalCode += '\n\n//\n// Trigger code\n//\n'
    finalCode += triggerCode
    // console.log(finalCode)
    
    // let outputText = JSON.stringify(inputText,null,2)
    return finalCode
  }
  
  function genUrlCode(jsonObj) {
    // console.log(jsonObj)
    let url = getUrl(jsonObj)
    let queryParamsArray = getQueryString(jsonObj)
    // TODO: Handle variable code
    let urlCode = 'ASSIGN RestProxy_Url = "' + url + '"'
    // console.log({queryParamsArray})
    // Check if there is query params
    if (queryParamsArray) {
        
        urlCode += "\n\n// Url Query Params"
        urlCode += '\nASSIGN RestProxy_UrlQueryParams = "?"'
        // add key value of query paramters as a new line
        queryParamsArray.forEach((keyValueString,i) => {
            if (i>0) {
                urlCode += '\nRestProxy_UrlQueryParams.append("&' + keyValueString + '")'
            } else {
                urlCode += '\nRestProxy_UrlQueryParams.append("' + keyValueString + '")'
            }
        })
  
        // Add the query params variable back to the regular URL
        urlCode += '\n\nRestProxy_Url.append(RestProxy_UrlQueryParams)'
    }
    let postmanVars = findInsideCurly(urlCode)
    if (postmanVars.length > 0) {
        urlCode += '\n\n// Replace variables'
        postmanVars.forEach(postmanVar => {
            urlCode += '\nRestProxy_Url = RestProxy_Url.replace("{{' + postmanVar + '}}", "__REPLACE__ME__")'
        })
    }
    urlCode += '\n\n// Debug\nTRACE "RestProxy_Url = {RestProxy_Url}"'
    return urlCode
  }
  
  function getUrl(jsonObj) {
    let protocol = jsonObj["protocol"] || "https"
    let host = jsonObj["host"].join(".")
    if (jsonObj["path"] !== undefined && jsonObj["path"].length > 0) {
        var path = jsonObj["path"].join("/") //optional
    }
  
    let fullurl = protocol
    fullurl += "://"
    fullurl += host
    fullurl += "/"
    if (path) {
        fullurl += path
    }
    // code += "/"  // dont think we need this
  
    // console.log({protocol,path,host,query,code})
    // console.log({fullurl})
    return fullurl
  }
  
  function getQueryString(jsonObj) {
    if (jsonObj["query"] === undefined) {
        return null
    }
    if (jsonObj["query"].length <= 0) {
        return null
    }
    // console.log({queryArrayOfObjects})
    queryArrayOfObjects = jsonObj["query"]
    // console.log({queryArrayOfObjects})
    let queryKvArray = []
    queryArrayOfObjects.forEach((queryKeyValue,i) => {
        let key = queryKeyValue['key']
        let value = queryKeyValue['value']
        // console.log({key,value})
        let keyValueString = key + "=" + value
        // console.log({keyValueString})
        queryKvArray.push(keyValueString)
    })
    // console.log({queryString})
    return queryKvArray
  }
  
  function genHeaderCode(jsonObj){
    // console.log({jsonObj}) // Array of Object
    // discoveryProxy.ContentType = "application/json"
    // skillProxy.AddHeader("Authorization" , "Bearer {bearerToken}")
    let headerCode = ""
    let acceptType = 0 // json
    headerCode += 'ASSIGN RestProxy = GetRESTProxy()'
    if (Object.keys(jsonObj).length === 0 || Object.keys(jsonObj).length === undefined) {
        console.log("genHeaderCode - no header length")
        return headerCode
    }
    // try {
    //     if (jsonObj.length === 0) {
    //         console.log("no length")
    //         return headerCode
    //     }
    // } catch (error) {
    //     console.log({error})
    //     return headerCode
    // }
    jsonObj.forEach((header,i) => {
        if (header.key.toLowerCase() === 'content-type') {
            headerCode += '\nRestProxy.ContentType = "' + header.value + '"'
            if (header.value.includes('xml')) { acceptType = 1 }
        } else {
            headerCode += '\nRestProxy.AddHeader("' + header.key + '", \'' + header.value + '\') '
        }
    })
    // console.log(headerCode)
    headerCode += '\nRestProxy_AcceptType = ' + acceptType + ' // 0 - json, 1 - xml'
  
    return headerCode
  }
  
  function genMethodCode(jsonObj) {
    // console.log({jsonObj})
    // Only allowed - GET, POST, PUT, DELETE
    let allowedVerbs = ['GET','POST','PUT','DELETE']
    if (allowedVerbs.indexOf(jsonObj.toUpperCase()) <= -1) {
        return 'ERROR: genMethodCode - Unsupported verb. Only allow GET,POST,PUT,DELETE\n\n' + JSON.stringify(jsonObj)
        throw 'Unsupported verb. Only allow GET,POST,PUT,DELETE'
    }
    let methodCode = 'ASSIGN RestProxy_Method = "' + jsonObj + '"'
    return methodCode
  }
  
  function genBodyCode(jsonObj) {
    // console.log({jsonObj})
    // console.log(Object.keys(jsonObj).length)
    let bodyCode = 'ASSIGN RestProxy_Body = ""'
    let postmanVars = []
    if (Object.keys(jsonObj).length === 0 || Object.keys(jsonObj).length === undefined) {
        return bodyCode
    }
    if (jsonObj.mode.toLowerCase() === 'raw') {
        // https://stackoverflow.com/questions/21895233/how-to-split-string-with-newline-n-in-node
        let lines = jsonObj.raw.split(/\r?\n/)
        lines.forEach((line,i) => {
            // check for variables
            if (findInsideCurly(line).length > 0) {
                postmanVars.push(findInsideCurly(line))
            }
  
            // Add lines to request body
            let escapeLine = escapeStrings(line)
            // console.log({escapeLine})
            bodyCode += '\nRestProxy_Body.append($' + JSON.stringify(escapeLine + insertNewLine()) + ')'
            // bodyCode += '\nRestProxy_Body.append($"{CHAR(10)}")'
        })
  
        // check for xml or json - to set restproxy accept type
        // 0 for json, 1 for xml
        // TODO: Change this to use contentType
        let lang = ""
        try {
            lang = jsonObj.options.raw.language
        } catch (error) {
            lang = 'json'
        }
        // console.log({lang})
        if (lang.toLowerCase().includes("xml")) {
            bodyCode += '\nRestProxy_AcceptType = 1 // 0 - json, 1 - xml'
        } else {
            bodyCode += '\nRestProxy_AcceptType = 0 // 0 - json, 1 - xml'
        }
  
        // check for variables
        postmanVars = postmanVars.flat(1)
        // console.log({postmanVars})
        if (postmanVars.length > 0) {
            bodyCode += '\n\n// Replace variables'
            postmanVars.forEach(postmanVar => {
                bodyCode += '\nRestProxy_Body = RestProxy_Body.replace("{{' + postmanVar + '}}", "__REPLACE__ME__")'
            })
        }
  
        // TRACE "RestProxy_Body = {RestProxy_Body}"
        bodyCode += '\n\n// Debug\nTRACE "RestProxy_Body = {RestProxy_Body}"'
    } else if (jsonObj.mode.toLowerCase() === 'urlencoded') {
      let keyValuesArray = jsonObj.urlencoded
  
      let textOutput = '';
  
      for (let i = 0; i < keyValuesArray.length; i++) {
        const { key, value } = keyValuesArray[i];
        const variableName = `${key}_value`;
      
        textOutput += `ASSIGN ${variableName} = "${value}"\n`;
        
        if (i === 0) {
          textOutput += `RestProxy_Body.append("${key}={${variableName}.urlencode()}")\n`;
        } else {
          textOutput += `RestProxy_Body.append("&${key}={${variableName}.urlencode()}")\n`;
        }
      }
  
      bodyCode += "\n" + textOutput
      
    } else {
        return 'ERROR: genBodyCode - Unhandled Body mode!\n\n' + JSON.stringify(jsonObj)
        throw 'Unhandled Body mode!'
    }
    // console.log(bodyCode)
    return bodyCode
  }
  
  function insertNewLine() {
    // https://www.cs.cmu.edu/~pattis/15-1XX/common/handouts/ascii.html
    let enable = true
    if (enable) {
        return "{CHAR(10)}"
    } else {
        return ''
    }
  }
  
  function findInsideCurly(line) {
    // Check for postman vars
    // https://stackoverflow.com/questions/413071/regex-to-get-string-between-curly-braces
    // [^{\}]+(?=})
    // let findInsideCurly = /[^{\}]+(?=})/g // single curly
    let findInsideCurly = /[^{{\}]+(?=}})/g // double curly
    let result = []
    let match = []
    let matchLength = ""
    if (findInsideCurly.test(line)) {
        match = line.match(findInsideCurly)
        matchLength = match.length
        // console.log({match,matchLength})
    }
    // if (matchLength > 0) {
    //     console.log({match})
    // }
    return match
  }
  
  function escapeStrings(line) {
    let result = JSON.stringify(line)
    result = line.substring(1)
    result = line.substring(-1)
    // https://help.nice-incontact.com/content/studio/scripting/reference/stringhandling.htm?Highlight=escape
    // result =    line.replace(/"/g, '\\"')    //  "  -->  \"
    //                     .replace(/'/g, "\\'")    //  '  -->  \'
    //                     .replace(/\"/g, '\\"')    //  '  -->  \'
    //                     // .replace(/\\/g, '\\\\')  //  \\ --> \\\\
    //                     // .replace(/\n/g, '\\n')   // new line
    //                     // .replace(/\r/g, '\\r');  // line feed
  
    // skip {{var}} as postman variables
    if (!(line.includes("{{") && line.includes("}}"))) {
        result = line.replace(/{/g, '\\{')    //  {  -->  \{
    }
  
    // return result
    return line
  }
  
  function genTriggerCode() {
    let triggerCode = 'ASSIGN RestProxy_Response = RestProxy.MakeRestRequest(RestProxy_Url, RestProxy_Body, RestProxy_AcceptType, RestProxy_Method)'
    triggerCode += '\nRestProxy_Response_StatusCode = RestProxy.StatusCode'
    triggerCode += '\nRestProxy_Response_StatusDesc = RestProxy.StatusDescription'
    triggerCode += '\n\n// Debug'
    triggerCode += '\nTRACE "RestProxy_Response_StatusCode = {RestProxy_Response_StatusCode}"'
    triggerCode += '\nTRACE "RestProxy_Response_StatusDesc = {RestProxy_Response_StatusDesc}"'
    triggerCode += '\nTRACE "RestProxy_Response = {RestProxy_Response.asjson()}"'
    triggerCode += '\n\nIF (RestProxy_Response_StatusCode >= 200 & RestProxy_Response_StatusCode < 300)'
    triggerCode += '\n{'
    triggerCode += '\n    // '
    triggerCode += '\n    // Handle Sucessfull Response'
    triggerCode += '\n    // '
    triggerCode += '\n}'
    triggerCode += '\nELSE {'
    triggerCode += '\n   // '
    triggerCode += '\n   // Handle Unsucessfull Response'
    triggerCode += '\n   // '
    triggerCode += '\n   //            (╯°□°）╯︵ ┻━┻)'
    triggerCode += '\n   // ASSIGN ERROR_MESSAGE = "We have a Boo Boo! =( "'
    triggerCode += '\n   // ERROR_MESSAGE.throw()'
    triggerCode += '\n}'
    triggerCode += '\n\n// Support:\n// Report issues over at https://github.com/mark05e/nicesnippet-postman-codegen/issues'
  
    return triggerCode
  }
  
  
  function genAuthCode(jsonObj) {
    let authCode = ""
    // console.log({jsonObj})
    if (jsonObj.type.toLowerCase() === 'basic') {
        let username = password = ""
        jsonObj.basic.forEach(item => {
            if (item.key.toLowerCase() === 'username') {username = item.value}
            if (item.key.toLowerCase() === 'password') {password = item.value}
        })
        // console.log({username,password})
        let basicAuth = 'Basic ' + btoa(username + ':' + password)
        console.log({basicAuth})
        authCode += 'RestProxy.AddHeader("Authorization","' + basicAuth + '")'
        return authCode
    } else if (jsonObj.type.toLowerCase() === 'noauth') {
      return authCode
    } else if (jsonObj.type.toLowerCase() === 'bearer') {
      // example: const inputArray = [{"key":"token","type":"any","value":"eyJ0eXAiOiJKXXXXXXXXXXXXXXXXXXXXXX"}];
      //     result: [ { key: 'Auth', value: 'Bearer eyJ0eXAiOiJKXXXXXXXXXXXXXXXXXXXXXX' } ]
      inputArray = jsonObj.bearer
      const outputArray = inputArray.map(item => {
          if (item.key === "token") {
            return { key: "Auth", value: `Bearer ${item.value}` };
          }
          return item;
        });
        return genHeaderCode(outputArray)
    } else {
        return 'ERROR: genAuthCode - Unsupported Auth mode\n\n' + JSON.stringify(jsonObj)
        throw 'Unsupported Auth mode'
    }
  }