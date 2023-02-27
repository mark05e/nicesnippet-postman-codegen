// https://www.labnol.org/code/19871-get-post-requests-google-script

const doPost = (request = {}) => {
    const { parameter, postData: { contents, type } = {} } = request;
    const { source } = parameter;
  
    let result = generateSnippet(contents)
    return ContentService.createTextOutput(result);
  };
  
function testSnippetCodeGen(){
  let input = "{\"description\":{\"content\":\"The HTTP `POST` request method is meant to transfer data to a server \\n(and elicit a response). What data is returned depends on the implementation\\nof the server.\\n\\nA `POST` request can pass parameters to the server using \\\"Query String \\nParameters\\\", as well as the Request Body. For example, in the following request,\\n\\n> POST /hi/there?hand=wave\\n>\\n> <request-body>\\n\\nThe parameter \\\"hand\\\" has the value \\\"wave\\\". The request body can be in multiple\\nformats. These formats are defined by the MIME type of the request. The MIME \\nType can be set using the ``Content-Type`` HTTP header. The most commonly used \\nMIME types are:\\n\\n* `multipart/form-data`\\n* `application/x-www-form-urlencoded`\\n* `application/json`\\n\\nThis endpoint echoes the HTTP headers, request parameters, the contents of\\nthe request body and the complete URI requested.\",\"type\":\"text/plain\"},\"url\":{\"protocol\":\"https\",\"path\":[\"post\"],\"host\":[\"postman-echo\",\"com\"],\"query\":[],\"variable\":[]},\"method\":\"POST\",\"body\":{\"mode\":\"raw\",\"raw\":\"This is expected to be sent back as part of response body.\"}}"
  let result = generateSnippet(input)
  console.log(result)
}