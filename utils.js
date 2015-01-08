function extend() {
  var result = arguments[0] || {};
  for(var i = 0, len = arguments.length; i < len; i++) {
    var obj = arguments[i];

    for(var prop in obj) {
      result[prop] = obj[prop];
    }
  }
  return result;
}