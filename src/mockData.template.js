
export function loadMockRequests() {
    let pm_request
    // simple echo request
    pm_request = '{"url":{"protocol":"https","path":["get"],"host":["postman-echo","com"],"query":[{"key":"foo1","value":"bar1"},{"key":"foo2","value":"bar2"}],"variable":[]},"header":[{"key":"User-Agent","value":"PostmanRuntime/7.29.0","system":true},{"key":"Accept","value":"*/*","system":true},{"key":"Postman-Token","value":"21fe9f4f-a00b-4898-9fb0-e4da8df6a9b8","system":true},{"key":"Host","value":"postman-echo.com","system":true},{"key":"Accept-Encoding","value":"gzip, deflate, br","system":true},{"key":"Connection","value":"keep-alive","system":true}],"method":"GET","body":{}}'

    return pm_request
}