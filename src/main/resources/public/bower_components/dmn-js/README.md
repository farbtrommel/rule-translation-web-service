# dmn-js (pre-packaged version)

This is a packaged version of [dmn-js](https://github.com/bpmn-io/dmn-js) for standalone usage or via [bower](http://bower.io).


## Usage

Fetch the dependency via `bower install dmn-js` or download individual files from the [dist folder](https://github.com/bpmn-io/bower-dmn-js/tree/master/dist).

Include the file into your project

```html
<!-- dependencies ... -->

<!-- dmn-js -->
<script src="bower_components/dmn-js/dist/dmn-viewer.js"></script>

<script>
  // require is part of bundle file
  var DmnViewer = window.DmnJS;

  var xml; // my DMN xml
  var viewer = new DmnViewer({ container: 'body' });

  viewer.importXML(xml, function(err) {

    if (err) {
      console.log('error rendering', err);
    } else {
      console.log('rendered');
    }
  });
</script>
```


Checkout the [examples repository](https://github.com/bpmn-io/dmn-js-examples) for a complete example of [how to use dmn-js with bower](https://github.com/bpmn-io/dmn-js-examples/tree/master/simple-bower).


## License

Use under the terms of the [bpmn-js license](http://bpmn.io/license).
