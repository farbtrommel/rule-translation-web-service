/*!
 * dmn-js - dmn-modeler v0.5.0

 * Copyright 2015 camunda Services GmbH and other contributors
 *
 * Released under the bpmn.io license
 * http://bpmn.io/license
 *
 * Source Code: https://github.com/dmn-io/dmn-js
 *
 * Date: 2016-04-20
 */

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.DmnJS=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(87);

var Viewer = _dereq_(2);

var initialTemplate = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn11.xsd"',
               'id="definitions"',
               'name="definitions"',
               'namespace="http://camunda.org/schema/1.0/dmn">',
    '<decision id="decision" name="">',
      '<decisionTable id="decisionTable">',
        '<input id="input1" label="">',
          '<inputExpression id="inputExpression1" typeRef="string">',
            '<text></text>',
          '</inputExpression>',
        '</input>',
        '<output id="output1" label="" name="" typeRef="string">',
        '</output>',
      '</decisionTable>',
    '</decision>',
  '</definitions>'
].join('\n');

/**
 * A modeler for DMN tables.
 *
 *
 * ## Extending the Modeler
 *
 * In order to extend the viewer pass extension modules to bootstrap via the
 * `additionalModules` option. An extension module is an object that exposes
 * named services.
 *
 * The following example depicts the integration of a simple
 * logging component that integrates with interaction events:
 *
 *
 * ```javascript
 *
 * // logging component
 * function InteractionLogger(eventBus) {
 *   eventBus.on('element.hover', function(event) {
 *     console.log()
 *   })
 * }
 *
 * InteractionLogger.$inject = [ 'eventBus' ]; // minification save
 *
 * // extension module
 * var extensionModule = {
 *   __init__: [ 'interactionLogger' ],
 *   interactionLogger: [ 'type', InteractionLogger ]
 * };
 *
 * // extend the viewer
 * var dmnModeler = new Modeler({ additionalModules: [ extensionModule ] });
 * dmnModeler.importXML(...);
 * ```
 *
 *
 * ## Customizing / Replacing Components
 *
 * You can replace individual table components by redefining them in override modules.
 * This works for all components, including those defined in the core.
 *
 * Pass in override modules via the `options.additionalModules` flag like this:
 *
 * ```javascript
 * function CustomContextPadProvider(contextPad) {
 *
 *   contextPad.registerProvider(this);
 *
 *   this.getContextPadEntries = function(element) {
 *     // no entries, effectively disable the context pad
 *     return {};
 *   };
 * }
 *
 * CustomContextPadProvider.$inject = [ 'contextPad' ];
 *
 * var overrideModule = {
 *   contextPadProvider: [ 'type', CustomContextPadProvider ]
 * };
 *
 * var dmnModeler = new Modeler({ additionalModules: [ overrideModule ]});
 * ```
 *
 * @param {Object} [options] configuration options to pass to the viewer
 * @param {DOMElement} [options.container] the container to render the viewer in, defaults to body.
 * @param {String|Number} [options.width] the width of the viewer
 * @param {String|Number} [options.height] the height of the viewer
 * @param {Object} [options.moddleExtensions] extension packages to provide
 * @param {Array<didi.Module>} [options.modules] a list of modules to override the default modules
 * @param {Array<didi.Module>} [options.additionalModules] a list of modules to use with the default modules
 */
function Modeler(options) {
  Viewer.call(this, options);
}

inherits(Modeler, Viewer);

Modeler.prototype.createTemplate = function(done) {
  this.importXML(initialTemplate, done);
};

Modeler.prototype._modelingModules = [
  // modeling components
  _dereq_(229),
  _dereq_(15),
  _dereq_(39),
  _dereq_(13),
  _dereq_(235),
  _dereq_(253),
  _dereq_(11)
];


// modules the modeler is composed of
//
// - viewer modules
// - interaction modules
// - modeling modules

Modeler.prototype._modules = [].concat(
  Modeler.prototype._modules,
  Modeler.prototype._modelingModules);


module.exports = Modeler;

},{"11":11,"13":13,"15":15,"2":2,"229":229,"235":235,"253":253,"39":39,"87":87}],2:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(182),
    omit = _dereq_(185),
    isString = _dereq_(180);

var domify = _dereq_(193),
    domQuery = _dereq_(196),
    domRemove = _dereq_(197);

var Table = _dereq_(207),
    DmnModdle = _dereq_(66);

var IdSupport = _dereq_(68),
    Ids = _dereq_(85);

var Importer = _dereq_(47);

var ComboBox = _dereq_(221);


function initListeners(table, listeners) {
  var events = table.get('eventBus');

  listeners.forEach(function(l) {
    events.on(l.event, l.handler);
  });

  events.on('table.destroy', function() {
    if (ComboBox.prototype._openedDropdown) {
      ComboBox.prototype._openedDropdown._closeDropdown();
    }
  });
}

function checkValidationError(err) {

  // check if we can help the user by indicating wrong DMN xml
  // (in case he or the exporting tool did not get that right)

  var pattern = /unparsable content <([^>]+)> detected([\s\S]*)$/;
  var match = pattern.exec(err.message);

  if (match) {
    err.message =
      'unparsable content <' + match[1] + '> detected; ' +
      'this may indicate an invalid DMN file' + match[2];
  }

  return err;
}

var DEFAULT_OPTIONS = {
  container: 'body'
};

/**
 * A viewer for DMN tables.
 *
 *
 * ## Extending the Viewer
 *
 * In order to extend the viewer pass extension modules to bootstrap via the
 * `additionalModules` option. An extension module is an object that exposes
 * named services.
 *
 * The following example depicts the integration of a simple
 * logging component that integrates with interaction events:
 *
 *
 * ```javascript
 *
 * // logging component
 * function InteractionLogger(eventBus) {
 *   eventBus.on('element.hover', function(event) {
 *     console.log()
 *   })
 * }
 *
 * InteractionLogger.$inject = [ 'eventBus' ]; // minification save
 *
 * // extension module
 * var extensionModule = {
 *   __init__: [ 'interactionLogger' ],
 *   interactionLogger: [ 'type', InteractionLogger ]
 * };
 *
 * // extend the viewer
 * var dmnViewer = new Viewer({ additionalModules: [ extensionModule ] });
 * dmnViewer.importXML(...);
 * ```
 *
 * @param {Object} [options] configuration options to pass to the viewer
 * @param {DOMElement} [options.container] the container to render the viewer in, defaults to body.
 * @param {String|Number} [options.width] the width of the viewer
 * @param {String|Number} [options.height] the height of the viewer
 * @param {Object} [options.moddleExtensions] extension packages to provide
 * @param {Array<didi.Module>} [options.modules] a list of modules to override the default modules
 * @param {Array<didi.Module>} [options.additionalModules] a list of modules to use with the default modules
 */
function Viewer(options) {

  this.options = options = assign({}, DEFAULT_OPTIONS, options || {});

  var parent = options.container;

  // support jquery element
  // unwrap it if passed
  if (parent.get) {
    parent = parent.get(0);
  }

  // support selector
  if (isString(parent)) {
    parent = domQuery(parent);
  }

  var container = this.container = domify('<div class="dmn-table"></div>');
  parent.appendChild(container);
}

Viewer.prototype.importXML = function(xml, done) {

  var self = this;

  this.moddle = this.createModdle();

  this.moddle.fromXML(xml, 'dmn:Definitions', function(err, definitions, context) {
    if (err) {
      err = checkValidationError(err);
      return done(err);
    }

    var parseWarnings = context.warnings;

    self.importDefinitions(definitions, function(err, importWarnings) {
      if (err) {
        return done(err);
      }

      done(null, parseWarnings.concat(importWarnings || []));
    });
  });
};

Viewer.prototype.saveXML = function(options, done) {

  if (!done) {
    done = options;
    options = {};
  }

  var definitions = this.definitions;

  if (!definitions) {
    return done(new Error('no definitions loaded'));
  }

  this.moddle.toXML(definitions, options, done);
};

Viewer.prototype.createModdle = function() {
  var moddle = new DmnModdle(this.options.moddleExtensions);

  IdSupport.extend(moddle, new Ids([ 32, 36, 1 ]));

  return moddle;
};

Viewer.prototype.get = function(name) {

  if (!this.table) {
    throw new Error('no table loaded');
  }

  return this.table.get(name);
};

Viewer.prototype.invoke = function(fn) {

  if (!this.table) {
    throw new Error('no table loaded');
  }

  return this.table.invoke(fn);
};

Viewer.prototype.importDefinitions = function(definitions, done) {

  // use try/catch to not swallow synchronous exceptions
  // that may be raised during model parsing
  try {
    if (this.table) {
      this.clear();
    }

    this.definitions = definitions;

    var table = this.table = this._createTable(this.options);

    this._init(table);

    Importer.importDmnTable(table, definitions, done);
  } catch (e) {
    done(e);
  }
};

Viewer.prototype._init = function(table) {
  initListeners(table, this.__listeners || []);

  var container = table.get('sheet').getContainer();

  /**
   * The code in the <project-logo></project-logo> area
   * must not be changed, see http://bpmn.io/license for more information
   *
   * <project-logo>
   */
  container.appendChild(domify('<a href="http://bpmn.io" class="dmn-js-logo"></a>'));
  /**
   * </project-logo>
   */
};

Viewer.prototype._createTable = function(options) {

  var modules = [].concat(options.modules || this.getModules(), options.additionalModules || []);

  // add self as an available service
  modules.unshift({
    dmnjs: [ 'value', this ],
    moddle: [ 'value', this.moddle ]
  });

  options = omit(options, 'additionalModules');

  options = assign(options, {
    sheet: {
      width: options.width,
      height: options.height,
      container: this.container
    },
    modules: modules
  });

  return new Table(options);
};


Viewer.prototype.getModules = function() {
  return this._modules;
};

/**
 * Remove all drawn elements from the viewer.
 *
 * After calling this method the viewer can still
 * be reused for opening another table.
 */
Viewer.prototype.clear = function() {
  var table = this.table;

  if (table) {
    table.destroy();
  }

  delete this.table;
};

/**
 * Destroy the viewer instance and remove all its remainders
 * from the document tree.
 */
Viewer.prototype.destroy = function() {
  // clear underlying diagram
  this.clear();

  // remove container
  domRemove(this.container);
};

/**
 * Register an event listener on the viewer
 *
 * @param {String} event
 * @param {Function} handler
 */
Viewer.prototype.on = function(event, handler) {
  var table = this.table,
      listeners = this.__listeners = this.__listeners || [];

  listeners.push({ event: event, handler: handler });

  if (table) {
    table.get('eventBus').on(event, handler);
  }
};

// modules the viewer is composed of
Viewer.prototype._modules = [
  _dereq_(3),
  _dereq_(237),
  _dereq_(27),
  _dereq_(41),
  _dereq_(8),
  _dereq_(30),
  _dereq_(44),
  _dereq_(20),
  _dereq_(23),
  _dereq_(233),
  _dereq_(225),
  _dereq_(223)
];

module.exports = Viewer;

},{"180":180,"182":182,"185":185,"193":193,"196":196,"197":197,"20":20,"207":207,"221":221,"223":223,"225":225,"23":23,"233":233,"237":237,"27":27,"3":3,"30":30,"41":41,"44":44,"47":47,"66":66,"68":68,"8":8,"85":85}],3:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(49),
    _dereq_(5)
  ]
};

},{"49":49,"5":5}],4:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);

function DmnRenderer(eventBus) {

  eventBus.on('row.render', function(event) {
    if(event.data.isClauseRow) {
      domClasses(event.gfx).add('labels');
    }
  });

  eventBus.on('cell.render', function(event) {
    var data = event.data,
        gfx  = event.gfx;

    if(!data.column.businessObject) {
      return;
    }

    if(data.row.isClauseRow) {
      // clause names
      gfx.childNodes[0].textContent = data.column.businessObject.label;
    } else if(data.content) {
      if(!data.content.tagName && data.row.businessObject) {
        // input and output entries
        gfx.childNodes[0].textContent = data.content.text;
      }
    }
    if(!data.row.isFoot) {
      if(!!data.column.businessObject.inputExpression) {
        domClasses(gfx).add('input');
      } else {
        domClasses(gfx).add('output');
      }
    }
  });
}

DmnRenderer.$inject = [ 'eventBus' ];

module.exports = DmnRenderer;

},{"191":191}],5:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'dmnRenderer' ],
  dmnRenderer: [ 'type', _dereq_(4) ]
};

},{"4":4}],6:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(193);

/**
 * Adds an annotation column to the table
 *
 * @param {EventBus} eventBus
 */
function Annotations(eventBus, sheet, elementRegistry, graphicsFactory, hideTechControl) {

  this.column = null;

  var self = this;

  var labelCell;

  eventBus.on('import.success', function(event) {

    eventBus.fire('annotations.add', event);

    self.column = sheet.addColumn({
      id: 'annotations',
      isAnnotationsColumn: true
    });

    labelCell = elementRegistry.filter(function(element) {
        return element._type === 'cell' && element.column === self.column && element.row.isLabelRow;
      })[0];
    labelCell.rowspan = hideTechControl.isHidden() ? 2 : 4;

    labelCell.content = domify('Annotation');

    graphicsFactory.update('column', self.column, elementRegistry.getGraphics(self.column.id));

    eventBus.fire('annotations.added', self.column);
  });

  eventBus.on('details.hidden', function() {
    if(labelCell) {
      labelCell.rowspan = 2;
      graphicsFactory.update('column', self.column, elementRegistry.getGraphics(self.column.id));
    }
  });
  eventBus.on('details.shown', function() {
    if(labelCell) {
      labelCell.rowspan = 4;
      graphicsFactory.update('column', self.column, elementRegistry.getGraphics(self.column.id));
    }
  });

  eventBus.on('sheet.destroy', function(event) {

    eventBus.fire('annotations.destroy', self.column);

    sheet.removeColumn({
      id: 'annotations'
    });

    eventBus.fire('annotations.destroyed', self.column);
  });
}

Annotations.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'graphicsFactory', 'hideTechControl' ];

module.exports = Annotations;

Annotations.prototype.getColumn = function() {
  return this.column;
};

},{"193":193}],7:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);

function AnnotationsRenderer(
    eventBus,
    annotations) {

  eventBus.on('cell.render', function(event) {
    if(event.data.column === annotations.getColumn() && !event.data.row.isFoot) {
      domClasses(event.gfx).add('annotation');
      if(!event.data.row.isHead) {
        // render the description of the rule inside the cell
        event.gfx.childNodes[0].textContent = event.data.row.businessObject.description || '';
      }
    }
  });
}

AnnotationsRenderer.$inject = [
  'eventBus',
  'annotations'
];

module.exports = AnnotationsRenderer;

},{"191":191}],8:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'annotations', 'annotationsRenderer'],
  __depends__: [
  ],
  annotations: [ 'type', _dereq_(6) ],
  annotationsRenderer: [ 'type', _dereq_(7) ]
};

},{"6":6,"7":7}],9:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(193);
var domClasses = _dereq_(191);
var forEach = _dereq_(95);

var DRAG_THRESHOLD = 10;

function isOfSameType(element1, element2) {
  return element1.column.type === element2.column.type;
}

function ColumnDrag(eventBus, sheet, elementRegistry, modeling) {

  this._sheet = sheet;
  this._elementRegistry = elementRegistry;
  this._utilityColumn = null;
  this._modeling = modeling;
  this._eventBus = eventBus;

  var self = this;

  eventBus.on('utilityColumn.added', function(event) {
    var column = event.column;
    self._utilityColumn = column;
  });

  this.dragDistance = 0;
  this.draggedElement = null;
  this.previousCoordinates = {
    x: 0,
    y: 0
  };
  this.highlightedBorder = null;
  this.moveLeft = false;

  eventBus.on('element.mousedown', function(event) {
    var hasDragHandle = domClasses(event.originalEvent.target).has('drag-handle');

    if(hasDragHandle) {
      event.preventDefault();
      self.startDragging(event.element);
      self.setLastDragPoint(event.originalEvent);
    }
  });
  document.body.addEventListener('mouseup', function(event) {
    if(self.isDragging()) {
      self.stopDragging();
    }
  });
  document.body.addEventListener('mousemove', function(event) {
    if(self.isDragging()) {
      event.preventDefault();
      self.updateDragDistance(event);
      if(self.dragDistance > DRAG_THRESHOLD) {
        self.updateVisuals(event);
      }
    }
  });
}

ColumnDrag.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'modeling' ];

module.exports = ColumnDrag;

ColumnDrag.prototype.setLastDragPoint = function(event) {
  this.previousCoordinates.x = event.clientX;
  this.previousCoordinates.y = event.clientY;
};

ColumnDrag.prototype.highlightColumn = function(domNode, position) {

  var elementRegistry = this._elementRegistry;

  var cellId = domNode.getAttribute('data-element-id');
  var element = elementRegistry.get(cellId);
  var column = element.column;

  var cellsInColumn = elementRegistry.filter(function(element) {
    return element._type === 'cell' && element.column === column;
  });

  forEach(cellsInColumn, function(cell) {
    var gfx = elementRegistry.getGraphics(cell);
    domClasses(gfx).add('drop');
    domClasses(gfx).add(position);
  });
};

ColumnDrag.prototype.clearHighlight = function() {
  var elements = document.querySelectorAll('.drop');
  forEach(elements, function(element) {
    domClasses(element).remove('drop');
    domClasses(element).remove('left');
    domClasses(element).remove('right');
  });
};

ColumnDrag.prototype.updateVisuals = function(event) {

  if(!this.dragVisual) {
    this.dragVisual = this.createDragVisual(this.draggedElement);
  }

  var container = this._sheet.getContainer();
  container.appendChild(this.dragVisual);

  this.dragVisual.style.position = 'fixed';
  this.dragVisual.style.left = (this.previousCoordinates.x + 5) + 'px';
  this.dragVisual.style.top = (this.previousCoordinates.y + 5) + 'px';

  // clear the indicator for the previous run
  this.clearHighlight();
  this.highlightedBorder = null;

  // get the element we are hovering over
  var td = event.target;
  while(td && (td.tagName || '').toLowerCase() !== 'td') {
    td = td.parentNode;
  }
  if(td && isOfSameType(this.draggedElement, this._elementRegistry.get(td.getAttribute('data-element-id')))) {
      // check if we hover over the left or the right half of the column
      var e = td;
      var offset = {x:0,y:0};
      while (e)
      {
          offset.x += e.offsetLeft;
          offset.y += e.offsetTop;
          e = e.offsetParent;
      }
      if(event.clientX < offset.x + td.clientWidth / 2) {
        this.highlightColumn(td, 'left');
        this.moveLeft = true;
      } else {
        this.highlightColumn(td, 'right');
        this.moveLeft = false;
      }

    this.highlightedBorder = td;
  }
};

ColumnDrag.prototype.updateDragDistance = function(event) {
  this.dragDistance +=
      Math.abs(event.clientX - this.previousCoordinates.x) +
      Math.abs(event.clientY - this.previousCoordinates.y);

  this.setLastDragPoint(event);
};

ColumnDrag.prototype.startDragging = function(element) {
  this.draggedElement = element;
  this.dragDistance = 0;

  this.dragVisual = null;
  this._eventBus.fire('column.drag.started');
};

ColumnDrag.prototype.createDragVisual = function(element) {

  var node,
      rowClone,
      cellClone;

  // get the html element of the dragged element
  var gfx = this._elementRegistry.getGraphics(element);

  // get the index of the element
  var idx = [].indexOf.call(gfx.parentNode.childNodes, gfx); // childNodes is a NodeList and not an array :(

  var table = domify('<table>');

  // iterate over the rest of the head
  var thead = domify('<thead>');
  node = gfx.parentNode;
  do {
    // clone row
    rowClone = node.cloneNode(true);

    // clone cell with correct idx
    cellClone = rowClone.childNodes.item(idx).cloneNode(true);

    cellClone.style.height = rowClone.childNodes.item(idx).clientHeight + 'px';

    // remove all childNodes from the rowClone
    while(rowClone.firstChild) {
      rowClone.removeChild(rowClone.firstChild);
    }

    // add the cellclone as only child of the row
    rowClone.appendChild(cellClone);
    thead.appendChild(rowClone);
  } while (!!(node = node.nextSibling));
  table.appendChild(thead);

  // iterate over the body
  var tbody = domify('<tbody>');
  node = this._sheet.getBody().firstChild;
  do {
    // clone row
    rowClone = node.cloneNode(true);

    // clone cell with correct idx
    cellClone = rowClone.childNodes.item(idx).cloneNode(true);

    cellClone.style.height = node.childNodes.item(idx).clientHeight + 'px';

    // remove all childNodes from the rowClone
    while(rowClone.firstChild) {
      rowClone.removeChild(rowClone.firstChild);
    }

    // add the cellclone as only child of the row
    rowClone.appendChild(cellClone);
    tbody.appendChild(rowClone);
  } while (!!(node = node.nextSibling));
  table.appendChild(tbody);


  // put it in a table tbody
  table.setAttribute('class','dragTable');
  table.style.width = gfx.clientWidth + 'px';

  // fade the original element
  domClasses(gfx).add('dragged');
  return table;
};

ColumnDrag.prototype.stopDragging = function() {
  if(this.highlightedBorder) {
    // make sure we drop it to the element we have previously highlighted
    var targetElement = this._elementRegistry.get(this.highlightedBorder.getAttribute('data-element-id'));
    this._modeling.moveColumn(this.draggedElement.column, targetElement.column, this.moveLeft);
  }
  if(this.dragVisual) {
    this.dragVisual.parentNode.removeChild(this.dragVisual);
    // restore opacity of the element
    domClasses(this._elementRegistry.getGraphics(this.draggedElement)).remove('dragged');
    this._elementRegistry.getGraphics(this.draggedElement).style.opacity = '';
  }
  this.clearHighlight();
  this.highlightedBorder = null;

  this.draggedElement = null;
  this._eventBus.fire('column.drag.stopped');
};

ColumnDrag.prototype.isDragging = function() {
  return !!this.draggedElement;
};

},{"191":191,"193":193,"95":95}],10:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);
var domify = _dereq_(193);

function DragRenderer(
    eventBus,
    utilityColumn) {

  eventBus.on('cell.render', function(event) {
    if (event.data.row.isClauseRow) {
      domClasses(event.gfx).add('draggable');

      var hasDragHandle = domClasses(event.gfx.lastChild).has('drag-handle');

      if(!hasDragHandle) {
        event.gfx.appendChild(domify('<span class="drag-handle dmn-icon-drag"></span>'));
      }
    }

    // add drag icon for rows
    if (event.data.column === utilityColumn.getColumn() && !event.data.row.isFoot && !event.data.row.isHead) {
      domClasses(event.gfx).add('dmn-icon-drag');
    }
  });
}

DragRenderer.$inject = [
  'eventBus',
  'utilityColumn'
];

module.exports = DragRenderer;

},{"191":191,"193":193}],11:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'columnDrag', 'columnDragRenderer' ],
  __depends__: [],
  columnDrag: [ 'type', _dereq_(9) ],
  columnDragRenderer: [ 'type', _dereq_(10) ]
};

},{"10":10,"9":9}],12:[function(_dereq_,module,exports){
'use strict';

var getEntriesType = _dereq_(50).getEntriesType;

function ContextMenu(popupMenu, eventBus, modeling, elementRegistry, editorActions, selection) {

  this._popupMenu = popupMenu;
  this._eventBus = eventBus;
  this._modeling = modeling;
  this._elementRegistry = elementRegistry;
  this._editorActions = editorActions;

  var self = this;

  eventBus.on('element.contextmenu', function(evt) {
    // Do not open context menu on table footer
    if(!evt.element.row.isFoot) {
      evt.preventDefault();
      evt.gfx.firstChild.focus();
      self.open(evt.originalEvent.pageX, evt.originalEvent.pageY, evt.element);
    }
  });

  var preventFunction = function(evt) {
    evt.preventDefault();
  };
  eventBus.on('popupmenu.open', function(evt) {
    evt.container.addEventListener('contextmenu', preventFunction);
  });

  eventBus.on('popupmenu.close', function(evt) {
    evt.container.removeEventListener('contextmenu', preventFunction);
  });


  document.addEventListener('click', function(evt) {
    self.close();
  });

}

ContextMenu.$inject = [ 'popupMenu', 'eventBus', 'modeling', 'elementRegistry', 'editorActions' ];

module.exports = ContextMenu;

ContextMenu.prototype.getRuleActions = function(context) {
  return { id: 'rule', content: {label: 'Rule', linkClass: 'disabled', entries: [
          {id: 'ruleAdd', action: this.ruleAddAction.bind(this),
           content: {label: 'add', icon: 'plus', entries: [
            {id: 'ruleAddAbove', content: {label: '', icon: 'above'},
            action: this.ruleAddAction.bind(this, 'above')},
            {id: 'ruleAddBelow', content: {label: '', icon: 'below'},
            action: this.ruleAddAction.bind(this, 'below')}
          ]}},
          {id: 'ruleRemove', content: {label: 'remove', icon: 'minus'},
            action: this.ruleRemoveAction.bind(this)},
          {id: 'ruleClear', content: {label: 'clear', icon: 'clear'},
            action: this.ruleClearAction.bind(this)}
        ]}};
};

var isLastColumn = function(column) {
  var type = column.businessObject.$type;

  // return false when the previous or the next column is of the same type
  return !(column.next.businessObject     && column.next.businessObject.$type === type ||
           column.previous.businessObject && column.previous.businessObject.$type === type);
},
noop = function(){};


ContextMenu.prototype.getInputActions = function(context) {
  var lastColumn = isLastColumn(context.column);
  return { id: 'clause', content: {label: 'Input', linkClass: 'disabled', icon:'input', entries: [
          {id: 'clauseAdd', action: this.clauseAddInput.bind(this),
           content: {label: 'add', icon:'plus', entries: [
            {id: 'clauseAddLeft', content: {label: '', icon: 'left'},
            action: this.clauseAddAction.bind(this, 'left')},
            {id: 'clauseAddRight', content: {label: '', icon: 'right'},
            action: this.clauseAddAction.bind(this, 'right')}
          ]}},
          {id: 'clauseRemove', content: {label: 'remove', icon: 'minus', linkClass: lastColumn ? 'disabled' : ''},
            action: lastColumn ? noop : this.clauseRemoveAction.bind(this)}
        ]}};
};

ContextMenu.prototype.getOutputActions = function(context) {
  var lastColumn = isLastColumn(context.column);
  return { id: 'clause', content: {label: 'Output', linkClass: 'disabled', icon:'output', entries: [
          {id: 'clauseAdd', action: this.clauseAddOutput.bind(this),
           content: {label: 'add', icon:'plus', entries: [
            {id: 'clauseAddLeft', content: {label: '', icon: 'left'},
            action: this.clauseAddAction.bind(this, 'left')},
            {id: 'clauseAddRight', content: {label: '', icon: 'right'},
            action: this.clauseAddAction.bind(this, 'right')}
          ]}},
          {id: 'clauseRemove', content: {label: 'remove', icon: 'minus', linkClass: lastColumn ? 'disabled' : ''},
            action: lastColumn ? noop : this.clauseRemoveAction.bind(this)}
        ]}};
};

ContextMenu.prototype.getActions = function(context) {
  var activeEntriesType = getEntriesType(context),
      out = [];

  if (activeEntriesType.rule) {
    out.push(this.getRuleActions(context));
  }

  if (activeEntriesType.input) {
    out.push(this.getInputActions(context));
  }

  if (activeEntriesType.output) {
    out.push(this.getOutputActions(context));
  }
  return out;
};

ContextMenu.prototype.open = function(x, y, context) {
  var actions = this.getActions(context);

  if(actions.length > 0) {
    this._popupMenu.open({
      position: { x: x, y: y },
      entries: actions
    });
  }
};

ContextMenu.prototype.close = function() {
  this._popupMenu.close();
};

ContextMenu.prototype.clauseRemoveAction = function() {
  this._editorActions.trigger('clauseRemove');

  this.close();
};

ContextMenu.prototype.clauseAddInput = function() {
  this._editorActions.trigger('clauseAdd', 'input');

  this.close();
};

ContextMenu.prototype.clauseAddOutput = function() {
  this._editorActions.trigger('clauseAdd', 'output');

  this.close();
};

ContextMenu.prototype.clauseAddAction = function(position) {
  var editorActions = this._editorActions;

  if (position === 'left') {
    editorActions.trigger('clauseAddLeft');

  } else if (position === 'right') {
    editorActions.trigger('clauseAddRight');
  }

  this.close();
};

ContextMenu.prototype.ruleRemoveAction = function() {
  this._editorActions.trigger('ruleRemove');

  this.close();
};

ContextMenu.prototype.ruleAddAction = function(position) {
  var editorActions = this._editorActions;

  if (position === 'above') {
    editorActions.trigger('ruleAddAbove');

  } else if (position === 'below'){
    editorActions.trigger('ruleAddBelow');
  } else {
    editorActions.trigger('ruleAdd');
  }

  this.close();
};

ContextMenu.prototype.ruleClearAction = function() {
  this._editorActions.trigger('ruleClear');

  this.close();
};

},{"50":50}],13:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'contextMenu' ],
  __depends__: [
    _dereq_(250)
  ],
  contextMenu: [ 'type', _dereq_(12) ]
};

},{"12":12,"250":250}],14:[function(_dereq_,module,exports){
'use strict';

var ids = new (_dereq_(59))('table');

function DmnEditorActions(modeling, elementRegistry, selection, editorActions) {

  var actions = {
    ruleAdd: function() {
      var newRow = {
        id: ids.next()
      };

      modeling.createRow(newRow);
    },
    ruleAddAbove: function() {
      var selected = selection._selectedElement,
          newRow;

      if (selected) {
        newRow = {
          id: ids.next()
        };
        newRow.next = selected.row;
        modeling.createRow(newRow);
      }
    },
    ruleAddBelow: function() {
      var selected = selection._selectedElement,
          newRow;

      if (selected) {
        newRow = {
          id: ids.next()
        };
        newRow.previous = selected.row;
        modeling.createRow(newRow);
      }

    },
    ruleClear: function() {
      var selected = selection._selectedElement;

      if (selected) {
        modeling.clearRow(selected.row);
      }
    },
    ruleRemove: function() {
      var selected = selection._selectedElement;

      if (selected) {
        modeling.deleteRow(selected.row);
      }
    },
    clauseAdd: function(clauseType) {
      var newColumn,
          type,
          col;

      var clauses = {
        input: 'dmn:InputClause',
        output: 'dmn:OutputClause'
      };

      var columns = elementRegistry.filter(function(element) {
        if (element.column && element.column.businessObject &&
            element.column.businessObject.$type === clauses[clauseType]) {
          return true;
        }
        return false;
      });

      col = columns[0].column;
      type = col.businessObject.$type;

      while (col.next && col.next.businessObject && col.next.businessObject.$type === type) {
        col = col.next;
      }

      newColumn = {
        id: ids.next(),
        previous: col,
        name: '',
        isInput: clauses[clauseType] === 'dmn:InputClause'
      };

      modeling.createColumn(newColumn);
    },
    clauseAddLeft: function() {
      var selected = selection._selectedElement,
          isInput, newColumn;

      if (selected) {
        isInput = selected.column.businessObject.$type === 'dmn:InputClause';

        newColumn = {
          id: ids.next(),
          previous: selected.column.previous,
          name: '',
          isInput: isInput
        };

        modeling.createColumn(newColumn);
      }
    },
    clauseAddRight: function() {
      var selected = selection._selectedElement,
          isInput, newColumn;

      if (selected) {
        isInput = selected.column.businessObject.$type === 'dmn:InputClause';

        newColumn = {
          id: ids.next(),
          previous: selected.column,
          name: '',
          isInput: isInput
        };

        modeling.createColumn(newColumn);
      }
    },
    clauseRemove: function() {
      var selected = selection._selectedElement;

      if (selected) {
        modeling.deleteColumn(selected.column);
      }
    }
  };

  editorActions.register(actions);
}


DmnEditorActions.$inject = [ 'modeling', 'elementRegistry', 'selection', 'editorActions' ];

module.exports = DmnEditorActions;

},{"59":59}],15:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'dmnEditorActions' ],
  dmnEditorActions: [ 'type', _dereq_(14) ]
};

},{"14":14}],16:[function(_dereq_,module,exports){
'use strict';

function DmnFactory(moddle) {
  this._model = moddle;
}

DmnFactory.$inject = [ 'moddle' ];


DmnFactory.prototype._needsId = function(element) {
  return element.$instanceOf('dmn:DMNElement');
};

DmnFactory.prototype._ensureId = function(element) {

  // generate semantic ids for elements
  // bpmn:SequenceFlow -> SequenceFlow_ID
  var prefix = (element.$type || '').replace(/^[^:]*:/g, '') + '_';

  if (!element.id && this._needsId(element)) {
    element.id = this._model.ids.nextPrefixed(prefix, element);
  }
};


DmnFactory.prototype.create = function(type, attrs) {
  var element = this._model.create(type, attrs || {});

  this._ensureId(element);

  return element;
};

DmnFactory.prototype.createRule = function(id) {
  var attrs = {id: id};
  attrs.inputEntry = attrs.inputEntry || [];
  attrs.outputEntry = attrs.outputEntry || [];

  var element = this.create('dmn:DecisionRule', attrs);

  return element;
};

DmnFactory.prototype.createInputEntry = function(text, clause, rule) {
  var element = this.create('dmn:UnaryTests', {
    text: text
  });

  var clauseIdx = clause.$parent.input.indexOf(clause);

  element.$parent = rule;
  rule.inputEntry.splice(clauseIdx, 0, element);

  return element;
};

DmnFactory.prototype.createInputClause = function(name) {
  var element = this.create('dmn:InputClause', {
    label: name
  });
  element.inputExpression = this.create('dmn:LiteralExpression', {});

  element.inputExpression.typeRef = 'string';

  return element;
};

DmnFactory.prototype.createOutputClause = function(name) {
  var element = this.create('dmn:OutputClause', {
    label: name
  });

  element.typeRef = 'string';

  return element;
};

DmnFactory.prototype.createOutputEntry = function(text, clause, rule) {
  var element = this.create('dmn:LiteralExpression', {
    text: text
  });

  var clauseIdx = clause.$parent.output.indexOf(clause);

  element.$parent = rule;
  rule.outputEntry.splice(clauseIdx, 0, element);

  return element;
};

module.exports = DmnFactory;

},{}],17:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(87);

var BaseElementFactory = _dereq_(209);


/**
 * A dmn-aware factory for table-js elements
 */
function ElementFactory(moddle, dmnFactory) {
  BaseElementFactory.call(this);

  this._moddle = moddle;
  this._dmnFactory = dmnFactory;
}

inherits(ElementFactory, BaseElementFactory);


ElementFactory.$inject = [ 'moddle', 'dmnFactory' ];

module.exports = ElementFactory;

ElementFactory.prototype.baseCreate = BaseElementFactory.prototype.create;

ElementFactory.prototype.create = function(elementType, attrs) {
  attrs = attrs || {};

  var businessObject = attrs.businessObject;
  if(elementType === 'row') {
    attrs.type = 'dmn:DecisionRule';
  } else if(elementType === 'column' && !attrs.type) {
    attrs.type = attrs.isInput ? 'dmn:InputClause' : 'dmn:OutputClause';
  }

  if (!businessObject) {
    if (!attrs.type) {
      throw new Error('no type specified');
    }
    else if(attrs.type === 'dmn:DecisionRule') {
      businessObject = this._dmnFactory.createRule(attrs.id);
    } else if(elementType === 'column') {
      if(attrs.isInput) {
        businessObject = this._dmnFactory.createInputClause(attrs.name);
      } else {
        businessObject = this._dmnFactory.createOutputClause(attrs.name);
      }
    } else {
      businessObject = this._dmnFactory.create(attrs.type);
    }
  }

  attrs.businessObject = businessObject;
  attrs.id = businessObject.id;

  return this.baseCreate(elementType, attrs);

};

},{"209":209,"87":87}],18:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ ],
  __depends__: [ ],
  dmnFactory: [ 'type', _dereq_(16) ],
  elementFactory: [ 'type', _dereq_(17) ]
};

},{"16":16,"17":17}],19:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);
/**
 *  The controls module adds a container to the top-right corner of the table which holds
 *  some control elements
 */
function HideTechControl(eventBus, sheet, config) {

  this._sheet = sheet;
  this._eventBus = eventBus;
  this.hidden = false;

  var self = this;

  eventBus.on('controls.init', function(evt) {

    eventBus.on('controls.added', function(evt) {
      self._node = evt.node;
      if(config.hideDetails) {
        self.hide();
      }
    });

    evt.controls.addControl('Hide Details', function() {
      if(!domClasses(sheet.getContainer().parentNode).contains('hide-mappings')) {
        self.hide();
      } else {
        self.show();
      }
    });

  });

}

HideTechControl.$inject = [ 'eventBus', 'sheet', 'config' ];

module.exports = HideTechControl;

HideTechControl.prototype.hide = function() {
  if(!this._node) return;
  domClasses(this._sheet.getContainer().parentNode).add('hide-mappings');
  this._node.textContent = 'Show details';
  this.hidden = true;
  this._eventBus.fire('details.hidden');
};

HideTechControl.prototype.show = function() {
  if(!this._node) return;
  domClasses(this._sheet.getContainer().parentNode).remove('hide-mappings');
  this._node.textContent = 'Hide details';
  this.hidden = false;
  this._eventBus.fire('details.shown');
};

HideTechControl.prototype.isHidden = function() {
  return this.hidden;
};

},{"191":191}],20:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'hideTechControl' ],
  __depends__: [],
  hideTechControl: [ 'type', _dereq_(19) ]
};

},{"19":19}],21:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(193),
    ComboBox = _dereq_(221),
    domClasses = _dereq_(191);

/**
 * Adds behavior to display and set the hit policy of a table
 *
 * @param {EventBus} eventBus
 */
function HitPolicy(eventBus, utilityColumn, ioLabel, graphicsFactory, elementRegistry, rules, hideTechControl) {

  this.table = null;
  this.hitPolicyCell = null;

  var self = this;
  eventBus.on('dmnElement.added', function(event) {
    if(event.element && event.element.businessObject.$instanceOf('dmn:DecisionTable')) {
      self.table = event.element.businessObject;
    }
  });

  eventBus.on('cell.added', function(event) {

    if(event.element.column === utilityColumn.getColumn() &&
       event.element.row.id==='ioLabel') {
        self.hitPolicyCell = event.element;

        self.hitPolicyCell.rowspan = hideTechControl.isHidden() ? 2 : 4;

        var template = domify('<div>');

        // initializing the comboBox
        var comboBox = new ComboBox({
          label: 'Hit Policy',
          classNames: ['dmn-combobox', 'hitpolicy'],
          options: ['UNIQUE', 'FIRST', 'PRIORITY', 'ANY', 'COLLECT', 'RULE ORDER', 'OUTPUT ORDER'],
          dropdownClassNames: ['dmn-combobox-suggestions']
        });

        template.insertBefore(
          comboBox.getNode(),
          template.firstChild
        );

        var operatorComboBox = new ComboBox({
          label: 'Collect Operator',
          classNames: ['dmn-combobox', 'operator'],
          options: ['LIST', 'SUM', 'MIN', 'MAX', 'COUNT'],
          dropdownClassNames: ['dmn-combobox-suggestions']
        });

        template.appendChild(operatorComboBox.getNode());

        // display and hide the operatorComboBox based on the selected hit policy
        comboBox.addEventListener('valueChanged', function(evt) {
          if(evt.newValue.toLowerCase() === 'collect') {
            operatorComboBox.getNode().style.display = 'table';
          } else {
            operatorComboBox.getNode().style.display = 'none';
          }
        });

        event.element.complex = {
          className: 'dmn-hitpolicy-setter',
          template: template,
          element: event.element,
          comboBox: comboBox,
          operatorComboBox: operatorComboBox,
          type: 'hitPolicy',
          offset: {
            x: 42,
            y: -15
          }
        };
    }

  });

  // whenever an type cell is opened, we have to position the template, apply the model value and
  // potentially disable inputs
  eventBus.on('complexCell.open', function(evt) {
    if(evt.config.type === 'hitPolicy') {
      // feed the values to the template and combobox
      evt.config.comboBox.setValue(self.getHitPolicy());
      evt.config.operatorComboBox.setValue(self.getAggregation());

      var template = evt.config.template;

      // focus the combobox input field
      template.querySelector('.dmn-combobox > input').focus();

      // disable all input fields if editing is not allowed
      if(!rules.allowed('hitPolicy.edit')) {
        var inputs = template.querySelectorAll('input');
        for(var i = 0; i < inputs.length; i++) {
          inputs[i].setAttribute('disabled', 'true');
        }
        evt.config.comboBox.disable();

        // also set a disabled css class on the template
        domClasses(template.parentNode).add('read-only');
      }
    }
  });


  // whenever a datatype cell is closed, apply the changes to the underlying model
  eventBus.on('complexCell.close', function(evt) {
    if(evt.config.type === 'hitPolicy') {
      eventBus.fire('hitPolicy.edit', {
        table: self.table,
        hitPolicy: evt.config.comboBox.getValue(),
        aggregation: evt.config.comboBox.getValue() === 'COLLECT' ? evt.config.operatorComboBox.getValue() : undefined,
        cell: self.getCell()
      });

      graphicsFactory.update('cell', self.getCell(), elementRegistry.getGraphics(self.getCell()));
    }
  });

  eventBus.on('details.hidden', function() {
    if(self.hitPolicyCell) {
      self.hitPolicyCell.rowspan = 2;
      graphicsFactory.update('cell', self.hitPolicyCell, elementRegistry.getGraphics(self.hitPolicyCell.id));
    }
  });
  eventBus.on('details.shown', function() {
    if(self.hitPolicyCell) {
      self.hitPolicyCell.rowspan = 4;
      graphicsFactory.update('cell', self.hitPolicyCell, elementRegistry.getGraphics(self.hitPolicyCell.id));
    }
  });

}

HitPolicy.$inject = [
  'eventBus', 'utilityColumn', 'ioLabel',
  'graphicsFactory', 'elementRegistry', 'rules',
  'hideTechControl'
];

HitPolicy.prototype.getCell = function() {
  return this.hitPolicyCell;
};

HitPolicy.prototype.getHitPolicy = function() {
  return (this.table && this.table.hitPolicy) || '';
};

HitPolicy.prototype.getAggregation = function() {
  return (this.table && this.table.aggregation) || 'LIST';
};

module.exports = HitPolicy;


},{"191":191,"193":193,"221":221}],22:[function(_dereq_,module,exports){
'use strict';

function convertOperators(operator) {
  switch(operator) {
    case 'LIST': return '';
    case 'SUM': return '+';
    case 'MIN': return '<';
    case 'MAX': return '>';
    case 'COUNT': return '#';
  }
}

function HitPolicyRenderer(
    eventBus,
    hitPolicy) {

  eventBus.on('cell.render', function(event) {
    if (event.data === hitPolicy.getCell()) {
      var policy = hitPolicy.getHitPolicy(),
          aggregation = hitPolicy.getAggregation();

      event.gfx.childNodes[0].textContent = policy.charAt(0) + convertOperators(aggregation);
    }
  });

}

HitPolicyRenderer.$inject = [
  'eventBus',
  'hitPolicy'
];

module.exports = HitPolicyRenderer;

},{}],23:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'hitPolicy', 'hitPolicyRenderer' ],
  __depends__: [
    _dereq_(258),
    _dereq_(27),
  ],
  hitPolicy: [ 'type', _dereq_(21) ],
  hitPolicyRenderer: [ 'type', _dereq_(22) ],
};

},{"21":21,"22":22,"258":258,"27":27}],24:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(193),
    forEach = _dereq_(95);

// document wide unique overlay ids
var ids = new (_dereq_(59))('clause');

/**
 * Adds a control to the table to add more columns
 *
 * @param {EventBus} eventBus
 */
function IoLabel(eventBus, sheet, elementRegistry, graphicsFactory, rules) {

  this.row = null;

  var self = this;
  eventBus.on('sheet.init', function(event) {

    eventBus.fire('ioLabel.add', event);

    self.row = sheet.addRow({
      id: 'ioLabel',
      isHead: true,
      isLabelRow: true,
      useTH: true
    });

    eventBus.fire('ioLabel.added', self.row);
  });

  eventBus.on('sheet.destroy', function(event) {

    eventBus.fire('ioLabel.destroy', self.row);

    sheet.removeRow({
      id: 'ioLabel'
    });

    eventBus.fire('ioLabel.destroyed', self.row);
  });

  function updateColspans(evt) {
    var cells = elementRegistry.filter(function(element) {
      return element._type === 'cell' && element.row === self.row;
    });

    var inputs = cells.filter(function(cell) {
      return cell.column.businessObject && cell.column.businessObject.inputExpression;
    });

    forEach(inputs, function(input) {
      if(!input.column.previous.businessObject) {
        // first cell of the inputs array has the colspan attribute set
        input.colspan = inputs.length;

        var node;
        if(rules.allowed('column.create')) {
          node = domify('Input <a class="dmn-icon-plus"></a>');
          node.querySelector('a').addEventListener('mouseup', function() {
            var col = input.column;
            while(col.next && col.next.businessObject.$type === 'dmn:InputClause') {
              col = col.next;
            }

            var newColumn = {
              id: ids.next(),
              previous: col,
              name: '',
              isInput: true
            };

            eventBus.fire('ioLabel.createColumn', {
              newColumn: newColumn
            });
          });
        } else {
          node = domify('Input');
        }

        input.content = node;
      } else {
        input.colspan = 1;
      }
    });

    var outputs = cells.filter(function(cell) {
      return cell.column.businessObject && cell.column.businessObject.$instanceOf('dmn:OutputClause');
    });

    forEach(outputs, function(output) {
      if(output.column.previous.businessObject.inputExpression) {
        // first cell of the outputs array has the colspan attribute set
        output.colspan = outputs.length;

        var node;
        if(rules.allowed('column.create')) {
          node = domify('Output <a class="dmn-icon-plus"></a>');
          node.querySelector('a').addEventListener('mouseup', function() {
            var col = output.column;
            while(col.next && col.next.businessObject && col.next.businessObject.$type === 'dmn:OutputClause') {
              col = col.next;
            }

            var newColumn = {
              id: ids.next(),
              previous: col,
              name: '',
              isInput: false
            };

            eventBus.fire('ioLabel.createColumn', {
              newColumn: newColumn
            });
          });
        } else {
          node = domify('Output');
        }

        output.content = node;
      } else {
        output.colspan = 1;
      }
    });

    if(cells.length > 0) {
      graphicsFactory.update('row', cells[0].row, elementRegistry.getGraphics(cells[0].row.id));
    }
  }
  eventBus.on(['cells.added', 'cells.removed'], function(evt) {
    if(evt._type === 'column') {
      updateColspans();
    }
  });
  eventBus.on(['column.move.applied'], updateColspans);
}

IoLabel.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'graphicsFactory', 'rules' ];

module.exports = IoLabel;

IoLabel.prototype.getRow = function() {
  return this.row;
};

},{"193":193,"59":59,"95":95}],25:[function(_dereq_,module,exports){
'use strict';

function IoLabelRenderer(
    eventBus,
    ioLabel) {

  eventBus.on('cell.render', function(event) {
    if (event.data.row === ioLabel.getRow() &&
        event.data.content &&
        !event.gfx.childNodes[0].firstChild) {
      event.gfx.childNodes[0].appendChild(event.data.content);
    }
  });

}

IoLabelRenderer.$inject = [
  'eventBus',
  'ioLabel'
];

module.exports = IoLabelRenderer;

},{}],26:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(87);

var RuleProvider = _dereq_(55);

/**
 * LineNumber specific modeling rule
 */
function IoLabelRules(eventBus, ioLabel) {
  RuleProvider.call(this, eventBus);

  this._ioLabel = ioLabel;
}

inherits(IoLabelRules, RuleProvider);

IoLabelRules.$inject = [ 'eventBus', 'ioLabel' ];

module.exports = IoLabelRules;

IoLabelRules.prototype.init = function() {
  var self = this;
  this.addRule('cell.edit', function(context) {
    if(context.row === self._ioLabel.row) {
      return false;
    }
  });

};

},{"55":55,"87":87}],27:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'ioLabel', 'ioLabelRules', 'ioLabelRenderer' ],
  __depends__: [],
  ioLabel: [ 'type', _dereq_(24) ],
  ioLabelRules: [ 'type', _dereq_(26) ],
  ioLabelRenderer: [ 'type', _dereq_(25) ]
};

},{"24":24,"25":25,"26":26}],28:[function(_dereq_,module,exports){
'use strict';



var domify = _dereq_(193),
    domClasses = _dereq_(191),
    assign = _dereq_(182),
    ComboBox = _dereq_(221);

/**
 * Adds a control to the table to define the input- and output-mappings for clauses
 */
function MappingsRow(eventBus, sheet, elementRegistry, graphicsFactory, complexCell, rules) {

  this.row = null;

  var self = this;

  // add row when the sheet is initialized
  eventBus.on('sheet.init', function(event) {

    eventBus.fire('mappingsRow.add', event);

    self.row = sheet.addRow({
      id: 'mappingsRow',
      isHead: true,
      isMappingsRow: true
    });

    eventBus.fire('mappingsRow.added', self.row);

    graphicsFactory.update('row', self.row, elementRegistry.getGraphics(self.row.id));
  });

  // remove the row when the sheet is destroyed
  eventBus.on('sheet.destroy', function(event) {

    eventBus.fire('mappingsRow.destroy', self.row);

    sheet.removeRow({
      id: 'mappingsRow'
    });

    eventBus.fire('mappingsRow.destroyed', self.row);
  });

  /**
   * Helper function to position and resize the template. This is needed for the switch between
   * the large format script editor and the small expression editor
   *
   * @param {DOMNode}   node        template root node
   * @param {TableCell} element     cell for which the template is opened
   * @param {boolean}   large       indicating whether to switch to large mode
   */
  var positionTemplate = function(node, element, large) {
    var table = sheet.getRootElement(),
        gfx = elementRegistry.getGraphics(element),
        e, offset;

    if(large) {
      e = table;
      offset = {x:0,y:0};

      while (e)
      {
          offset.x += e.offsetLeft;
          offset.y += e.offsetTop;
          e = e.offsetParent;
      }

      // now also traverse the complete parent chain to determine the full scroll offset
      e = gfx;
      while (e && typeof e.scrollTop === 'number' && typeof e.scrollLeft === 'number')
      {
          offset.x -= e.scrollLeft;
          offset.y -= e.scrollTop;
          e = e.parentNode;
      }

      assign(node.style, {
        top: offset.y + 'px',
        left: offset.x + 'px',
        width: table.clientWidth + 'px'
      });

    } else {

      // traverse the offset parent chain to find the offset sum
      e = gfx;
      offset = {x:0,y:0};

      while (e)
      {
          offset.x += e.offsetLeft;
          offset.y += e.offsetTop;
          e = e.offsetParent;
      }

      // now also traverse the complete parent chain to determine the full scroll offset
      e = gfx;
      while (e && typeof e.scrollTop === 'number' && typeof e.scrollLeft === 'number')
      {
          offset.x -= e.scrollLeft;
          offset.y -= e.scrollTop;
          e = e.parentNode;
      }

      assign(node.style, {
        left: (offset.x + 2) + 'px',
        top: (offset.y - 72)  + 'px',
        width: 'auto',
        height: 'auto'
      });
    }
  };

  // when an input cell on the mappings row is added, setup the complex cell
  eventBus.on('cell.added', function(evt) {
    if(evt.element.row.id === 'mappingsRow' &&
       evt.element.column.businessObject &&
       evt.element.column.businessObject.inputExpression) {

      // cell content is the input expression of the clause
      evt.element.content = evt.element.column.businessObject.inputExpression;

      var template = domify("<div>\r\n  <div class=\"links\">\r\n    <div class=\"toggle-type\">\r\n      <label>Use:</label>\r\n      <a class=\"expression\">Expression</a>\r\n      /\r\n      <a class=\"script\">Script</a>\r\n    </div>\r\n    <a class=\"dmn-icon-clear\"></a>\r\n  </div>\r\n  <div class=\"expression region\">\r\n    <label>Expression:</label>\r\n    <input placeholder=\"propertyName\">\r\n  </div>\r\n  <div class=\"script region\">\r\n    <textarea placeholder=\"return obj.propertyName;\"></textarea>\r\n  </div>\r\n</div>\r\n");

      // initializing the comboBox
      var comboBox = new ComboBox({
        label: 'Language',
        classNames: ['dmn-combobox', 'language'],
        options: ['Javascript', 'Groovy', 'Python', 'Ruby'],
        dropdownClassNames: ['dmn-combobox-suggestions']
      });

      // When the inputExpression has a defined expressionLanguage, we assume that it is a script
      if(typeof evt.element.content.expressionLanguage !== 'undefined') {
        template.querySelector('textarea').value = evt.element.content.text || '';
        comboBox.setValue(evt.element.content.expressionLanguage);
      } else {
        template.querySelector('input').value = evt.element.content.text || '';
      }

      // --- setup event listeners ---

      // click on close button closes the template
      template.querySelector('.dmn-icon-clear').addEventListener('click', function() {
        complexCell.close();
      });

      // click on Expression link switches to expression mode
      template.querySelector('.expression').addEventListener('click', function() {
        domClasses(template.parentNode).remove('use-script');
        positionTemplate(template.parentNode, evt.element, false);

        // focus the script expression input field
        template.querySelector('.expression.region > input').focus();

        evt.element.complex.mappingType = 'expression';
      });

      // click on Script link switches to script mode
      template.querySelector('.script').addEventListener('click', function() {
        domClasses(template.parentNode).add('use-script');
        positionTemplate(template.parentNode, evt.element, true);

        // focus the script area
        template.querySelector('.script.region > textarea').focus();

        evt.element.complex.mappingType = 'script';
      });

      // pressing enter in the input field closes the dialog
      template.querySelector('.expression.region > input').addEventListener('keydown', function(evt) {
        if(evt.keyCode === 13) {
          complexCell.close();
        }
      });

      // add comboBox to the template
      template.querySelector('.script.region').insertBefore(
        comboBox.getNode(),
        template.querySelector('textarea')
      );

      // set the complex property to initialize complex-cell behavior
      evt.element.complex = {
        className: 'dmn-clauseexpression-setter',
        template: template,
        element: evt.element,
        mappingType: typeof evt.element.content.expressionLanguage !== 'undefined' ? 'script' : 'expression',
        comboBox: comboBox,
        type: 'mapping',
        offset: {
          x: 2,
          y: -72
        }
      };

      graphicsFactory.update('cell', evt.element, elementRegistry.getGraphics(evt.element));
    } else if(evt.element.row.id === 'mappingsRow' &&
              evt.element.column.businessObject) {

      // setup output mappings as simple cells with inline editing
      evt.element.content = evt.element.column.businessObject;
      graphicsFactory.update('cell', evt.element, elementRegistry.getGraphics(evt.element));
    }

  });

  // whenever an input mapping cell is opened, set the required mode (script vs. Expression)
  // and position the template accordingly
  eventBus.on('complexCell.open', function(evt) {
    if(evt.config.type === 'mapping') {
      var template = evt.config.template;
      if(typeof evt.config.element.content.expressionLanguage !== 'undefined') {
        evt.config.mappingType = 'script';
        domClasses(evt.container).add('use-script');
        positionTemplate(evt.container, evt.config.element, true);
        evt.container.querySelector('.script.region > textarea').focus();
      } else {
        evt.config.mappingType = 'expression';
        evt.container.querySelector('.expression.region > input').focus();
      }
      // disable input fields if inputMapping editing is not allowed
      if(!rules.allowed('inputMapping.edit')) {
        template.querySelector('.expression.region > input').setAttribute('disabled', 'true');
        template.querySelector('.script.region > textarea').setAttribute('disabled', 'true');
        evt.config.comboBox.disable();

        // also set a disabled css class on the template
        domClasses(template.parentNode).add('read-only');
      }

    }
  });

  // whenever an input mapping cell is closed, apply the changes to the underlying model
  eventBus.on('complexCell.close', function(evt) {
    if(evt.config.type === 'mapping') {
      var template = evt.config.template;
      if(evt.config.mappingType === 'expression') {
        eventBus.fire('mappingsRow.editInputMapping', {
          element: evt.config.element,
          expression: template.querySelector('input[placeholder="propertyName"]').value
        });
      } else if(evt.config.mappingType === 'script') {
        eventBus.fire('mappingsRow.editInputMapping', {
          element: evt.config.element,
          expression: template.querySelector('textarea').value,
          language: evt.config.comboBox.getValue()
        });
      }

    }
  });
}

MappingsRow.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'graphicsFactory', 'complexCell', 'rules' ];

module.exports = MappingsRow;

MappingsRow.prototype.getRow = function() {
  return this.row;
};

},{"182":182,"191":191,"193":193,"221":221}],29:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);

function MappingsRowRenderer(
    eventBus,
    mappingsRow) {

  // row has class 'mappings'
  eventBus.on('row.render', function(event) {
    if (event.data === mappingsRow.getRow()) {
      domClasses(event.gfx).add('mappings');
    }
  });

  eventBus.on('cell.render', function(event) {
    // input cell contains the expression or the expression language for scripts
    if (event.data.row === mappingsRow.getRow() && event.data.content &&
        event.data.column.businessObject.inputExpression) {
      if(event.data.content.expressionLanguage) {
        event.gfx.childNodes[0].textContent = event.data.content.expressionLanguage || '';
      } else {
        event.gfx.childNodes[0].textContent = event.data.content.text || '';
      }
    // output cell contains variable name
    } else if (event.data.row === mappingsRow.getRow() && event.data.content) {
      event.gfx.childNodes[0].textContent = event.data.content.name || '';
    }
  });

}

MappingsRowRenderer.$inject = [
  'eventBus',
  'mappingsRow'
];

module.exports = MappingsRowRenderer;

},{"191":191}],30:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'mappingsRow', 'mappingsRowRenderer' ],
  __depends__: [ _dereq_(223) ],
  mappingsRow: [ 'type', _dereq_(28) ],
  mappingsRowRenderer: [ 'type', _dereq_(29) ]
};

},{"223":223,"28":28,"29":29}],31:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(87),
    forEach = _dereq_(96);

var CommandInterceptor = _dereq_(51);


/**
 * A handler responsible for updating the underlying DMN
 * once changes on the table happen
 */
function DmnUpdater(eventBus, moddle, elementRegistry, dmnFactory, tableName) {

  CommandInterceptor.call(this, eventBus);


  function setParent(event) {

    var businessObject = event.context.row.businessObject;
    var parent = businessObject.$parent = tableName.semantic.decisionTable;


    // create the rules array if it does not exist
    if(!parent.rule) {
      parent.rule = [];
    }

    if(event.context.row.next) {
      parent.rule.splice(
        parent.rule.indexOf(event.context.row.next.businessObject), 0,
        businessObject);
    } else {
      parent.rule.push(businessObject);
    }

    if(!event.context._cells) {
      // we also have to explicitely create the cells for all clauses
      // inputs
      var allInputs = parent.input;

      var filterFunction = function(businessObject) {
        return function(element) {
          return element._type === 'cell' &&
             element.column.businessObject === businessObject &&
             element.row === event.context.row;
        };
      };

      for(var i = 0; i < allInputs.length; i++) {
        var input = allInputs[i];

        var inputCellBO = dmnFactory.createInputEntry('', input, businessObject);

        var inputCell = elementRegistry.filter(filterFunction(input))[0];
        inputCell.content = inputCellBO;
      }

      // outputs
      var allOutputs = parent.output;
      for(i = 0; i < allOutputs.length; i++) {
        var output = allOutputs[i];

        var outputCellBO = dmnFactory.createOutputEntry('', output, businessObject);

        var outputCell = elementRegistry.filter(filterFunction(output))[0];
        outputCell.content = outputCellBO;
      }
    }
  }

  function setColumnParent(event) {

    var parent = event.context.column.businessObject.$parent = tableName.semantic.decisionTable;

    var column = event.context.column;
    var businessObject = column.businessObject;
    var nextColumn = event.context.column.next;

    var type = businessObject.$type === 'dmn:InputClause' ? 'input' : 'output';

    if(nextColumn && nextColumn.businessObject && nextColumn.businessObject.$type === businessObject.$type) {
      parent[type].splice(
        parent[type].indexOf(column.next.businessObject), 0,
        businessObject);
    } else {
      parent[type].push(businessObject);
    }

    if(event.context._cells) {
      // if the column has cells, they should be added to the rules
      forEach(event.context._cells, function(cell) {
        if(!cell.row.isHead && !cell.row.isFoot && cell.content) {
          var ruleObj = cell.row.businessObject[type + 'Entry'];
          ruleObj.splice(parent[type].indexOf(businessObject), 0, cell.content);
        }
      });
    } else {
      // we also have to explicitely create the cells for all rules
      var allRules = parent.rule;
      forEach(allRules, function(rule) {
        var cellBO;
        if(type === 'input') {
          cellBO = dmnFactory.createInputEntry('', businessObject, rule);
        } else {
          cellBO = dmnFactory.createOutputEntry('', businessObject, rule);
        }

        var cell = elementRegistry.filter(function(element) {
          return element._type === 'cell' &&
             element.column === column &&
             element.row.businessObject === rule;
        })[0];

        cell.content = cellBO;

      });
    }
  }

  function unsetParent(event) {

    var businessObject = event.context.column.businessObject;
    var type = businessObject.$type === 'dmn:InputClause' ? 'input' : 'output';

    var idx = businessObject.$parent[type].indexOf(businessObject);

    businessObject.$parent[type].splice(idx, 1);

    forEach(businessObject.$parent.rule, function(rule) {
      rule[type + 'Entry'].splice(idx, 1);
    });
  }

  function deleteRule(event) {
    var businessObject = event.context.row.businessObject;
    businessObject.$parent.rule.splice(
      businessObject.$parent.rule.indexOf(businessObject), 1);
  }

  function moveRow(event) {
    var source = event.context.source.businessObject;
    var target = event.context.target.businessObject;
    var rulesArray = source.$parent.rule;
    var targetIdx;

    // remove source from list
    var sourceIdx = rulesArray.indexOf(source);
    rulesArray.splice(sourceIdx, 1);

    if(event.type.indexOf('.executed') !== -1) {
      // add source at target position
      targetIdx = rulesArray.indexOf(target);
      rulesArray.splice(targetIdx + (event.context.above ? 0 : 1), 0, source);
    } else if (event.type.indexOf('.reverted') !== -1) {
      // add source at previousBelow
      var previousBelow = event.context.previousBelow.businessObject;
      if(previousBelow) {
        targetIdx = rulesArray.indexOf(previousBelow);
        rulesArray.splice(targetIdx, 0, source);
      } else {
        rulesArray.push(source);
      }
    }
  }

  function moveColumn(event) {
    var source = event.context.source.businessObject;
    var target = event.context.target.businessObject;
    var isInput = source.$type === 'dmn:InputClause';
    var targetIdx;

    var columns = source.$parent[isInput ? 'input' : 'output'];
    var rules = source.$parent.rule;

    // remove source from columns
    var sourceIdx = columns.indexOf(source);
    columns.splice(sourceIdx, 1);

    if(event.type.indexOf('.executed') !== -1) {
      // add source at target position
      targetIdx = columns.indexOf(target);
      columns.splice(targetIdx + !event.context.left, 0, source);

      // move all entries in the rules array
      forEach(rules, function(rule) {
        var array = rule[isInput ? 'inputEntry' : 'outputEntry'];

        var element = array.splice(sourceIdx, 1)[0];
        array.splice(targetIdx + !event.context.left, 0, element);
      });
    } else if (event.type.indexOf('.reverted') !== -1) {
      // add source at previousRight
      var previousRight = event.context.previousRight.businessObject;
      if(previousRight && previousRight.$type === source.$type) {
        targetIdx = columns.indexOf(previousRight);
        columns.splice(targetIdx, 0, source);
        forEach(rules, function(rule) {
          var array = rule[isInput ? 'inputEntry' : 'outputEntry'];

          var element = array.splice(sourceIdx, 1)[0];
          array.splice(targetIdx, 0, element);
        });
      } else {
        columns.push(source);
        forEach(rules, function(rule) {
          var array = rule[isInput ? 'inputEntry' : 'outputEntry'];

          var element = array.splice(sourceIdx, 1)[0];
          array.push(element);
        });
      }
    }

    eventBus.fire('column.move.applied');

  }

  this.executed([ 'column.create' ], setColumnParent);
  this.executed([ 'row.create' ], setParent);
  this.executed([ 'column.delete' ], unsetParent);
  this.executed([ 'row.delete' ], deleteRule);
  this.executed([ 'row.move' ], moveRow);
  this.executed([ 'column.move' ], moveColumn);

  this.reverted([ 'column.create' ], unsetParent);
  this.reverted([ 'row.create' ], deleteRule);
  this.reverted([ 'column.delete' ], setColumnParent);
  this.reverted([ 'row.delete' ], setParent);
  this.reverted([ 'row.move' ], moveRow);
  this.reverted([ 'column.move' ], moveColumn);
}

inherits(DmnUpdater, CommandInterceptor);

module.exports = DmnUpdater;

DmnUpdater.$inject = [ 'eventBus', 'moddle', 'elementRegistry', 'dmnFactory', 'tableName' ];

},{"51":51,"87":87,"96":96}],32:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(87);

var BaseModeling = _dereq_(238);

var EditCellHandler = _dereq_(34);
var ClearRowHandler = _dereq_(33);
var EditInputMappingHandler = _dereq_(37);
var EditIdHandler = _dereq_(36);
var EditTypeHandler = _dereq_(38);
var EditHitPolicyHandler = _dereq_(35);


/**
 * DMN modeling features activator
 *
 * @param {EventBus} eventBus
 * @param {ElementFactory} elementFactory
 * @param {CommandStack} commandStack
 */
function Modeling(eventBus, elementFactory, commandStack, sheet, elementRegistry) {
  BaseModeling.call(this, eventBus, elementFactory, commandStack, sheet);

  this._elementRegistry = elementRegistry;

  // TODO: move this to a subclass of editBehavior
  var self = this;
  eventBus.on('tableName.editId', function(event) {
    self.editId(event.newId);
  });

  eventBus.on('ioLabel.createColumn', function(event) {
    self.createColumn(event.newColumn);
  });

  eventBus.on('mappingsRow.editInputMapping', function(event) {
    self.editInputMapping(
      event.element,
      event.expression,
      event.language
    );
  });

  eventBus.on('typeRow.editDataType', function(event) {
    self.editDataType(
      event.element,
      event.dataType,
      event.allowedValues
    );
  });

  eventBus.on('hitPolicy.edit', function(event) {
    self.editHitPolicy(
      event.table,
      event.hitPolicy,
      event.aggregation,
      event.cell
    );
  });
}

inherits(Modeling, BaseModeling);

Modeling.$inject = [ 'eventBus', 'elementFactory', 'commandStack', 'sheet', 'elementRegistry' ];

module.exports = Modeling;


Modeling.prototype.getHandlers = function() {
  var handlers = BaseModeling.prototype.getHandlers.call(this);

  handlers['cell.edit'] = EditCellHandler;
  handlers['row.clear'] = ClearRowHandler;
  handlers['inputMapping.edit'] = EditInputMappingHandler;
  handlers['id.edit'] = EditIdHandler;
  handlers['dataType.edit'] = EditTypeHandler;
  handlers['hitPolicy.edit'] = EditHitPolicyHandler;

  return handlers;
};

Modeling.prototype.editCell = function(row, column, content) {

  var context = {
    row: row,
    column: column,
    content: content
  };

  var cell = this._elementRegistry.filter(function(element) {
      return element._type === 'cell' && element.row.id === row && element.column.id === column;
  })[0];

  if(cell.row.isClauseRow) {
    // change the clause label
    if(cell.column.businessObject.label !== content) {
      this._commandStack.execute('cell.edit', context);
    }
  } else if(cell.row.isMappingsRow) {
    if(cell.content.name !== content.trim()) {
      this._commandStack.execute('cell.edit', context);
    }
  } else if(!cell.row.isHead) {
    var previousContent = cell.content;
    if((!cell.column.isAnnotationsColumn && (!previousContent && context.content.trim() !== '') ||
       (previousContent && context.content.trim() !== previousContent.text)) ||
       (cell.column.isAnnotationsColumn && cell.row.businessObject.description !== context.content.trim())) {
      // only execute edit command if content changed
      this._commandStack.execute('cell.edit', context);
    }
  }

  return context;
};

Modeling.prototype.editHitPolicy = function(table, newPolicy, aggregation, cell) {
  var context = {
    table: table,
    newPolicy: newPolicy,
    newAggregation: aggregation,
    cell: cell
  };

  if(!context.newAggregation || context.newAggregation === 'LIST') {
    context.newAggregation = undefined;
  }

  if(table.hitPolicy !== newPolicy ||
    (!table.aggregation && context.newAggregation) ||
     table.aggregation !== context.newAggregation) {

    this._commandStack.execute('hitPolicy.edit', context);
  }

  return context;
};


Modeling.prototype.editInputMapping = function(cell, newMapping, language) {
  var context = {
    cell: cell,
    newMapping: newMapping
  };
  if(arguments.length === 3) {
    // if script is used
    context.language = language;
  }

  if(cell.content.text !== newMapping || cell.content.expressionLanguage !== language) {
    this._commandStack.execute('inputMapping.edit', context);
  }

  return context;
};

// allows editing of the table id
Modeling.prototype.editId = function(newId) {
  var context = {
    newId: newId
  };

  this._commandStack.execute('id.edit', context);

  return context;
};

Modeling.prototype.editDataType = function(cell, newType, allowedValues) {
  var context = {
    cell: cell,
    newType: newType
  };
  if(arguments.length === 3) {
    // when allowed values are provided
    context.allowedValues = allowedValues;
  }

  var allowedValuesChanged = false;

  // changed if the number of entries is different
  if(!cell.content.allowedValue && allowedValues ||
      cell.content.allowedValue && !allowedValues  ||
      cell.content.allowedValue && allowedValues && cell.content.allowedValue.length !== allowedValues.length) {
        allowedValuesChanged = true;
  } else

  // changed if at least one entry is different from before
  if(cell.content.allowedValue && allowedValues) {
    for(var i = 0; i < allowedValues.length; i++) {
      if(cell.content.allowedValue[i].text !== allowedValues[i]) {
        allowedValuesChanged = true;
        break;
      }
    }
  }


  if(cell.content.typeDefinition !== newType || allowedValuesChanged) {
    this._commandStack.execute('dataType.edit', context);
  }

  return context;
};

},{"238":238,"33":33,"34":34,"35":35,"36":36,"37":37,"38":38,"87":87}],33:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95);

/**
 * A handler that implements reversible clear of rows
 *
 * @param {sheet} sheet
 */
function ClearRowHandler(elementRegistry, utilityColumn, graphicsFactory) {
  this._elementRegistry = elementRegistry;
  this._utilityColumn = utilityColumn;
  this._graphicsFactory = graphicsFactory;
}

ClearRowHandler.$inject = [ 'elementRegistry', 'utilityColumn', 'graphicsFactory' ];

module.exports = ClearRowHandler;



////// api /////////////////////////////////////////


/**
 * Clear a row
 *
 * @param {Object} context
 */
ClearRowHandler.prototype.execute = function(context) {
  var self = this;
  var utilityColumn = this._utilityColumn && this._utilityColumn.getColumn();
  var cells = this._elementRegistry.filter(function(element) {
    if (utilityColumn) {
      return element._type === 'cell' && element.row === context.row && element.column !== utilityColumn;
    } else {
      return element._type === 'cell' && element.row === context.row;
    }
  });
  context._oldContent = [];
  forEach(cells, function(cell) {
    if(cell.content) {
      context._oldContent.push(cell.content.text);
      cell.content.text = '';
    }
    self._graphicsFactory.update('cell', cell, self._elementRegistry.getGraphics(cell.id));
  });
};


/**
 * Undo clear by resetting the content
 */
ClearRowHandler.prototype.revert = function(context) {
  var self = this;
  var utilityColumn = this._utilityColumn && this._utilityColumn.getColumn();
  var cells = this._elementRegistry.filter(function(element) {
    if (utilityColumn) {
      return element._type === 'cell' && element.row === context.row && element.column !== utilityColumn;
    } else {
      return element._type === 'cell' && element.row === context.row;
    }
  });
  var i = 0;
  forEach(cells, function(cell) {
    if(cell.content) {
      cell.content.text = context._oldContent[i++];
    }
    self._graphicsFactory.update('cell', cell, self._elementRegistry.getGraphics(cell.id));
  });
};

},{"95":95}],34:[function(_dereq_,module,exports){
'use strict';

var calculateSelectionUpdate = _dereq_(206);

function getSelection(node) {

  var selectObj = document.getSelection();
  if(selectObj.rangeCount > 0) {
    var range = selectObj.getRangeAt(0);

    return {
      start: range.startOffset,
      end: range.endOffset
    };
  }
  return {
    start: 0,
    end: 0
  };
}

function updateSelection(newSelection, gfx) {
  var range = document.createRange();
  var sel = document.getSelection();
  if(gfx.childNodes[0].firstChild) {
    range.setStart(gfx.childNodes[0].firstChild, newSelection.start);
    range.setEnd(gfx.childNodes[0].firstChild, newSelection.end);
  } else {
    range.setStart(gfx.childNodes[0], 0);
    range.setEnd(gfx.childNodes[0], 0);
  }

  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * A handler that implements reversible addition of rows.
 *
 * @param {sheet} sheet
 */
function EditCellHandler(sheet, elementRegistry, graphicsFactory, moddle, dmnFactory) {
  this._sheet = sheet;
  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;
  this._dmnFactory = dmnFactory;
  this._moddle = moddle;
}

EditCellHandler.$inject = [ 'sheet', 'elementRegistry', 'graphicsFactory', 'moddle', 'dmnFactory' ];

module.exports = EditCellHandler;



////// api /////////////////////////////////////////


/**
 * Edits the content of the cell
 *
 * @param {Object} context
 */
EditCellHandler.prototype.execute = function(context) {
  // get the business object
  var el = this._elementRegistry.get('cell_' + context.column + '_' + context.row);
  var gfx= this._elementRegistry.getGraphics('cell_' + context.column + '_' + context.row);
  if(el.row.isHead) {
    if(el.row.isMappingsRow) {
      // update the output name of the clause
      // (input expressions are handled by the popover, not the cell edit)
      context.oldContent = el.content.name;
      el.content.name = context.content;
    } else if(el.row.isClauseRow) {
      // update the clause names
      context.oldContent = el.column.businessObject.label;
      el.column.businessObject.label = context.content;
    }
  } else {

    if(el.column.isAnnotationsColumn) {
      // update the annotations of a rule
      context.oldContent = el.row.businessObject.description;
      el.row.businessObject.description = context.content;
    } else {
      // update a rule cell
      if(el.content) {
        context.oldContent = el.content.text;
        el.content.text = context.content;
      } else {
        // need to create a semantic object
        var inputOrOutput = el.column.businessObject.inputExpression ? 'createInputEntry' : 'createOutputEntry';
        el.content = this._dmnFactory[inputOrOutput](context.content, el.column.businessObject, el.row.businessObject);
      }
    }
  }

  var selection = getSelection();
  var newSelection = calculateSelectionUpdate(selection, gfx.textContent, context.content);
  this._graphicsFactory.update('cell', el, gfx);
  updateSelection(newSelection, gfx);

  return context;
};


/**
 * Undo Edit by resetting the content
 */
EditCellHandler.prototype.revert = function(context) {
  var el = this._elementRegistry.get('cell_' + context.column + '_' + context.row);
  var gfx= this._elementRegistry.getGraphics('cell_' + context.column + '_' + context.row);

  if(el.row.isHead) {
    if(el.row.isMappingsRow) {
      // revert the output name of the clause
      el.content.name = context.oldContent;
    } else if(el.row.isClauseRow) {
      // revert clause name
      el.column.businessObject.label = context.oldContent;
    }
  } else {
    if(el.column.isAnnotationsColumn) {
      // revert the annotations of a rule
      el.row.businessObject.description = context.oldContent;
    } else {
      // revert a rule cell
      if(!el.content) {
        var inputOrOutput = el.column.businessObject.inputExpression ? 'createInputEntry' : 'createOutputEntry',
            oldContent = context.oldContent;
        // could have been deleted
        el.content = this._dmnFactory[inputOrOutput](oldContent, el.column.businessObject, el.row.businessObject);
      } else {
        el.content.text = context.oldContent;
      }
    }
  }

  var selection = getSelection();
  var newSelection = calculateSelectionUpdate(selection, gfx.textContent, context.oldContent);
  this._graphicsFactory.update('cell', el, gfx);
  updateSelection(newSelection, gfx);

  return context;
};

},{"206":206}],35:[function(_dereq_,module,exports){
'use strict';

/**
 * A handler that implements reversible editing of the hit policy.
 */
function EditHitPolicyHandler(elementRegistry, graphicsFactory) {
  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;
}

EditHitPolicyHandler.$inject = [ 'elementRegistry', 'graphicsFactory' ];

module.exports = EditHitPolicyHandler;



////// api /////////////////////////////////////////


/**
 * Edits the hit policy
 *
 * @param {Object} context
 */
EditHitPolicyHandler.prototype.execute = function(context) {
  context.oldPolicy = context.table.hitPolicy;
  context.oldAggregation = context.table.aggregation;

  context.table.hitPolicy = context.newPolicy;

  if(context.newAggregation) {
    context.table.aggregation = context.newAggregation;
  } else {
    context.table.aggregation = undefined;
  }

  this._graphicsFactory.update('cell', context.cell, this._elementRegistry.getGraphics(context.cell.id));

  return context;
};


/**
 * Undo Edit by resetting the content
 */
EditHitPolicyHandler.prototype.revert = function(context) {
  context.table.hitPolicy = context.oldPolicy;
  if(context.oldAggregation) {
    context.table.aggregation = context.oldAggregation;
  } else {
    context.table.aggregation = undefined;
  }

  this._graphicsFactory.update('cell', context.cell, this._elementRegistry.getGraphics(context.cell.id));

  return context;
};

},{}],36:[function(_dereq_,module,exports){
'use strict';

/**
 * A handler that implements reversible editing of the table id.
 *
 * @param {tableName} tableName
 */
function EditIdHandler(tableName) {
  this._tableName = tableName;
}

EditIdHandler.$inject = [ 'tableName' ];

module.exports = EditIdHandler;



////// api /////////////////////////////////////////


/**
 * Edits the table id
 *
 * @param {Object} context
 */
EditIdHandler.prototype.execute = function(context) {
  context.oldId = this._tableName.getId();
  this._tableName.setId(context.newId);
  return context;
};


/**
 * Undo Edit by resetting the content
 */
EditIdHandler.prototype.revert = function(context) {
  this._tableName.setId(context.oldId);
  return context;
};

},{}],37:[function(_dereq_,module,exports){
'use strict';

/**
 * A handler that implements reversible addition of rows.
 *
 * @param {sheet} sheet
 */
function EditInputMappingHandler(elementRegistry, graphicsFactory) {
  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;
}

EditInputMappingHandler.$inject = ['elementRegistry', 'graphicsFactory' ];

module.exports = EditInputMappingHandler;



////// api /////////////////////////////////////////


/**
 * Edits the content of the cell
 *
 * @param {Object} context
 */
EditInputMappingHandler.prototype.execute = function(context) {

  context.oldMapping = context.cell.content.text;
  context.cell.content.text = context.newMapping;

  if(context.cell.content.expressionLanguage) {
    context.oldLanguage = context.cell.content.expressionLanguage;
  }

  if(typeof context.language !== 'undefined') {
    context.cell.content.expressionLanguage = context.language;
  } else {
    context.cell.content.expressionLanguage = undefined;
  }

  this._graphicsFactory.update('cell', context.cell, this._elementRegistry.getGraphics(context.cell.id));

  return context;
};


/**
 * Undo Edit by resetting the content
 */
EditInputMappingHandler.prototype.revert = function(context) {

  context.cell.content.text = context.oldMapping;

  if(context.oldLanguage) {
    context.cell.content.expressionLanguage = context.oldLanguage;
  } else {
    context.cell.content.expressionLanguage = undefined;
  }

  this._graphicsFactory.update('cell', context.cell, this._elementRegistry.getGraphics(context.cell.id));

  return context;
};

},{}],38:[function(_dereq_,module,exports){
'use strict';

/**
 * A handler that implements reversible editing of the datatype for a clause.
 *
 */
function EditTypeHandler(elementRegistry, graphicsFactory, dmnFactory) {
  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;
  this._dmnFactory = dmnFactory;
}

EditTypeHandler.$inject = [ 'elementRegistry', 'graphicsFactory', 'dmnFactory' ];

module.exports = EditTypeHandler;



////// api /////////////////////////////////////////


/**
 * Edits the dataType
 *
 * @param {Object} context
 */
EditTypeHandler.prototype.execute = function(context) {

  var cellContent = context.cell.content;

  if(cellContent.inputExpression) {
    context.oldType = cellContent.inputExpression.typeRef;
    cellContent.inputExpression.typeRef = context.newType;
  } else {
    context.oldType = cellContent.typeRef;
    cellContent.typeRef = context.newType;
  }

  this._graphicsFactory.update('cell', context.cell, this._elementRegistry.getGraphics(context.cell.id));

  return context;
};


/**
 * Undo Edit by resetting the content
 */
EditTypeHandler.prototype.revert = function(context) {

  var cellContent = context.cell.content;

  if(cellContent.inputExpression) {
    cellContent.inputExpression.typeRef = context.oldType;
  } else {
    cellContent.typeRef = context.oldType;
  }

  this._graphicsFactory.update('cell', context.cell, this._elementRegistry.getGraphics(context.cell.id));

  return context;
};

},{}],39:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'modeling', 'dmnUpdater' ],
  __depends__: [
    _dereq_(248),
    _dereq_(218),
    _dereq_(18)
  ],
  modeling: [ 'type', _dereq_(32) ],
  dmnUpdater: [ 'type', _dereq_(31) ],
};

},{"18":18,"218":218,"248":248,"31":31,"32":32}],40:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(193);

var inherits = _dereq_(87);

var BaseModule = _dereq_(254);
/**
 * Adds a header to the table containing the table name
 *
 * @param {EventBus} eventBus
 */
function TableName(eventBus, sheet, tableName) {

  BaseModule.call(this, eventBus, sheet, tableName);

  this.node = domify('<header><h3>'+this.tableName+'</h3><div class="tjs-table-id mappings"></div></header');

  var self = this;

  eventBus.on('tableName.allowEdit', function(event) {
    if(event.editAllowed) {
      self.node.querySelector('.tjs-table-id').setAttribute('contenteditable', true);

      self.node.querySelector('.tjs-table-id').addEventListener('blur', function(evt) {
        var newId = evt.target.textContent;
        if(newId !== self.getId()) {
          eventBus.fire('tableName.editId', {
            newId: newId
          });
        }
      }, true);
    }
  });

  this.semantic = null;
}

inherits(TableName, BaseModule);

TableName.$inject = [ 'eventBus', 'sheet', 'config.tableName' ];

module.exports = TableName;

TableName.prototype.setSemantic = function(semantic) {
  this.semantic = semantic;
  this.setName(semantic.name);
  this.setId(semantic.id);
};

TableName.prototype.setName = function(newName) {
  this.semantic.name = newName;
  this.node.querySelector('h3').textContent = newName || '';
};

TableName.prototype.getName = function() {
  return this.semantic.name;
};

TableName.prototype.setId = function(newId) {
  if(!!newId) {
    this.semantic.id = newId;
  }
  this.node.querySelector('div').textContent = this.semantic.id || '';
};

TableName.prototype.getId = function() {
  return this.semantic.id;
};

},{"193":193,"254":254,"87":87}],41:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'tableName' ],
  __depends__: [],
  tableName: [ 'type', _dereq_(40) ]
};

},{"40":40}],42:[function(_dereq_,module,exports){
'use strict';



var domify = _dereq_(193),
    domClasses = _dereq_(191),
    ComboBox = _dereq_(221);

/**
 * Adds a control to the table to define the datatypes for clauses
 */
function TypeRow(eventBus, sheet, elementRegistry, graphicsFactory, complexCell, rules) {

  this.row = null;

  var self = this;

  // add row when the sheet is initialized
  eventBus.on('sheet.init', function(event) {

    eventBus.fire('typeRow.add', event);

    self.row = sheet.addRow({
      id: 'typeRow',
      isHead: true,
      isTypeRow: true
    });

    eventBus.fire('typeRow.added', self.row);

    graphicsFactory.update('row', self.row, elementRegistry.getGraphics(self.row.id));
  });

  // remove the row when the sheet is destroyed
  eventBus.on('sheet.destroy', function(event) {

    eventBus.fire('typeRow.destroy', self.row);

    sheet.removeRow({
      id: 'typeRow'
    });

    eventBus.fire('typeRow.destroyed', self.row);
  });

  // when an input cell on the mappings row is added, setup the complex cell
  eventBus.on('cell.added', function(evt) {
    if(evt.element.row.id === 'typeRow' &&
       evt.element.column.businessObject) {

      evt.element.content = evt.element.column.businessObject;

      var template = domify("<div>\r\n</div>\r\n");

      // initializing the comboBox
      var comboBox = new ComboBox({
        label: 'Type',
        classNames: ['dmn-combobox', 'datatype'],
        options: ['string', 'boolean', 'integer', 'long', 'double', 'date'],
        dropdownClassNames: ['dmn-combobox-suggestions']
      });

      // add comboBox to the template
      template.insertBefore(
        comboBox.getNode(),
        template.firstChild
      );

      // set the complex property to initialize complex-cell behavior
      evt.element.complex = {
        className: 'dmn-clausevalues-setter',
        template: template,
        element: evt.element,
        comboBox: comboBox,
        type: 'type',
        offset: {
          x: 0,
          y: -15
        }
      };

      graphicsFactory.update('cell', evt.element, elementRegistry.getGraphics(evt.element));
    }
  });


  // whenever an type cell is opened, we have to position the template, because the x offset changes
  // over time, when columns are added and deleted
  eventBus.on('complexCell.open', function(evt) {
    if(evt.config.type === 'type') {
      var gfx = elementRegistry.getGraphics(evt.config.element);

      evt.container.style.left = window.parseInt(evt.container.style.left, 10) + gfx.clientWidth + 'px';

      // feed the values to the template and combobox
      var content = evt.config.element.content;
      if(content.inputExpression) {
        evt.config.comboBox.setValue(content.inputExpression.typeRef);
      } else {
        evt.config.comboBox.setValue(content.typeRef);
      }

      var template = evt.config.template;

      // disable all input fields if editing is not allowed
      if(!rules.allowed('dataType.edit')) {
        evt.config.comboBox.disable();

        // also set a disabled css class on the template
        domClasses(template.parentNode).add('read-only');
      }
    }
  });

  // whenever a datatype cell is closed, apply the changes to the underlying model
  eventBus.on('complexCell.close', function(evt) {
    if(evt.config.type === 'type') {
      if(evt.config.comboBox.getValue().toLowerCase() === 'string') {

        eventBus.fire('typeRow.editDataType', {
          element: evt.config.element,
          dataType: evt.config.comboBox.getValue()
        });

      } else {
        eventBus.fire('typeRow.editDataType', {
          element: evt.config.element,
          dataType: evt.config.comboBox.getValue()
        });

      }
    }
  });

}

TypeRow.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'graphicsFactory', 'complexCell', 'rules' ];

module.exports = TypeRow;

TypeRow.prototype.getRow = function() {
  return this.row;
};

},{"191":191,"193":193,"221":221}],43:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);

function TypeRowRenderer(
    eventBus,
    typeRow) {

  // row has class 'mappings'
  eventBus.on('row.render', function(event) {
    if (event.data === typeRow.getRow()) {
      domClasses(event.gfx).add('values');
    }
  });

  eventBus.on('cell.render', function(event) {

    var content = event.data.content;
    if (event.data.row === typeRow.getRow() && content) {
      if(content.inputExpression) {
        event.gfx.childNodes[0].textContent = content.inputExpression.typeRef || '';
      } else {
        event.gfx.childNodes[0].textContent = content.typeRef || '';
      }
    }
  });

}

TypeRowRenderer.$inject = [
  'eventBus',
  'typeRow'
];

module.exports = TypeRowRenderer;

},{"191":191}],44:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'typeRow', 'typeRowRenderer' ],
  __depends__: [ _dereq_(223) ],
  typeRow: [ 'type', _dereq_(42) ],
  typeRowRenderer: [ 'type', _dereq_(43) ]
};

},{"223":223,"42":42,"43":43}],45:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(182),
    union  = _dereq_(89);

var elementToString = _dereq_(48).elementToString;


function elementData(semantic, attrs) {
  return assign({
    id: semantic.id,
    type: semantic.$type,
    businessObject: semantic
  }, attrs);
}


/**
 * An importer that adds dmn elements to the sheet
 *
 * @param {EventBus} eventBus
 * @param {Sheet} sheet
 * @param {ElementFactory} elementFactory
 * @param {ElementRegistry} elementRegistry
 */
function DmnImporter(eventBus, sheet, elementRegistry, elementFactory, moddle, tableName, ioLabel, dmnFactory) {
  this._eventBus = eventBus;
  this._sheet = sheet;

  this._elementRegistry = elementRegistry;
  this._elementFactory = elementFactory;
  this._tableName = tableName;
  this._dmnFactory = dmnFactory;

  this._ioLabel = ioLabel;

  this._moddle = moddle;
}

DmnImporter.$inject = [
  'eventBus', 'sheet', 'elementRegistry',
  'elementFactory', 'moddle', 'tableName',
  'ioLabel', 'dmnFactory'
];

module.exports = DmnImporter;


DmnImporter.prototype._makeCopy = function(semantic) {
  var newSemantic = this._moddle.create(semantic.$type);

  for(var prop in semantic) {
    if(semantic.hasOwnProperty(prop) && prop !== '$type') {
      newSemantic[prop] = semantic[prop];
    }
  }
  newSemantic.$parent = semantic.$parent;

  return newSemantic;
};

/**
 * Add dmn element (semantic) to the sheet onto the
 * parent element.
 */
DmnImporter.prototype.add = function(semantic, parentElement, definitions) {

  var element;

  if (semantic.$instanceOf('dmn:DecisionTable')) {
    // Add the header row
    element = this._elementFactory.createRow(elementData(semantic, {
      isHead: true,
      isClauseRow: true,
      previous: this._ioLabel.getRow()
    }));
    this._sheet.addRow(element, parentElement);

    this._tableName.setSemantic(semantic.$parent);
  }

  // INPUT CLAUSE
  else if (semantic.$instanceOf('dmn:InputClause')) {
    element = this._elementFactory.createColumn(elementData(semantic, {

    }));
    this._sheet.addColumn(element, parentElement);
  }
  // OUTPUT CLAUSE
  else if (semantic.$instanceOf('dmn:OutputClause')) {
    element = this._elementFactory.createColumn(elementData(semantic, {

    }));
    this._sheet.addColumn(element, parentElement);
  }

  // RULE
  else if (semantic.$instanceOf('dmn:DecisionRule')) {
    if(!semantic.inputEntry) {
      semantic.inputEntry = [];
    }
    if(!semantic.outputEntry) {
      semantic.outputEntry = [];
    }
    element = this._elementFactory.createRow(elementData(semantic, {

    }));
    this._sheet.addRow(element, parentElement);

  }

  // CELL
  else if (parentElement.$instanceOf('dmn:DecisionRule')) {

    // we have to find out the column of this cell. This can be done by getting the index of the
    // cell and then using the clause at this index
    var allCellsInRow = union(parentElement.inputEntry, parentElement.outputEntry);

    var allClauses = this._elementRegistry.filter(function(element) {
      if(!element.businessObject) {
        return false;
      }
      var type = element.businessObject.$type;
      return type === 'dmn:InputClause' || type === 'dmn:OutputClause';
    });

    var column = allClauses[allCellsInRow.indexOf(semantic)].id;

    var row = this._elementRegistry.filter(function(ea) {
      return ea.businessObject === parentElement;
    })[0].id;

    semantic.text = semantic.text || '';

    this._sheet.setCellContent({
      row: row,
      column: column,
      content: semantic
    });

  } else {
    throw new Error('can not render element ' + elementToString(semantic));
  }

  this._eventBus.fire('dmnElement.added', { element: element });

  return element;
};

},{"182":182,"48":48,"89":89}],46:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95);

var elementToString = _dereq_(48).elementToString;

function DmnTreeWalker(handler) {

  function visit(element, ctx, definitions) {

    var gfx = element.gfx;

    // avoid multiple rendering of elements
    if (gfx) {
      throw new Error('already rendered ' + elementToString(element));
    }

    // call handler
    return handler.element(element, ctx, definitions);
  }

  function visitTable(element) {
    return handler.table(element);
  }

  ////// Semantic handling //////////////////////

  function handleDefinitions(definitions) {
    // make sure we walk the correct bpmnElement

    var decisions = definitions.decision,
        decision;

    if (decisions && decisions.length) {
      decision = decisions[0];
    }

    // no decision -> nothing to import
    if (!decision) {
      return;
    }

    if(decision.id === '') {
      decision.id = 'decision';
    }

    var table = decision.decisionTable;


    // no decision table -> nothing to import
    if(!table) {
      throw new Error('no table for ' + elementToString(decision));
    }

    var ctx = visitTable(table);

    handleClauses(table.input, ctx, definitions);
    handleClauses(table.output, ctx, definitions);

    handleRules(table.rule, ctx, definitions);

  }

  function handleClauses(inputs, context, definitions) {
    forEach(inputs, function(e) {
      visit(e, context, definitions);
    });
  }

  function handleRules(rules, context, definitions) {
    forEach(rules, function(e) {
      visit(e, context, definitions);

      handleEntry(e.inputEntry, e);

      handleEntry(e.outputEntry, e);
    });
  }

  function handleEntry(entry, context, definitions) {
    forEach(entry, function(e) {
      visit(e, context, definitions);
    });
  }

  ///// API ////////////////////////////////

  return {
    handleDefinitions: handleDefinitions
  };
}

module.exports = DmnTreeWalker;

},{"48":48,"95":95}],47:[function(_dereq_,module,exports){
'use strict';

var DmnTreeWalker = _dereq_(46);


/**
 * Import the definitions into a table.
 *
 * Errors and warnings are reported through the specified callback.
 *
 * @param  {Sheet} sheet
 * @param  {ModdleElement} definitions
 * @param  {Function} done the callback, invoked with (err, [ warning ]) once the import is done
 */
function importDmnTable(sheet, definitions, done) {

  var importer = sheet.get('dmnImporter'),
      eventBus = sheet.get('eventBus');

  var error,
      warnings = [];

  function parse(definitions) {

    var visitor = {

      table: function(element) {
        return importer.add(element);
      },

      element: function(element, parentShape, definitions) {
        return importer.add(element, parentShape, definitions);
      },

      error: function(message, context) {
        warnings.push({ message: message, context: context });
      }
    };

    var walker = new DmnTreeWalker(visitor);

    // import
    walker.handleDefinitions(definitions);
  }

  eventBus.fire('import.start');

  try {
    parse(definitions);
  } catch (e) {
    error = e;
  }

  eventBus.fire(error ? 'import.error' : 'import.success', { error: error, warnings: warnings });
  done(error, warnings);
}

module.exports.importDmnTable = importDmnTable;

},{"46":46}],48:[function(_dereq_,module,exports){
'use strict';

module.exports.elementToString = function(e) {
  if (!e) {
    return '<null>';
  }

  return '<' + e.$type + (e.id ? ' id="' + e.id : '') + '" />';
};
},{}],49:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(18)
  ],
  dmnImporter: [ 'type', _dereq_(45) ]
};

},{"18":18,"45":45}],50:[function(_dereq_,module,exports){
'use strict';


/**
 * Get the correct active entries for the Context Menu
 *
 * @param  {Object} Context - Selected cell
 * @return {Object} {rule, input, output} = Boolean
 */
function getEntriesType(context) {
  var entriesType = {
    rule: false,
    input: false,
    output: false
  };

  if (!context) {
    return entriesType;
  }

  entriesType.rule = !!(context.row && context.row.businessObject &&
         !context.row.businessObject.$instanceOf('dmn:DecisionTable') &&
          context.column.id !== 'utilityColumn');

  if (context.column &&
      context.column.id !== 'utilityColumn' &&
      context.column.id !== 'annotations' &&
      context.row.id !== 'mappingsRow' &&
      context.row.id !== 'typeRow' &&
     !context.row.isLabelRow) {
    if (context.column.businessObject.inputExpression) {
      entriesType.input = true;
    } else {
      entriesType.output = true;
    }
  }

  return entriesType;
}

module.exports.getEntriesType = getEntriesType;

},{}],51:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95),
    isFunction = _dereq_(176),
    isArray = _dereq_(175),
    isNumber = _dereq_(178);


var DEFAULT_PRIORITY = 1000;


/**
 * A utility that can be used to plug-in into the command execution for
 * extension and/or validation.
 *
 * @param {EventBus} eventBus
 *
 * @example
 *
 * var inherits = require('inherits');
 *
 * var CommandInterceptor = require('diagram-js/lib/command/CommandInterceptor');
 *
 * function CommandLogger(eventBus) {
 *   CommandInterceptor.call(this, eventBus);
 *
 *   this.preExecute(function(event) {
 *     console.log('command pre-execute', event);
 *   });
 * }
 *
 * inherits(CommandLogger, CommandInterceptor);
 *
 */
function CommandInterceptor(eventBus) {
  this._eventBus = eventBus;
}

CommandInterceptor.$inject = [ 'eventBus' ];

module.exports = CommandInterceptor;

function unwrapEvent(fn) {
  return function(event) {
    return fn(event.context, event.command, event);
  };
}

/**
 * Register an interceptor for a command execution
 *
 * @param {String|Array<String>} [events] list of commands to register on
 * @param {String} [hook] command hook, i.e. preExecute, executed to listen on
 * @param {Number} [priority] the priority on which to hook into the execution
 * @param {Function} handlerFn interceptor to be invoked with (event)
 * @param {Boolean} unwrap if true, unwrap the event and pass (context, command, event) to the
 *                          listener instead
 */
CommandInterceptor.prototype.on = function(events, hook, priority, handlerFn, unwrap) {

  if (isFunction(hook) || isNumber(hook)) {
    unwrap = handlerFn;
    handlerFn = priority;
    priority = hook;
    hook = null;
  }

  if (isFunction(priority)) {
    unwrap = handlerFn;
    handlerFn = priority;
    priority = DEFAULT_PRIORITY;
  }

  if (!isFunction(handlerFn)) {
    throw new Error('handlerFn must be a function');
  }

  if (!isArray(events)) {
    events = [ events ];
  }

  var eventBus = this._eventBus;

  forEach(events, function(event) {
    // concat commandStack(.event)?(.hook)?
    var fullEvent = [ 'commandStack', event, hook ].filter(function(e) { return e; }).join('.');

    eventBus.on(fullEvent, priority, unwrap ? unwrapEvent(handlerFn) : handlerFn);
  });
};


var hooks = [
  'canExecute',
  'preExecute',
  'preExecuted',
  'execute',
  'executed',
  'postExecute',
  'postExecuted',
  'revert',
  'reverted'
];

/*
 * Install hook shortcuts
 *
 * This will generate the CommandInterceptor#(preExecute|...|reverted) methods
 * which will in term forward to CommandInterceptor#on.
 */
forEach(hooks, function(hook) {

  /**
   * {canExecute|preExecute|preExecuted|execute|executed|postExecute|postExecuted|revert|reverted}
   *
   * A named hook for plugging into the command execution
   *
   * @param {String|Array<String>} [events] list of commands to register on
   * @param {Number} [priority] the priority on which to hook into the execution
   * @param {Function} handlerFn interceptor to be invoked with (event)
   * @param {Boolean} [unwrap=false] if true, unwrap the event and pass (context, command, event) to the
   *                          listener instead
   */
  CommandInterceptor.prototype[hook] = function(events, priority, handlerFn, unwrap) {

    if (isFunction(events) || isNumber(events)) {
      unwrap = handlerFn;
      handlerFn = priority;
      priority = events;
      events = null;
    }

    this.on(events, hook, priority, handlerFn, unwrap);
  };
});
},{"175":175,"176":176,"178":178,"95":95}],52:[function(_dereq_,module,exports){
'use strict';

var unique = _dereq_(91),
    isArray = _dereq_(175),
    assign = _dereq_(182);

var InternalEvent = _dereq_(54).Event;


/**
 * A service that offers un- and redoable execution of commands.
 *
 * The command stack is responsible for executing modeling actions
 * in a un- and redoable manner. To do this it delegates the actual
 * command execution to {@link CommandHandler}s.
 *
 * Command handlers provide {@link CommandHandler#execute(ctx)} and
 * {@link CommandHandler#revert(ctx)} methods to un- and redo a command
 * identified by a command context.
 *
 *
 * ## Life-Cycle events
 *
 * In the process the command stack fires a number of life-cycle events
 * that other components to participate in the command execution.
 *
 *    * preExecute
 *    * preExecuted
 *    * execute
 *    * executed
 *    * postExecute
 *    * postExecuted
 *    * revert
 *    * reverted
 *
 * A special event is used for validating, whether a command can be
 * performed prior to its execution.
 *
 *    * canExecute
 *
 * Each of the events is fired as `commandStack.{eventName}` and
 * `commandStack.{commandName}.{eventName}`, respectively. This gives
 * components fine grained control on where to hook into.
 *
 * The event object fired transports `command`, the name of the
 * command and `context`, the command context.
 *
 *
 * ## Creating Command Handlers
 *
 * Command handlers should provide the {@link CommandHandler#execute(ctx)}
 * and {@link CommandHandler#revert(ctx)} methods to implement
 * redoing and undoing of a command. They must ensure undo is performed
 * properly in order not to break the undo chain.
 *
 * Command handlers may execute other modeling operations (and thus
 * commands) in their `preExecute` and `postExecute` phases. The command
 * stack will properly group all commands together into a logical unit
 * that may be re- and undone atomically.
 *
 * Command handlers must not execute other commands from within their
 * core implementation (`execute`, `revert`).
 *
 *
 * ## Change Tracking
 *
 * During the execution of the CommandStack it will keep track of all
 * elements that have been touched during the command's execution.
 *
 * At the end of the CommandStack execution it will notify interested
 * components via an 'elements.changed' event with all the dirty
 * elements.
 *
 * The event can be picked up by components that are interested in the fact
 * that elements have been changed. One use case for this is updating
 * their graphical representation after moving / resizing or deletion.
 *
 *
 * @param {EventBus} eventBus
 * @param {Injector} injector
 */
function CommandStack(eventBus, injector) {

  /**
   * A map of all registered command handlers.
   *
   * @type {Object}
   */
  this._handlerMap = {};

  /**
   * A stack containing all re/undoable actions on the diagram
   *
   * @type {Array<Object>}
   */
  this._stack = [];

  /**
   * The current index on the stack
   *
   * @type {Number}
   */
  this._stackIdx = -1;

  /**
   * Current active commandStack execution
   *
   * @type {Object}
   */
  this._currentExecution = {
    actions: [],
    dirty: []
  };


  this._injector = injector;
  this._eventBus = eventBus;

  this._uid = 1;
}

CommandStack.$inject = [ 'eventBus', 'injector' ];

module.exports = CommandStack;


/**
 * Execute a command
 *
 * @param {String} command the command to execute
 * @param {Object} context the environment to execute the command in
 */
CommandStack.prototype.execute = function(command, context) {
  if (!command) {
    throw new Error('command required');
  }

  var action = { command: command, context: context };

  this._pushAction(action);
  this._internalExecute(action);
  this._popAction(action);
};


/**
 * Ask whether a given command can be executed.
 *
 * Implementors may hook into the mechanism on two ways:
 *
 *   * in event listeners:
 *
 *     Users may prevent the execution via an event listener.
 *     It must prevent the default action for `commandStack.(<command>.)canExecute` events.
 *
 *   * in command handlers:
 *
 *     If the method {@link CommandHandler#canExecute} is implemented in a handler
 *     it will be called to figure out whether the execution is allowed.
 *
 * @param  {String} command the command to execute
 * @param  {Object} context the environment to execute the command in
 *
 * @return {Boolean} true if the command can be executed
 */
CommandStack.prototype.canExecute = function(command, context) {

  var action = { command: command, context: context };

  var handler = this._getHandler(command);

  if (!handler) {
    return false;
  }

  var result = this._fire(command, 'canExecute', action);

  // handler#canExecute will only be called if no listener
  // decided on a result already
  if (result === undefined && handler.canExecute) {
    result = handler.canExecute(context);
  }

  return result;
};


/**
 * Clear the command stack, erasing all undo / redo history
 */
CommandStack.prototype.clear = function() {
  this._stack.length = 0;
  this._stackIdx = -1;

  this._fire('changed');
};


/**
 * Undo last command(s)
 */
CommandStack.prototype.undo = function() {
  var action = this._getUndoAction(),
      next;

  if (action) {
    this._pushAction(action);

    while (action) {
      this._internalUndo(action);
      next = this._getUndoAction();

      if (!next || next.id !== action.id) {
        break;
      }

      action = next;
    }

    this._popAction();
  }
};


/**
 * Redo last command(s)
 */
CommandStack.prototype.redo = function() {
  var action = this._getRedoAction(),
      next;

  if (action) {
    this._pushAction(action);

    while (action) {
      this._internalExecute(action, true);
      next = this._getRedoAction();

      if (!next || next.id !== action.id) {
        break;
      }

      action = next;
    }

    this._popAction();
  }
};


/**
 * Register a handler instance with the command stack
 *
 * @param {String} command
 * @param {CommandHandler} handler
 */
CommandStack.prototype.register = function(command, handler) {
  this._setHandler(command, handler);
};


/**
 * Register a handler type with the command stack
 * by instantiating it and injecting its dependencies.
 *
 * @param {String} command
 * @param {Function} a constructor for a {@link CommandHandler}
 */
CommandStack.prototype.registerHandler = function(command, handlerCls) {

  if (!command || !handlerCls) {
    throw new Error('command and handlerCls must be defined');
  }

  var handler = this._injector.instantiate(handlerCls);
  this.register(command, handler);
};

CommandStack.prototype.canUndo = function() {
  return !!this._getUndoAction();
};

CommandStack.prototype.canRedo = function() {
  return !!this._getRedoAction();
};

////// stack access  //////////////////////////////////////

CommandStack.prototype._getRedoAction = function() {
  return this._stack[this._stackIdx + 1];
};


CommandStack.prototype._getUndoAction = function() {
  return this._stack[this._stackIdx];
};


////// internal functionality /////////////////////////////

CommandStack.prototype._internalUndo = function(action) {
  var command = action.command,
      context = action.context;

  var handler = this._getHandler(command);

  this._fire(command, 'revert', action);

  this._markDirty(handler.revert(context));

  this._revertedAction(action);

  this._fire(command, 'reverted', action);
};


CommandStack.prototype._fire = function(command, qualifier, event) {
  if (arguments.length < 3) {
    event = qualifier;
    qualifier = null;
  }

  var names = qualifier ? [ command + '.' + qualifier, qualifier ] : [ command ],
      i, name, result;

  event = assign(new InternalEvent(), event);

  for (i = 0; !!(name = names[i]); i++) {
    result = this._eventBus.fire('commandStack.' + name, event);

    if (event.cancelBubble) {
      break;
    }
  }

  return result;
};

CommandStack.prototype._createId = function() {
  return this._uid++;
};


CommandStack.prototype._internalExecute = function(action, redo) {
  var command = action.command,
      context = action.context;

  var handler = this._getHandler(command);

  if (!handler) {
    throw new Error('no command handler registered for <' + command + '>');
  }

  this._pushAction(action);

  if (!redo) {
    this._fire(command, 'preExecute', action);

    if (handler.preExecute) {
      handler.preExecute(context);
    }

    this._fire(command, 'preExecuted', action);
  }

  this._fire(command, 'execute', action);

  // execute
  this._markDirty(handler.execute(context));

  // log to stack
  this._executedAction(action, redo);

  this._fire(command, 'executed', action);

  if (!redo) {
    this._fire(command, 'postExecute', action);

    if (handler.postExecute) {
      handler.postExecute(context);
    }

    this._fire(command, 'postExecuted', action);
  }

  this._popAction(action);
};


CommandStack.prototype._pushAction = function(action) {

  var execution = this._currentExecution,
      actions = execution.actions;

  var baseAction = actions[0];

  if (!action.id) {
    action.id = (baseAction && baseAction.id) || this._createId();
  }

  actions.push(action);
};


CommandStack.prototype._popAction = function() {
  var execution = this._currentExecution,
      actions = execution.actions,
      dirty = execution.dirty;

  actions.pop();

  if (!actions.length) {
    this._eventBus.fire('elements.changed', { elements: unique(dirty) });

    dirty.length = 0;

    this._fire('changed');
  }
};


CommandStack.prototype._markDirty = function(elements) {
  var execution = this._currentExecution;

  if (!elements) {
    return;
  }

  elements = isArray(elements) ? elements : [ elements ];

  execution.dirty = execution.dirty.concat(elements);
};


CommandStack.prototype._executedAction = function(action, redo) {
  var stackIdx = ++this._stackIdx;

  if (!redo) {
    this._stack.splice(stackIdx, this._stack.length, action);
  }
};


CommandStack.prototype._revertedAction = function(action) {
  this._stackIdx--;
};


CommandStack.prototype._getHandler = function(command) {
  return this._handlerMap[command];
};

CommandStack.prototype._setHandler = function(command, handler) {
  if (!command || !handler) {
    throw new Error('command and handler required');
  }

  if (this._handlerMap[command]) {
    throw new Error('overriding handler for command <' + command + '>');
  }

  this._handlerMap[command] = handler;
};

},{"175":175,"182":182,"54":54,"91":91}],53:[function(_dereq_,module,exports){
module.exports = {
  commandStack: [ 'type', _dereq_(52) ]
};

},{"52":52}],54:[function(_dereq_,module,exports){
'use strict';

var isFunction = _dereq_(176),
    isArray = _dereq_(175),
    isNumber = _dereq_(178),
    assign = _dereq_(182);

var DEFAULT_PRIORITY = 1000;


/**
 * A general purpose event bus.
 *
 * This component is used to communicate across a diagram instance.
 * Other parts of a diagram can use it to listen to and broadcast events.
 *
 *
 * ## Registering for Events
 *
 * The event bus provides the {@link EventBus#on} and {@link EventBus#once}
 * methods to register for events. {@link EventBus#off} can be used to
 * remove event registrations. Listeners receive an instance of {@link Event}
 * as the first argument. It allows them to hook into the event execution.
 *
 * ```javascript
 *
 * // listen for event
 * eventBus.on('foo', function(event) {
 *
 *   // access event type
 *   event.type; // 'foo'
 *
 *   // stop propagation to other listeners
 *   event.stopPropagation();
 *
 *   // prevent event default
 *   event.preventDefault();
 * });
 *
 * // listen for event with custom payload
 * eventBus.on('bar', function(event, payload) {
 *   console.log(payload);
 * });
 *
 * // listen for event returning value
 * eventBus.on('foobar', function(event) {
 *
 *   // stop event propagation + prevent default
 *   return false;
 *
 *   // stop event propagation + return custom result
 *   return {
 *     complex: 'listening result'
 *   };
 * });
 *
 *
 * // listen with custom priority (default=1000, higher is better)
 * eventBus.on('priorityfoo', 1500, function(event) {
 *   console.log('invoked first!');
 * });
 * ```
 *
 *
 * ## Emitting Events
 *
 * Events can be emitted via the event bus using {@link EventBus#fire}.
 *
 * ```javascript
 *
 * // false indicates that the default action
 * // was prevented by listeners
 * if (eventBus.fire('foo') === false) {
 *   console.log('default has been prevented!');
 * };
 *
 *
 * // custom args + return value listener
 * eventBus.on('sum', function(event, a, b) {
 *   return a + b;
 * });
 *
 * // you can pass custom arguments + retrieve result values.
 * var sum = eventBus.fire('sum', 1, 2);
 * console.log(sum); // 3
 * ```
 */
function EventBus() {
  this._listeners = {};

  // cleanup on destroy

  var self = this;

  // destroy on lowest priority to allow
  // message passing until the bitter end
  this.on('diagram.destroy', 1, function() {
    self._listeners = null;
  });
}

module.exports = EventBus;


/**
 * Register an event listener for events with the given name.
 *
 * The callback will be invoked with `event, ...additionalArguments`
 * that have been passed to {@link EventBus#fire}.
 *
 * Returning false from a listener will prevent the events default action
 * (if any is specified). To stop an event from being processed further in
 * other listeners execute {@link Event#stopPropagation}.
 *
 * Returning anything but `undefined` from a listener will stop the listener propagation.
 *
 * @param {String|Array<String>} events
 * @param {Number} [priority=1000] the priority in which this listener is called, larger is higher
 * @param {Function} callback
 */
EventBus.prototype.on = function(events, priority, callback) {

  events = isArray(events) ? events : [ events ];

  if (isFunction(priority)) {
    callback = priority;
    priority = DEFAULT_PRIORITY;
  }

  if (!isNumber(priority)) {
    throw new Error('priority must be a number');
  }

  var self = this,
      listener = { priority: priority, callback: callback };

  events.forEach(function(e) {
    self._addListener(e, listener);
  });
};


/**
 * Register an event listener that is executed only once.
 *
 * @param {String} event the event name to register for
 * @param {Function} callback the callback to execute
 */
EventBus.prototype.once = function(event, callback) {

  var self = this;

  function wrappedCallback() {
    callback.apply(self, arguments);
    self.off(event, wrappedCallback);
  }

  this.on(event, wrappedCallback);
};


/**
 * Removes event listeners by event and callback.
 *
 * If no callback is given, all listeners for a given event name are being removed.
 *
 * @param {String} event
 * @param {Function} [callback]
 */
EventBus.prototype.off = function(event, callback) {
  var listeners = this._getListeners(event),
      listener, idx;

  if (callback) {

    // move through listeners from back to front
    // and remove matching listeners
    for (idx = listeners.length - 1; !!(listener = listeners[idx]); idx--) {
      if (listener.callback === callback) {
        listeners.splice(idx, 1);
      }
    }
  } else {
    // clear listeners
    listeners.length = 0;
  }
};


/**
 * Fires a named event.
 *
 * @example
 *
 * // fire event by name
 * events.fire('foo');
 *
 * // fire event object with nested type
 * var event = { type: 'foo' };
 * events.fire(event);
 *
 * // fire event with explicit type
 * var event = { x: 10, y: 20 };
 * events.fire('element.moved', event);
 *
 * // pass additional arguments to the event
 * events.on('foo', function(event, bar) {
 *   alert(bar);
 * });
 *
 * events.fire({ type: 'foo' }, 'I am bar!');
 *
 * @param {String} [name] the optional event name
 * @param {Object} [event] the event object
 * @param {...Object} additional arguments to be passed to the callback functions
 *
 * @return {Boolean} the events return value, if specified or false if the
 *                   default action was prevented by listeners
 */
EventBus.prototype.fire = function(type, data) {

  var event,
      originalType,
      listeners, idx, listener,
      returnValue,
      args;

  args = Array.prototype.slice.call(arguments);

  if (typeof type === 'object') {
    event = type;
    type = event.type;
  }

  if (!type) {
    throw new Error('no event type specified');
  }

  listeners = this._listeners[type];

  if (!listeners) {
    return;
  }

  // we make sure we fire instances of our home made
  // events here. We wrap them only once, though
  if (data instanceof Event) {
    // we are fine, we alread have an event
    event = data;
  } else {
    event = new Event();
    event.init(data);
  }

  // ensure we pass the event as the first parameter
  args[0] = event;

  // original event type (in case we delegate)
  originalType = event.type;

  try {

    // update event type before delegation
    if (type !== originalType) {
      event.type = type;
    }

    for (idx = 0; !!(listener = listeners[idx]); idx++) {

      // handle stopped propagation
      if (event.cancelBubble) {
        break;
      }

      try {
        // returning false prevents the default action
        returnValue = event.returnValue = listener.callback.apply(null, args);

        // stop propagation on return value
        if (returnValue !== undefined) {
          event.stopPropagation();
        }

        // prevent default on return false
        if (returnValue === false) {
          event.preventDefault();
        }
      } catch (e) {
        if (!this.handleError(e)) {
          console.error('unhandled error in event listener');
          console.error(e.stack);

          throw e;
        }
      }
    }
  } finally {
    // reset event type after delegation
    if (type !== originalType) {
      event.type = originalType;
    }
  }

  // set the return value to false if the event default
  // got prevented and no other return value exists
  if (returnValue === undefined && event.defaultPrevented) {
    returnValue = false;
  }

  return returnValue;
};


EventBus.prototype.handleError = function(error) {
  return this.fire('error', { error: error }) === false;
};


/*
 * Add new listener with a certain priority to the list
 * of listeners (for the given event).
 *
 * The semantics of listener registration / listener execution are
 * first register, first serve: New listeners will always be inserted
 * after existing listeners with the same priority.
 *
 * Example: Inserting two listeners with priority 1000 and 1300
 *
 *    * before: [ 1500, 1500, 1000, 1000 ]
 *    * after: [ 1500, 1500, (new=1300), 1000, 1000, (new=1000) ]
 *
 * @param {String} event
 * @param {Object} listener { priority, callback }
 */
EventBus.prototype._addListener = function(event, newListener) {

  var listeners = this._getListeners(event),
      existingListener,
      idx;

  // ensure we order listeners by priority from
  // 0 (high) to n > 0 (low)
  for (idx = 0; !!(existingListener = listeners[idx]); idx++) {
    if (existingListener.priority < newListener.priority) {

      // prepend newListener at before existingListener
      listeners.splice(idx, 0, newListener);
      return;
    }
  }

  listeners.push(newListener);
};


EventBus.prototype._getListeners = function(name) {
  var listeners = this._listeners[name];

  if (!listeners) {
    this._listeners[name] = listeners = [];
  }

  return listeners;
};


/**
 * A event that is emitted via the event bus.
 */
function Event() { }

module.exports.Event = Event;

Event.prototype.stopPropagation = function() {
  this.cancelBubble = true;
};

Event.prototype.preventDefault = function() {
  this.defaultPrevented = true;
};

Event.prototype.init = function(data) {
  assign(this, data || {});
};

},{"175":175,"176":176,"178":178,"182":182}],55:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(87);

var CommandInterceptor = _dereq_(51);

/**
 * A basic provider that may be extended to implement modeling rules.
 *
 * Extensions should implement the init method to actually add their custom
 * modeling checks. Checks may be added via the #addRule(action, fn) method.
 *
 * @param {EventBus} eventBus
 */
function RuleProvider(eventBus) {
  CommandInterceptor.call(this, eventBus);

  this.init();
}

RuleProvider.$inject = [ 'eventBus' ];

inherits(RuleProvider, CommandInterceptor);

module.exports = RuleProvider;


/**
 * Adds a modeling rule for the given action, implemented through a callback function.
 *
 * The function will receive the modeling specific action context to perform its check.
 * It must return false or null to disallow the action from happening.
 *
 * Returning <code>null</code> may encode simply ignoring the action.
 *
 * @example
 *
 * ResizableRules.prototype.init = function() {
 *
 *   this.addRule('shape.resize', function(context) {
 *
 *     var shape = context.shape;
 *
 *     if (!context.newBounds) {
 *       // check general resizability
 *       if (!shape.resizable) {
 *         return false;
 *       }
 *     } else {
 *       // element must have minimum size of 10*10 points
 *       return context.newBounds.width > 10 && context.newBounds.height > 10;
 *     }
 *   });
 * };
 *
 * @param {String|Array<String>} actions the identifier for the modeling action to check
 * @param {Number} [priority] the priority at which this rule is being applied
 * @param {Function} fn the callback function that performs the actual check
 */
RuleProvider.prototype.addRule = function(actions, priority, fn) {

  var self = this;

  if (typeof actions === 'string') {
    actions = [ actions ];
  }

  actions.forEach(function(action) {

    self.canExecute(action, priority, function(context, action, event) {
      return fn(context);
    }, true);
  });
};
},{"51":51,"87":87}],56:[function(_dereq_,module,exports){
'use strict';

/**
 * A service that provides rules for certain diagram actions.
 *
 * @param {CommandStack} commandStack
 */
function Rules(commandStack) {
  this._commandStack = commandStack;
}

Rules.$inject = [ 'commandStack' ];

module.exports = Rules;


/**
 * This method can be queried to ask whether certain modeling actions
 * are allowed or not.
 *
 * @param  {String} action the action to be checked
 * @param  {Object} [context] the context to check the action in
 *
 * @return {Boolean} returns true, false or null depending on whether the
 *                   operation is allowed, not allowed or should be ignored.
 */
Rules.prototype.allowed = function(action, context) {
  var allowed = this._commandStack.canExecute(action, context);

  // map undefined to true, i.e. no rules
  return allowed === undefined ? true : allowed;
};
},{}],57:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [ _dereq_(53) ],
  __init__: [ 'rules' ],
  rules: [ 'type', _dereq_(56) ]
};

},{"53":53,"56":56}],58:[function(_dereq_,module,exports){
'use strict';

function __preventDefault(event) {
  return event && event.preventDefault();
}

function __stopPropagation(event, immediate) {
  if (!event) {
    return;
  }

  if (event.stopPropagation) {
    event.stopPropagation();
  }

  if (immediate && event.stopImmediatePropagation) {
    event.stopImmediatePropagation();
  }
}


function getOriginal(event) {
  return event.originalEvent || event.srcEvent;
}

module.exports.getOriginal = getOriginal;


function stopEvent(event, immediate) {
  stopPropagation(event, immediate);
  preventDefault(event);
}

module.exports.stopEvent = stopEvent;


function preventDefault(event) {
  __preventDefault(event);
  __preventDefault(getOriginal(event));
}

module.exports.preventDefault = preventDefault;


function stopPropagation(event, immediate) {
  __stopPropagation(event, immediate);
  __stopPropagation(getOriginal(event), immediate);
}

module.exports.stopPropagation = stopPropagation;


function toPoint(event) {

  if (event.pointers && event.pointers.length) {
    event = event.pointers[0];
  }

  if (event.touches && event.touches.length) {
    event = event.touches[0];
  }

  return event ? {
    x: event.clientX,
    y: event.clientY
  } : null;
}

module.exports.toPoint = toPoint;

},{}],59:[function(_dereq_,module,exports){
'use strict';

/**
 * Util that provides unique IDs.
 *
 * @class djs.util.IdGenerator
 * @constructor
 * @memberOf djs.util
 *
 * The ids can be customized via a given prefix and contain a random value to avoid collisions.
 *
 * @param {String} prefix a prefix to prepend to generated ids (for better readability)
 */
function IdGenerator(prefix) {

  this._counter = 0;
  this._prefix = (prefix ? prefix + '-' : '') + Math.floor(Math.random() * 1000000000) + '-';
}

module.exports = IdGenerator;

/**
 * Returns a next unique ID.
 *
 * @method djs.util.IdGenerator#next
 *
 * @returns {String} the id
 */
IdGenerator.prototype.next = function() {
  return this._prefix + (++this._counter);
};

},{}],60:[function(_dereq_,module,exports){
'use strict';

var getOriginalEvent = _dereq_(58).getOriginal;

var isMac = _dereq_(61).isMac;


function isPrimaryButton(event) {
  // button === 0 -> left áka primary mouse button
  return !(getOriginalEvent(event) || event).button;
}

module.exports.isPrimaryButton = isPrimaryButton;

module.exports.isMac = isMac;

module.exports.hasPrimaryModifier = function(event) {
  var originalEvent = getOriginalEvent(event) || event;

  if (!isPrimaryButton(event)) {
    return false;
  }

  // Use alt as primary modifier key for mac OS
  if (isMac()) {
    return originalEvent.altKey;
  } else {
    return originalEvent.ctrlKey;
  }
};


module.exports.hasSecondaryModifier = function(event) {
  var originalEvent = getOriginalEvent(event) || event;

  return isPrimaryButton(event) && originalEvent.shiftKey;
};

},{"58":58,"61":61}],61:[function(_dereq_,module,exports){
'use strict';

module.exports.isMac = function isMac() {
  return (/mac/i).test(navigator.platform);
};
},{}],62:[function(_dereq_,module,exports){

var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

var annotate = function() {
  var args = Array.prototype.slice.call(arguments);
  
  if (args.length === 1 && isArray(args[0])) {
    args = args[0];
  }

  var fn = args.pop();

  fn.$inject = args;

  return fn;
};


// Current limitations:
// - can't put into "function arg" comments
// function /* (no parenthesis like this) */ (){}
// function abc( /* xx (no parenthesis like this) */ a, b) {}
//
// Just put the comment before function or inside:
// /* (((this is fine))) */ function(a, b) {}
// function abc(a) { /* (((this is fine))) */}

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG = /\/\*([^\*]*)\*\//m;

var parse = function(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Cannot annotate "' + fn + '". Expected a function!');
  }

  var match = fn.toString().match(FN_ARGS);
  return match[1] && match[1].split(',').map(function(arg) {
    match = arg.match(FN_ARG);
    return match ? match[1].trim() : arg.trim();
  }) || [];
};


exports.annotate = annotate;
exports.parse = parse;
exports.isArray = isArray;

},{}],63:[function(_dereq_,module,exports){
module.exports = {
  annotate: _dereq_(62).annotate,
  Module: _dereq_(65),
  Injector: _dereq_(64)
};

},{"62":62,"64":64,"65":65}],64:[function(_dereq_,module,exports){
var Module = _dereq_(65);
var autoAnnotate = _dereq_(62).parse;
var annotate = _dereq_(62).annotate;
var isArray = _dereq_(62).isArray;


var Injector = function(modules, parent) {
  parent = parent || {
    get: function(name) {
      currentlyResolving.push(name);
      throw error('No provider for "' + name + '"!');
    }
  };

  var currentlyResolving = [];
  var providers = this._providers = Object.create(parent._providers || null);
  var instances = this._instances = Object.create(null);

  var self = instances.injector = this;

  var error = function(msg) {
    var stack = currentlyResolving.join(' -> ');
    currentlyResolving.length = 0;
    return new Error(stack ? msg + ' (Resolving: ' + stack + ')' : msg);
  };

  var get = function(name) {
    if (!providers[name] && name.indexOf('.') !== -1) {
      var parts = name.split('.');
      var pivot = get(parts.shift());

      while(parts.length) {
        pivot = pivot[parts.shift()];
      }

      return pivot;
    }

    if (Object.hasOwnProperty.call(instances, name)) {
      return instances[name];
    }

    if (Object.hasOwnProperty.call(providers, name)) {
      if (currentlyResolving.indexOf(name) !== -1) {
        currentlyResolving.push(name);
        throw error('Cannot resolve circular dependency!');
      }

      currentlyResolving.push(name);
      instances[name] = providers[name][0](providers[name][1]);
      currentlyResolving.pop();

      return instances[name];
    }

    return parent.get(name);
  };

  var instantiate = function(Type) {
    var instance = Object.create(Type.prototype);
    var returned = invoke(Type, instance);

    return typeof returned === 'object' ? returned : instance;
  };

  var invoke = function(fn, context) {
    if (typeof fn !== 'function') {
      if (isArray(fn)) {
        fn = annotate(fn.slice());
      } else {
        throw new Error('Cannot invoke "' + fn + '". Expected a function!');
      }
    }

    var inject = fn.$inject && fn.$inject || autoAnnotate(fn);
    var dependencies = inject.map(function(dep) {
      return get(dep);
    });

    // TODO(vojta): optimize without apply
    return fn.apply(context, dependencies);
  };


  var createPrivateInjectorFactory = function(privateChildInjector) {
    return annotate(function(key) {
      return privateChildInjector.get(key);
    });
  };

  var createChild = function(modules, forceNewInstances) {
    if (forceNewInstances && forceNewInstances.length) {
      var fromParentModule = Object.create(null);
      var matchedScopes = Object.create(null);

      var privateInjectorsCache = [];
      var privateChildInjectors = [];
      var privateChildFactories = [];

      var provider;
      var cacheIdx;
      var privateChildInjector;
      var privateChildInjectorFactory;
      for (var name in providers) {
        provider = providers[name];

        if (forceNewInstances.indexOf(name) !== -1) {
          if (provider[2] === 'private') {
            cacheIdx = privateInjectorsCache.indexOf(provider[3]);
            if (cacheIdx === -1) {
              privateChildInjector = provider[3].createChild([], forceNewInstances);
              privateChildInjectorFactory = createPrivateInjectorFactory(privateChildInjector);
              privateInjectorsCache.push(provider[3]);
              privateChildInjectors.push(privateChildInjector);
              privateChildFactories.push(privateChildInjectorFactory);
              fromParentModule[name] = [privateChildInjectorFactory, name, 'private', privateChildInjector];
            } else {
              fromParentModule[name] = [privateChildFactories[cacheIdx], name, 'private', privateChildInjectors[cacheIdx]];
            }
          } else {
            fromParentModule[name] = [provider[2], provider[1]];
          }
          matchedScopes[name] = true;
        }

        if ((provider[2] === 'factory' || provider[2] === 'type') && provider[1].$scope) {
          forceNewInstances.forEach(function(scope) {
            if (provider[1].$scope.indexOf(scope) !== -1) {
              fromParentModule[name] = [provider[2], provider[1]];
              matchedScopes[scope] = true;
            }
          });
        }
      }

      forceNewInstances.forEach(function(scope) {
        if (!matchedScopes[scope]) {
          throw new Error('No provider for "' + scope + '". Cannot use provider from the parent!');
        }
      });

      modules.unshift(fromParentModule);
    }

    return new Injector(modules, self);
  };

  var factoryMap = {
    factory: invoke,
    type: instantiate,
    value: function(value) {
      return value;
    }
  };

  modules.forEach(function(module) {

    function arrayUnwrap(type, value) {
      if (type !== 'value' && isArray(value)) {
        value = annotate(value.slice());
      }

      return value;
    }

    // TODO(vojta): handle wrong inputs (modules)
    if (module instanceof Module) {
      module.forEach(function(provider) {
        var name = provider[0];
        var type = provider[1];
        var value = provider[2];

        providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
      });
    } else if (typeof module === 'object') {
      if (module.__exports__) {
        var clonedModule = Object.keys(module).reduce(function(m, key) {
          if (key.substring(0, 2) !== '__') {
            m[key] = module[key];
          }
          return m;
        }, Object.create(null));

        var privateInjector = new Injector((module.__modules__ || []).concat([clonedModule]), self);
        var getFromPrivateInjector = annotate(function(key) {
          return privateInjector.get(key);
        });
        module.__exports__.forEach(function(key) {
          providers[key] = [getFromPrivateInjector, key, 'private', privateInjector];
        });
      } else {
        Object.keys(module).forEach(function(name) {
          if (module[name][2] === 'private') {
            providers[name] = module[name];
            return;
          }

          var type = module[name][0];
          var value = module[name][1];

          providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
        });
      }
    }
  });

  // public API
  this.get = get;
  this.invoke = invoke;
  this.instantiate = instantiate;
  this.createChild = createChild;
};

module.exports = Injector;

},{"62":62,"65":65}],65:[function(_dereq_,module,exports){
var Module = function() {
  var providers = [];

  this.factory = function(name, factory) {
    providers.push([name, 'factory', factory]);
    return this;
  };

  this.value = function(name, value) {
    providers.push([name, 'value', value]);
    return this;
  };

  this.type = function(name, type) {
    providers.push([name, 'type', type]);
    return this;
  };

  this.forEach = function(iterator) {
    providers.forEach(iterator);
  };
};

module.exports = Module;

},{}],66:[function(_dereq_,module,exports){
module.exports = _dereq_(69);
},{"69":69}],67:[function(_dereq_,module,exports){
'use strict';

var isString = _dereq_(180),
    isFunction = _dereq_(176),
    assign = _dereq_(182);

var Moddle = _dereq_(75),
    XmlReader = _dereq_(71),
    XmlWriter = _dereq_(72);

/**
 * A sub class of {@link Moddle} with support for import and export of DMN xml files.
 *
 * @class DmnModdle
 * @extends Moddle
 *
 * @param {Object|Array} packages to use for instantiating the model
 * @param {Object} [options] additional options to pass over
 */
function DmnModdle(packages, options) {
  Moddle.call(this, packages, options);
}

DmnModdle.prototype = Object.create(Moddle.prototype);

module.exports = DmnModdle;


/**
 * Instantiates a DMN model tree from a given xml string.
 *
 * @param {String}   xmlStr
 * @param {String}   [typeName='dmn:Definitions'] name of the root element
 * @param {Object}   [options]  options to pass to the underlying reader
 * @param {Function} done       callback that is invoked with (err, result, parseContext)
 *                              once the import completes
 */
DmnModdle.prototype.fromXML = function(xmlStr, typeName, options, done) {

  if (!isString(typeName)) {
    done = options;
    options = typeName;
    typeName = 'dmn:Definitions';
  }

  if (isFunction(options)) {
    done = options;
    options = {};
  }

  var reader = new XmlReader(assign({ model: this, lax: true }, options));
  var rootHandler = reader.handler(typeName);

  reader.fromXML(xmlStr, rootHandler, done);
};


/**
 * Serializes a DMN object tree to XML.
 *
 * @param {String}   element    the root element, typically an instance of `Definitions`
 * @param {Object}   [options]  to pass to the underlying writer
 * @param {Function} done       callback invoked with (err, xmlStr) once the import completes
 */
DmnModdle.prototype.toXML = function(element, options, done) {

  if (isFunction(options)) {
    done = options;
    options = {};
  }

  var writer = new XmlWriter(options);
  try {
    var result = writer.toXML(element);
    done(null, result);
  } catch (e) {
    done(e);
  }
};

},{"176":176,"180":180,"182":182,"71":71,"72":72,"75":75}],68:[function(_dereq_,module,exports){
'use strict';

var ID_PATTERN = /^(.*:)?id$/;

/**
 * Extends the bpmn instance with id support.
 *
 * @example
 *
 * var moddle, ids;
 *
 * require('id-support').extend(moddle, ids);
 *
 * moddle.ids.next(); // create a next id
 * moddle.ids; // ids instance
 *
 * // claims id as used
 * moddle.create('foo:Bar', { id: 'fooobar1' });
 *
 *
 * @param  {Moddle} model
 * @param  {Ids} ids
 *
 * @return {Moddle} the extended moddle instance
 */
module.exports.extend = function(model, ids) {

  var set = model.properties.set;

  // do not reinitialize setter
  // unless it is already initialized
  if (!model.ids) {

    model.properties.set = function(target, property, value) {

      // ensure we log used ids once they are assigned
      // to model elements
      if (ID_PATTERN.test(property)) {

        var assigned = model.ids.assigned(value);
        if (assigned && assigned !== target) {
          throw new Error('id <' + value + '> already used');
        }

        model.ids.claim(value, target);
      }

      set.call(this, target, property, value);
    };
  }

  model.ids = ids;

  return model;
};

},{}],69:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(182);

var DmnModdle = _dereq_(67);

var packages = {
  dmn: _dereq_(84)
};

module.exports = function(additionalPackages, options) {
  return new DmnModdle(assign({}, packages, additionalPackages), options);
};

},{"182":182,"67":67,"84":84}],70:[function(_dereq_,module,exports){
'use strict';

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function lower(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function hasLowerCaseAlias(pkg) {
  return pkg.xml && pkg.xml.tagAlias === 'lowerCase';
}


module.exports.aliasToName = function(alias, pkg) {
  if (hasLowerCaseAlias(pkg)) {
    return capitalize(alias);
  } else {
    return alias;
  }
};

module.exports.nameToAlias = function(name, pkg) {
  if (hasLowerCaseAlias(pkg)) {
    return lower(name);
  } else {
    return name;
  }
};

module.exports.DEFAULT_NS_MAP = {
  'xsi': 'http://www.w3.org/2001/XMLSchema-instance'
};

var XSI_TYPE = module.exports.XSI_TYPE = 'xsi:type';

function serializeFormat(element) {
  return element.xml && element.xml.serialize;
}

module.exports.serializeAsType = function(element) {
  return serializeFormat(element) === XSI_TYPE;
};

module.exports.serializeAsProperty = function(element) {
  return serializeFormat(element) === 'property';
};
},{}],71:[function(_dereq_,module,exports){
'use strict';

var reduce = _dereq_(98),
    forEach = _dereq_(95),
    find = _dereq_(94),
    assign = _dereq_(182),
    defer = _dereq_(101);

var Stack = _dereq_(74),
    SaxParser = _dereq_(73).parser,
    Moddle = _dereq_(75),
    parseNameNs = _dereq_(80).parseName,
    Types = _dereq_(83),
    coerceType = Types.coerceType,
    isSimpleType = Types.isSimple,
    common = _dereq_(70),
    XSI_TYPE = common.XSI_TYPE,
    XSI_URI = common.DEFAULT_NS_MAP.xsi,
    serializeAsType = common.serializeAsType,
    aliasToName = common.aliasToName;

function parseNodeAttributes(node) {
  var nodeAttrs = node.attributes;

  return reduce(nodeAttrs, function(result, v, k) {
    var name, ns;

    if (!v.local) {
      name = v.prefix;
    } else {
      ns = parseNameNs(v.name, v.prefix);
      name = ns.name;
    }

    result[name] = v.value;
    return result;
  }, {});
}

function normalizeType(node, attr, model) {
  var nameNs = parseNameNs(attr.value);

  var uri = node.ns[nameNs.prefix || ''],
      localName = nameNs.localName,
      pkg = uri && model.getPackage(uri),
      typePrefix;

  if (pkg) {
    typePrefix = pkg.xml && pkg.xml.typePrefix;

    if (typePrefix && localName.indexOf(typePrefix) === 0) {
      localName = localName.slice(typePrefix.length);
    }

    attr.value = pkg.prefix + ':' + localName;
  }
}

/**
 * Normalizes namespaces for a node given an optional default namespace and a
 * number of mappings from uris to default prefixes.
 *
 * @param  {XmlNode} node
 * @param  {Model} model the model containing all registered namespaces
 * @param  {Uri} defaultNsUri
 */
function normalizeNamespaces(node, model, defaultNsUri) {
  var uri, prefix;

  uri = node.uri || defaultNsUri;

  if (uri) {
    var pkg = model.getPackage(uri);

    if (pkg) {
      prefix = pkg.prefix;
    } else {
      prefix = node.prefix;
    }

    node.prefix = prefix;
    node.uri = uri;
  }

  forEach(node.attributes, function(attr) {

    // normalize xsi:type attributes because the
    // assigned type may or may not be namespace prefixed
    if (attr.uri === XSI_URI && attr.local === 'type') {
      normalizeType(node, attr, model);
    }

    normalizeNamespaces(attr, model, null);
  });
}


/**
 * A parse context.
 *
 * @class
 *
 * @param {Object} options
 * @param {ElementHandler} options.parseRoot the root handler for parsing a document
 * @param {boolean} [options.lax=false] whether or not to ignore invalid elements
 */
function Context(options) {

  /**
   * @property {ElementHandler} parseRoot
   */

  /**
   * @property {Boolean} lax
   */

  assign(this, options);

  var elementsById = this.elementsById = {};
  var references = this.references = [];
  var warnings = this.warnings = [];

  this.addReference = function(reference) {
    references.push(reference);
  };

  this.addElement = function(id, element) {

    if (!id || !element) {
      throw new Error('[xml-reader] id or ctx must not be null');
    }

    elementsById[id] = element;
  };

  this.addWarning = function (w) {
    warnings.push(w);
  };
}

function BaseHandler() {}

BaseHandler.prototype.handleEnd = function() {};
BaseHandler.prototype.handleText = function() {};
BaseHandler.prototype.handleNode = function() {};


/**
 * A simple pass through handler that does nothing except for
 * ignoring all input it receives.
 *
 * This is used to ignore unknown elements and
 * attributes.
 */
function NoopHandler() { }

NoopHandler.prototype = new BaseHandler();

NoopHandler.prototype.handleNode = function() {
  return this;
};

function BodyHandler() {}

BodyHandler.prototype = new BaseHandler();

BodyHandler.prototype.handleText = function(text) {
  this.body = (this.body || '') + text;
};

function ReferenceHandler(property, context) {
  this.property = property;
  this.context = context;
}

ReferenceHandler.prototype = new BodyHandler();

ReferenceHandler.prototype.handleNode = function(node) {

  if (this.element) {
    throw new Error('expected no sub nodes');
  } else {
    this.element = this.createReference(node);
  }

  return this;
};

ReferenceHandler.prototype.handleEnd = function() {
  this.element.id = this.body;
};

ReferenceHandler.prototype.createReference = function() {
  return {
    property: this.property.ns.name,
    id: ''
  };
};

function ValueHandler(propertyDesc, element) {
  this.element = element;
  this.propertyDesc = propertyDesc;
}

ValueHandler.prototype = new BodyHandler();

ValueHandler.prototype.handleEnd = function() {

  var value = this.body,
      element = this.element,
      propertyDesc = this.propertyDesc;

  value = coerceType(propertyDesc.type, value);

  if (propertyDesc.isMany) {
    element.get(propertyDesc.name).push(value);
  } else {
    element.set(propertyDesc.name, value);
  }
};


function BaseElementHandler() {}

BaseElementHandler.prototype = Object.create(BodyHandler.prototype);

BaseElementHandler.prototype.handleNode = function(node) {
  var parser = this,
      element = this.element,
      id;

  if (!element) {
    element = this.element = this.createElement(node);
    id = element.id;

    if (id) {
      this.context.addElement(id, element);
    }
  } else {
    parser = this.handleChild(node);
  }

  return parser;
};

/**
 * @class XMLReader.ElementHandler
 *
 */
function ElementHandler(model, type, context) {
  this.model = model;
  this.type = model.getType(type);
  this.context = context;
}

ElementHandler.prototype = new BaseElementHandler();

ElementHandler.prototype.addReference = function(reference) {
  this.context.addReference(reference);
};

ElementHandler.prototype.handleEnd = function() {

  var value = this.body,
      element = this.element,
      descriptor = element.$descriptor,
      bodyProperty = descriptor.bodyProperty;

  if (bodyProperty && value !== undefined) {
    value = coerceType(bodyProperty.type, value);
    element.set(bodyProperty.name, value);
  }
};

/**
 * Create an instance of the model from the given node.
 *
 * @param  {Element} node the xml node
 */
ElementHandler.prototype.createElement = function(node) {
  var attributes = parseNodeAttributes(node),
      Type = this.type,
      descriptor = Type.$descriptor,
      context = this.context,
      instance = new Type({});

  forEach(attributes, function(value, name) {

    var prop = descriptor.propertiesByName[name];

    if (prop && prop.isReference) {
      context.addReference({
        element: instance,
        property: prop.ns.name,
        id: value
      });
    } else {
      if (prop) {
        value = coerceType(prop.type, value);
      }

      instance.set(name, value);
    }
  });

  return instance;
};

ElementHandler.prototype.getPropertyForNode = function(node) {

  var nameNs = parseNameNs(node.local, node.prefix);

  var type = this.type,
      model = this.model,
      descriptor = type.$descriptor;

  var propertyName = nameNs.name,
      property = descriptor.propertiesByName[propertyName],
      elementTypeName,
      elementType,
      typeAnnotation;

  // search for properties by name first

  if (property) {

    if (serializeAsType(property)) {
      typeAnnotation = node.attributes[XSI_TYPE];

      // xsi type is optional, if it does not exists the
      // default type is assumed
      if (typeAnnotation) {

        elementTypeName = typeAnnotation.value;

        // TODO: extract real name from attribute
        elementType = model.getType(elementTypeName);

        return assign({}, property, { effectiveType: elementType.$descriptor.name });
      }
    }

    // search for properties by name first
    return property;
  }


  var pkg = model.getPackage(nameNs.prefix);

  if (pkg) {
    elementTypeName = nameNs.prefix + ':' + aliasToName(nameNs.localName, descriptor.$pkg);
    elementType = model.getType(elementTypeName);

    // search for collection members later
    property = find(descriptor.properties, function(p) {
      return !p.isVirtual && !p.isReference && !p.isAttribute && elementType.hasType(p.type);
    });

    if (property) {
      return assign({}, property, { effectiveType: elementType.$descriptor.name });
    }
  } else {
    // parse unknown element (maybe extension)
    property = find(descriptor.properties, function(p) {
      return !p.isReference && !p.isAttribute && p.type === 'Element';
    });

    if (property) {
      return property;
    }
  }

  throw new Error('unrecognized element <' + nameNs.name + '>');
};

ElementHandler.prototype.toString = function() {
  return 'ElementDescriptor[' + this.type.$descriptor.name + ']';
};

ElementHandler.prototype.valueHandler = function(propertyDesc, element) {
  return new ValueHandler(propertyDesc, element);
};

ElementHandler.prototype.referenceHandler = function(propertyDesc) {
  return new ReferenceHandler(propertyDesc, this.context);
};

ElementHandler.prototype.handler = function(type) {
  if (type === 'Element') {
    return new GenericElementHandler(this.model, type, this.context);
  } else {
    return new ElementHandler(this.model, type, this.context);
  }
};

/**
 * Handle the child element parsing
 *
 * @param  {Element} node the xml node
 */
ElementHandler.prototype.handleChild = function(node) {
  var propertyDesc, type, element, childHandler;

  propertyDesc = this.getPropertyForNode(node);
  element = this.element;

  type = propertyDesc.effectiveType || propertyDesc.type;

  if (isSimpleType(type)) {
    return this.valueHandler(propertyDesc, element);
  }

  if (propertyDesc.isReference) {
    childHandler = this.referenceHandler(propertyDesc).handleNode(node);
  } else {
    childHandler = this.handler(type).handleNode(node);
  }

  var newElement = childHandler.element;

  // child handles may decide to skip elements
  // by not returning anything
  if (newElement !== undefined) {

    if (propertyDesc.isMany) {
      element.get(propertyDesc.name).push(newElement);
    } else {
      element.set(propertyDesc.name, newElement);
    }

    if (propertyDesc.isReference) {
      assign(newElement, {
        element: element
      });

      this.context.addReference(newElement);
    } else {
      // establish child -> parent relationship
      newElement.$parent = element;
    }
  }

  return childHandler;
};


function GenericElementHandler(model, type, context) {
  this.model = model;
  this.context = context;
}

GenericElementHandler.prototype = Object.create(BaseElementHandler.prototype);

GenericElementHandler.prototype.createElement = function(node) {

  var name = node.name,
      prefix = node.prefix,
      uri = node.ns[prefix],
      attributes = node.attributes;

  return this.model.createAny(name, uri, attributes);
};

GenericElementHandler.prototype.handleChild = function(node) {

  var handler = new GenericElementHandler(this.model, 'Element', this.context).handleNode(node),
      element = this.element;

  var newElement = handler.element,
      children;

  if (newElement !== undefined) {
    children = element.$children = element.$children || [];
    children.push(newElement);

    // establish child -> parent relationship
    newElement.$parent = element;
  }

  return handler;
};

GenericElementHandler.prototype.handleText = function(text) {
  this.body = this.body || '' + text;
};

GenericElementHandler.prototype.handleEnd = function() {
  if (this.body) {
    this.element.$body = this.body;
  }
};

/**
 * A reader for a meta-model
 *
 * @param {Object} options
 * @param {Model} options.model used to read xml files
 * @param {Boolean} options.lax whether to make parse errors warnings
 */
function XMLReader(options) {

  if (options instanceof Moddle) {
    options = {
      model: options
    };
  }

  assign(this, { lax: false }, options);
}


XMLReader.prototype.fromXML = function(xml, rootHandler, done) {

  var model = this.model,
      lax = this.lax,
      context = new Context({
        parseRoot: rootHandler
      });

  var parser = new SaxParser(true, { xmlns: true, trim: true }),
      stack = new Stack();

  rootHandler.context = context;

  // push root handler
  stack.push(rootHandler);


  function resolveReferences() {

    var elementsById = context.elementsById;
    var references = context.references;

    var i, r;

    for (i = 0; !!(r = references[i]); i++) {
      var element = r.element;
      var reference = elementsById[r.id];
      var property = element.$descriptor.propertiesByName[r.property];

      if (!reference) {
        context.addWarning({
          message: 'unresolved reference <' + r.id + '>',
          element: r.element,
          property: r.property,
          value: r.id
        });
      }

      if (property.isMany) {
        var collection = element.get(property.name),
            idx = collection.indexOf(r);

        if (!reference) {
          // remove unresolvable reference
          collection.splice(idx, 1);
        } else {
          // update reference
          collection[idx] = reference;
        }
      } else {
        element.set(property.name, reference);
      }
    }
  }

  function handleClose(tagName) {
    stack.pop().handleEnd();
  }

  function handleOpen(node) {
    var handler = stack.peek();

    normalizeNamespaces(node, model);

    try {
      stack.push(handler.handleNode(node));
    } catch (e) {

      var line = this.line,
          column = this.column;

      var message =
        'unparsable content <' + node.name + '> detected\n\t' +
          'line: ' + line + '\n\t' +
          'column: ' + column + '\n\t' +
          'nested error: ' + e.message;

      if (lax) {
        context.addWarning({
          message: message,
          error: e
        });

        console.warn('could not parse node');
        console.warn(e);

        stack.push(new NoopHandler());
      } else {
        console.error('could not parse document');
        console.error(e);

        throw new Error(message);
      }
    }
  }

  function handleText(text) {
    stack.peek().handleText(text);
  }

  parser.onopentag = handleOpen;
  parser.oncdata = parser.ontext = handleText;
  parser.onclosetag = handleClose;
  parser.onend = resolveReferences;

  // deferred parse XML to make loading really ascnchronous
  // this ensures the execution environment (node or browser)
  // is kept responsive and that certain optimization strategies
  // can kick in
  defer(function() {
    var error;

    try {
      parser.write(xml).close();
    } catch (e) {
      error = e;
    }

    done(error, error ? undefined : rootHandler.element, context);
  });
};

XMLReader.prototype.handler = function(name) {
  return new ElementHandler(this.model, name);
};

module.exports = XMLReader;
module.exports.ElementHandler = ElementHandler;
},{"101":101,"182":182,"70":70,"73":73,"74":74,"75":75,"80":80,"83":83,"94":94,"95":95,"98":98}],72:[function(_dereq_,module,exports){
'use strict';

var map = _dereq_(97),
    forEach = _dereq_(95),
    isString = _dereq_(180),
    filter = _dereq_(93),
    assign = _dereq_(182);

var Types = _dereq_(83),
    parseNameNs = _dereq_(80).parseName,
    common = _dereq_(70),
    nameToAlias = common.nameToAlias,
    serializeAsType = common.serializeAsType,
    serializeAsProperty = common.serializeAsProperty;

var XML_PREAMBLE = '<?xml version="1.0" encoding="UTF-8"?>\n',
    ESCAPE_CHARS = /(<|>|'|"|&|\n\r|\n)/g,
    DEFAULT_NS_MAP = common.DEFAULT_NS_MAP,
    XSI_TYPE = common.XSI_TYPE;


function nsName(ns) {
  if (isString(ns)) {
    return ns;
  } else {
    return (ns.prefix ? ns.prefix + ':' : '') + ns.localName;
  }
}

function getElementNs(ns, descriptor) {
  if (descriptor.isGeneric) {
    return descriptor.name;
  } else {
    return assign({ localName: nameToAlias(descriptor.ns.localName, descriptor.$pkg) }, ns);
  }
}

function getPropertyNs(ns, descriptor) {
  return assign({ localName: descriptor.ns.localName }, ns);
}

function getSerializableProperties(element) {
  var descriptor = element.$descriptor;

  return filter(descriptor.properties, function(p) {
    var name = p.name;

    // do not serialize defaults
    if (!element.hasOwnProperty(name)) {
      return false;
    }

    var value = element[name];

    // do not serialize default equals
    if (value === p.default) {
      return false;
    }

    return p.isMany ? value.length : true;
  });
}

var ESCAPE_MAP = {
  '\n': '10',
  '\n\r': '10',
  '"': '34',
  '\'': '39',
  '<': '60',
  '>': '62',
  '&': '38'
};

/**
 * Escape a string attribute to not contain any bad values (line breaks, '"', ...)
 *
 * @param {String} str the string to escape
 * @return {String} the escaped string
 */
function escapeAttr(str) {

  // ensure we are handling strings here
  str = isString(str) ? str : '' + str;

  return str.replace(ESCAPE_CHARS, function(str) {
    return '&#' + ESCAPE_MAP[str] + ';';
  });
}

function filterAttributes(props) {
  return filter(props, function(p) { return p.isAttr; });
}

function filterContained(props) {
  return filter(props, function(p) { return !p.isAttr; });
}


function ReferenceSerializer(parent, ns) {
  this.ns = ns;
}

ReferenceSerializer.prototype.build = function(element) {
  this.element = element;
  return this;
};

ReferenceSerializer.prototype.serializeTo = function(writer) {
  writer
    .appendIndent()
    .append('<' + nsName(this.ns) + '>' + this.element.id + '</' + nsName(this.ns) + '>')
    .appendNewLine();
};

function BodySerializer() {}

BodySerializer.prototype.serializeValue = BodySerializer.prototype.serializeTo = function(writer) {
  var escape = this.escape;

  if (escape) {
    writer.append('<![CDATA[');
  }

  writer.append(this.value);

  if (escape) {
    writer.append(']]>');
  }
};

BodySerializer.prototype.build = function(prop, value) {
  this.value = value;

  if (prop.type === 'String' && ESCAPE_CHARS.test(value)) {
    this.escape = true;
  }

  return this;
};

function ValueSerializer(ns) {
  this.ns = ns;
}

ValueSerializer.prototype = new BodySerializer();

ValueSerializer.prototype.serializeTo = function(writer) {

  writer
    .appendIndent()
    .append('<' + nsName(this.ns) + '>');

  this.serializeValue(writer);

  writer
    .append( '</' + nsName(this.ns) + '>')
    .appendNewLine();
};

function ElementSerializer(parent, ns) {
  this.body = [];
  this.attrs = [];

  this.parent = parent;
  this.ns = ns;
}

ElementSerializer.prototype.build = function(element) {
  this.element = element;

  var otherAttrs = this.parseNsAttributes(element);

  if (!this.ns) {
    this.ns = this.nsTagName(element.$descriptor);
  }

  if (element.$descriptor.isGeneric) {
    this.parseGeneric(element);
  } else {
    var properties = getSerializableProperties(element);

    this.parseAttributes(filterAttributes(properties));
    this.parseContainments(filterContained(properties));

    this.parseGenericAttributes(element, otherAttrs);
  }

  return this;
};

ElementSerializer.prototype.nsTagName = function(descriptor) {
  var effectiveNs = this.logNamespaceUsed(descriptor.ns);
  return getElementNs(effectiveNs, descriptor);
};

ElementSerializer.prototype.nsPropertyTagName = function(descriptor) {
  var effectiveNs = this.logNamespaceUsed(descriptor.ns);
  return getPropertyNs(effectiveNs, descriptor);
};

ElementSerializer.prototype.isLocalNs = function(ns) {
  return ns.uri === this.ns.uri;
};

ElementSerializer.prototype.nsAttributeName = function(element) {

  var ns;

  if (isString(element)) {
    ns = parseNameNs(element);
  } else
  if (element.ns) {
    ns = element.ns;
  }

  var effectiveNs = this.logNamespaceUsed(ns);

  // strip prefix if same namespace like parent
  if (this.isLocalNs(effectiveNs)) {
    return { localName: ns.localName };
  } else {
    return assign({ localName: ns.localName }, effectiveNs);
  }
};

ElementSerializer.prototype.parseGeneric = function(element) {

  var self = this,
      body = this.body,
      attrs = this.attrs;

  forEach(element, function(val, key) {

    if (key === '$body') {
      body.push(new BodySerializer().build({ type: 'String' }, val));
    } else
    if (key === '$children') {
      forEach(val, function(child) {
        body.push(new ElementSerializer(self).build(child));
      });
    } else
    if (key.indexOf('$') !== 0) {
      attrs.push({ name: key, value: escapeAttr(val) });
    }
  });
};

/**
 * Parse namespaces and return a list of left over generic attributes
 *
 * @param  {Object} element
 * @return {Array<Object>}
 */
ElementSerializer.prototype.parseNsAttributes = function(element) {
  var self = this;

  var genericAttrs = element.$attrs;

  var attributes = [];

  // parse namespace attributes first
  // and log them. push non namespace attributes to a list
  // and process them later
  forEach(genericAttrs, function(value, name) {
    var nameNs = parseNameNs(name);

    if (nameNs.prefix === 'xmlns') {
      self.logNamespace({ prefix: nameNs.localName, uri: value });
    } else
    if (!nameNs.prefix && nameNs.localName === 'xmlns') {
      self.logNamespace({ uri: value });
    } else {
      attributes.push({ name: name, value: value });
    }
  });

  return attributes;
};

ElementSerializer.prototype.parseGenericAttributes = function(element, attributes) {

  var self = this;

  forEach(attributes, function(attr) {

    // do not serialize xsi:type attribute
    // it is set manually based on the actual implementation type
    if (attr.name === XSI_TYPE) {
      return;
    }

    try {
      self.addAttribute(self.nsAttributeName(attr.name), attr.value);
    } catch (e) {
      console.warn('[writer] missing namespace information for ', attr.name, '=', attr.value, 'on', element, e);
    }
  });
};

ElementSerializer.prototype.parseContainments = function(properties) {

  var self = this,
      body = this.body,
      element = this.element;

  forEach(properties, function(p) {
    var value = element.get(p.name),
        isReference = p.isReference,
        isMany = p.isMany;

    var ns = self.nsPropertyTagName(p);

    if (!isMany) {
      value = [ value ];
    }

    if (p.isBody) {
      body.push(new BodySerializer().build(p, value[0]));
    } else
    if (Types.isSimple(p.type)) {
      forEach(value, function(v) {
        body.push(new ValueSerializer(ns).build(p, v));
      });
    } else
    if (isReference) {
      forEach(value, function(v) {
        body.push(new ReferenceSerializer(self, ns).build(v));
      });
    } else {
      // allow serialization via type
      // rather than element name
      var asType = serializeAsType(p),
          asProperty = serializeAsProperty(p);

      forEach(value, function(v) {
        var serializer;

        if (asType) {
          serializer = new TypeSerializer(self, ns);
        } else
        if (asProperty) {
          serializer = new ElementSerializer(self, ns);
        } else {
          serializer = new ElementSerializer(self);
        }

        body.push(serializer.build(v));
      });
    }
  });
};

ElementSerializer.prototype.getNamespaces = function() {
  if (!this.parent) {
    if (!this.namespaces) {
      this.namespaces = {
        prefixMap: {},
        uriMap: {},
        used: {}
      };
    }
  } else {
    this.namespaces = this.parent.getNamespaces();
  }

  return this.namespaces;
};

ElementSerializer.prototype.logNamespace = function(ns) {
  var namespaces = this.getNamespaces();

  var existing = namespaces.uriMap[ns.uri];

  if (!existing) {
    namespaces.uriMap[ns.uri] = ns;
  }

  namespaces.prefixMap[ns.prefix] = ns.uri;

  return ns;
};

ElementSerializer.prototype.logNamespaceUsed = function(ns) {
  var element = this.element,
      model = element.$model,
      namespaces = this.getNamespaces();

  // ns may be
  //
  //   * prefix only
  //   * prefix:uri

  var prefix = ns.prefix;
  var uri = ns.uri || DEFAULT_NS_MAP[prefix] ||
            namespaces.prefixMap[prefix] || (model ? (model.getPackage(prefix) || {}).uri : null);

  if (!uri) {
    throw new Error('no namespace uri given for prefix <' + ns.prefix + '>');
  }

  ns = namespaces.uriMap[uri];

  if (!ns) {
    ns = this.logNamespace({ prefix: prefix, uri: uri });
  }

  if (!namespaces.used[ns.uri]) {
    namespaces.used[ns.uri] = ns;
  }

  return ns;
};

ElementSerializer.prototype.parseAttributes = function(properties) {
  var self = this,
      element = this.element;

  forEach(properties, function(p) {
    self.logNamespaceUsed(p.ns);

    var value = element.get(p.name);

    if (p.isReference) {
      value = value.id;
    }

    self.addAttribute(self.nsAttributeName(p), value);
  });
};

ElementSerializer.prototype.addAttribute = function(name, value) {
  var attrs = this.attrs;

  if (isString(value)) {
    value = escapeAttr(value);
  }

  attrs.push({ name: name, value: value });
};

ElementSerializer.prototype.serializeAttributes = function(writer) {
  var attrs = this.attrs,
      root = !this.parent,
      namespaces = this.namespaces;

  function collectNsAttrs() {
    return map(namespaces.used, function(ns) {
      var name = 'xmlns' + (ns.prefix ? ':' + ns.prefix : '');
      return { name: name, value: ns.uri };
    });
  }

  if (root) {
    attrs = collectNsAttrs().concat(attrs);
  }

  forEach(attrs, function(a) {
    writer
      .append(' ')
      .append(nsName(a.name)).append('="').append(a.value).append('"');
  });
};

ElementSerializer.prototype.serializeTo = function(writer) {
  var hasBody = this.body.length,
      indent = !(this.body.length === 1 && this.body[0] instanceof BodySerializer);

  writer
    .appendIndent()
    .append('<' + nsName(this.ns));

  this.serializeAttributes(writer);

  writer.append(hasBody ? '>' : ' />');

  if (hasBody) {

    if (indent) {
      writer
        .appendNewLine()
        .indent();
    }

    forEach(this.body, function(b) {
      b.serializeTo(writer);
    });

    if (indent) {
      writer
        .unindent()
        .appendIndent();
    }

    writer.append('</' + nsName(this.ns) + '>');
  }

  writer.appendNewLine();
};

/**
 * A serializer for types that handles serialization of data types
 */
function TypeSerializer(parent, ns) {
  ElementSerializer.call(this, parent, ns);
}

TypeSerializer.prototype = new ElementSerializer();

TypeSerializer.prototype.build = function(element) {
  var descriptor = element.$descriptor;

  this.element = element;

  this.typeNs = this.nsTagName(descriptor);

  // add xsi:type attribute to represent the elements
  // actual type

  var typeNs = this.typeNs,
      pkg = element.$model.getPackage(typeNs.uri),
      typePrefix = (pkg.xml && pkg.xml.typePrefix) || '';

  this.addAttribute(this.nsAttributeName(XSI_TYPE),
    (typeNs.prefix ? typeNs.prefix + ':' : '') +
    typePrefix + descriptor.ns.localName);

  // do the usual stuff
  return ElementSerializer.prototype.build.call(this, element);
};

TypeSerializer.prototype.isLocalNs = function(ns) {
  return ns.uri === this.typeNs.uri;
};

function SavingWriter() {
  this.value = '';

  this.write = function(str) {
    this.value += str;
  };
}

function FormatingWriter(out, format) {

  var indent = [''];

  this.append = function(str) {
    out.write(str);

    return this;
  };

  this.appendNewLine = function() {
    if (format) {
      out.write('\n');
    }

    return this;
  };

  this.appendIndent = function() {
    if (format) {
      out.write(indent.join('  '));
    }

    return this;
  };

  this.indent = function() {
    indent.push('');
    return this;
  };

  this.unindent = function() {
    indent.pop();
    return this;
  };
}

/**
 * A writer for meta-model backed document trees
 *
 * @param {Object} options output options to pass into the writer
 */
function XMLWriter(options) {

  options = assign({ format: false, preamble: true }, options || {});

  function toXML(tree, writer) {
    var internalWriter = writer || new SavingWriter();
    var formatingWriter = new FormatingWriter(internalWriter, options.format);

    if (options.preamble) {
      formatingWriter.append(XML_PREAMBLE);
    }

    new ElementSerializer().build(tree).serializeTo(formatingWriter);

    if (!writer) {
      return internalWriter.value;
    }
  }

  return {
    toXML: toXML
  };
}

module.exports = XMLWriter;

},{"180":180,"182":182,"70":70,"80":80,"83":83,"93":93,"95":95,"97":97}],73:[function(_dereq_,module,exports){
(function (Buffer){
// wrapper for non-node envs
;(function (sax) {

sax.parser = function (strict, opt) { return new SAXParser(strict, opt) }
sax.SAXParser = SAXParser
sax.SAXStream = SAXStream
sax.createStream = createStream

// When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
// When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
// since that's the earliest that a buffer overrun could occur.  This way, checks are
// as rare as required, but as often as necessary to ensure never crossing this bound.
// Furthermore, buffers are only tested at most once per write(), so passing a very
// large string into write() might have undesirable effects, but this is manageable by
// the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
// edge case, result in creating at most one complete copy of the string passed in.
// Set to Infinity to have unlimited buffers.
sax.MAX_BUFFER_LENGTH = 64 * 1024

var buffers = [
  "comment", "sgmlDecl", "textNode", "tagName", "doctype",
  "procInstName", "procInstBody", "entity", "attribName",
  "attribValue", "cdata", "script"
]

sax.EVENTS = // for discoverability.
  [ "text"
  , "processinginstruction"
  , "sgmldeclaration"
  , "doctype"
  , "comment"
  , "attribute"
  , "opentag"
  , "closetag"
  , "opencdata"
  , "cdata"
  , "closecdata"
  , "error"
  , "end"
  , "ready"
  , "script"
  , "opennamespace"
  , "closenamespace"
  ]

function SAXParser (strict, opt) {
  if (!(this instanceof SAXParser)) return new SAXParser(strict, opt)

  var parser = this
  clearBuffers(parser)
  parser.q = parser.c = ""
  parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH
  parser.opt = opt || {}
  parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags
  parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase"
  parser.tags = []
  parser.closed = parser.closedRoot = parser.sawRoot = false
  parser.tag = parser.error = null
  parser.strict = !!strict
  parser.noscript = !!(strict || parser.opt.noscript)
  parser.state = S.BEGIN
  parser.ENTITIES = Object.create(sax.ENTITIES)
  parser.attribList = []

  // namespaces form a prototype chain.
  // it always points at the current tag,
  // which protos to its parent tag.
  if (parser.opt.xmlns) parser.ns = Object.create(rootNS)

  // mostly just for error reporting
  parser.trackPosition = parser.opt.position !== false
  if (parser.trackPosition) {
    parser.position = parser.line = parser.column = 0
  }
  emit(parser, "onready")
}

if (!Object.create) Object.create = function (o) {
  function f () { this.__proto__ = o }
  f.prototype = o
  return new f
}

if (!Object.getPrototypeOf) Object.getPrototypeOf = function (o) {
  return o.__proto__
}

if (!Object.keys) Object.keys = function (o) {
  var a = []
  for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
  return a
}

function checkBufferLength (parser) {
  var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
    , maxActual = 0
  for (var i = 0, l = buffers.length; i < l; i ++) {
    var len = parser[buffers[i]].length
    if (len > maxAllowed) {
      // Text/cdata nodes can get big, and since they're buffered,
      // we can get here under normal conditions.
      // Avoid issues by emitting the text node now,
      // so at least it won't get any bigger.
      switch (buffers[i]) {
        case "textNode":
          closeText(parser)
        break

        case "cdata":
          emitNode(parser, "oncdata", parser.cdata)
          parser.cdata = ""
        break

        case "script":
          emitNode(parser, "onscript", parser.script)
          parser.script = ""
        break

        default:
          error(parser, "Max buffer length exceeded: "+buffers[i])
      }
    }
    maxActual = Math.max(maxActual, len)
  }
  // schedule the next check for the earliest possible buffer overrun.
  parser.bufferCheckPosition = (sax.MAX_BUFFER_LENGTH - maxActual)
                             + parser.position
}

function clearBuffers (parser) {
  for (var i = 0, l = buffers.length; i < l; i ++) {
    parser[buffers[i]] = ""
  }
}

function flushBuffers (parser) {
  closeText(parser)
  if (parser.cdata !== "") {
    emitNode(parser, "oncdata", parser.cdata)
    parser.cdata = ""
  }
  if (parser.script !== "") {
    emitNode(parser, "onscript", parser.script)
    parser.script = ""
  }
}

SAXParser.prototype =
  { end: function () { end(this) }
  , write: write
  , resume: function () { this.error = null; return this }
  , close: function () { return this.write(null) }
  , flush: function () { flushBuffers(this) }
  }

try {
  var Stream = _dereq_("stream").Stream
} catch (ex) {
  var Stream = function () {}
}


var streamWraps = sax.EVENTS.filter(function (ev) {
  return ev !== "error" && ev !== "end"
})

function createStream (strict, opt) {
  return new SAXStream(strict, opt)
}

function SAXStream (strict, opt) {
  if (!(this instanceof SAXStream)) return new SAXStream(strict, opt)

  Stream.apply(this)

  this._parser = new SAXParser(strict, opt)
  this.writable = true
  this.readable = true


  var me = this

  this._parser.onend = function () {
    me.emit("end")
  }

  this._parser.onerror = function (er) {
    me.emit("error", er)

    // if didn't throw, then means error was handled.
    // go ahead and clear error, so we can write again.
    me._parser.error = null
  }

  this._decoder = null;

  streamWraps.forEach(function (ev) {
    Object.defineProperty(me, "on" + ev, {
      get: function () { return me._parser["on" + ev] },
      set: function (h) {
        if (!h) {
          me.removeAllListeners(ev)
          return me._parser["on"+ev] = h
        }
        me.on(ev, h)
      },
      enumerable: true,
      configurable: false
    })
  })
}

SAXStream.prototype = Object.create(Stream.prototype,
  { constructor: { value: SAXStream } })

SAXStream.prototype.write = function (data) {
  if (typeof Buffer === 'function' &&
      typeof Buffer.isBuffer === 'function' &&
      Buffer.isBuffer(data)) {
    if (!this._decoder) {
      var SD = _dereq_('string_decoder').StringDecoder
      this._decoder = new SD('utf8')
    }
    data = this._decoder.write(data);
  }

  this._parser.write(data.toString())
  this.emit("data", data)
  return true
}

SAXStream.prototype.end = function (chunk) {
  if (chunk && chunk.length) this.write(chunk)
  this._parser.end()
  return true
}

SAXStream.prototype.on = function (ev, handler) {
  var me = this
  if (!me._parser["on"+ev] && streamWraps.indexOf(ev) !== -1) {
    me._parser["on"+ev] = function () {
      var args = arguments.length === 1 ? [arguments[0]]
               : Array.apply(null, arguments)
      args.splice(0, 0, ev)
      me.emit.apply(me, args)
    }
  }

  return Stream.prototype.on.call(me, ev, handler)
}



// character classes and tokens
var whitespace = "\r\n\t "
  // this really needs to be replaced with character classes.
  // XML allows all manner of ridiculous numbers and digits.
  , number = "0124356789"
  , letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  // (Letter | "_" | ":")
  , quote = "'\""
  , entity = number+letter+"#"
  , attribEnd = whitespace + ">"
  , CDATA = "[CDATA["
  , DOCTYPE = "DOCTYPE"
  , XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"
  , XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/"
  , rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }

// turn all the string character sets into character class objects.
whitespace = charClass(whitespace)
number = charClass(number)
letter = charClass(letter)

// http://www.w3.org/TR/REC-xml/#NT-NameStartChar
// This implementation works on strings, a single character at a time
// as such, it cannot ever support astral-plane characters (10000-EFFFF)
// without a significant breaking change to either this  parser, or the
// JavaScript language.  Implementation of an emoji-capable xml parser
// is left as an exercise for the reader.
var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/

var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/

quote = charClass(quote)
entity = charClass(entity)
attribEnd = charClass(attribEnd)

function charClass (str) {
  return str.split("").reduce(function (s, c) {
    s[c] = true
    return s
  }, {})
}

function isRegExp (c) {
  return Object.prototype.toString.call(c) === '[object RegExp]'
}

function is (charclass, c) {
  return isRegExp(charclass) ? !!c.match(charclass) : charclass[c]
}

function not (charclass, c) {
  return !is(charclass, c)
}

var S = 0
sax.STATE =
{ BEGIN                     : S++
, TEXT                      : S++ // general stuff
, TEXT_ENTITY               : S++ // &amp and such.
, OPEN_WAKA                 : S++ // <
, SGML_DECL                 : S++ // <!BLARG
, SGML_DECL_QUOTED          : S++ // <!BLARG foo "bar
, DOCTYPE                   : S++ // <!DOCTYPE
, DOCTYPE_QUOTED            : S++ // <!DOCTYPE "//blah
, DOCTYPE_DTD               : S++ // <!DOCTYPE "//blah" [ ...
, DOCTYPE_DTD_QUOTED        : S++ // <!DOCTYPE "//blah" [ "foo
, COMMENT_STARTING          : S++ // <!-
, COMMENT                   : S++ // <!--
, COMMENT_ENDING            : S++ // <!-- blah -
, COMMENT_ENDED             : S++ // <!-- blah --
, CDATA                     : S++ // <![CDATA[ something
, CDATA_ENDING              : S++ // ]
, CDATA_ENDING_2            : S++ // ]]
, PROC_INST                 : S++ // <?hi
, PROC_INST_BODY            : S++ // <?hi there
, PROC_INST_ENDING          : S++ // <?hi "there" ?
, OPEN_TAG                  : S++ // <strong
, OPEN_TAG_SLASH            : S++ // <strong /
, ATTRIB                    : S++ // <a
, ATTRIB_NAME               : S++ // <a foo
, ATTRIB_NAME_SAW_WHITE     : S++ // <a foo _
, ATTRIB_VALUE              : S++ // <a foo=
, ATTRIB_VALUE_QUOTED       : S++ // <a foo="bar
, ATTRIB_VALUE_CLOSED       : S++ // <a foo="bar"
, ATTRIB_VALUE_UNQUOTED     : S++ // <a foo=bar
, ATTRIB_VALUE_ENTITY_Q     : S++ // <foo bar="&quot;"
, ATTRIB_VALUE_ENTITY_U     : S++ // <foo bar=&quot;
, CLOSE_TAG                 : S++ // </a
, CLOSE_TAG_SAW_WHITE       : S++ // </a   >
, SCRIPT                    : S++ // <script> ...
, SCRIPT_ENDING             : S++ // <script> ... <
}

sax.ENTITIES =
{ "amp" : "&"
, "gt" : ">"
, "lt" : "<"
, "quot" : "\""
, "apos" : "'"
, "AElig" : 198
, "Aacute" : 193
, "Acirc" : 194
, "Agrave" : 192
, "Aring" : 197
, "Atilde" : 195
, "Auml" : 196
, "Ccedil" : 199
, "ETH" : 208
, "Eacute" : 201
, "Ecirc" : 202
, "Egrave" : 200
, "Euml" : 203
, "Iacute" : 205
, "Icirc" : 206
, "Igrave" : 204
, "Iuml" : 207
, "Ntilde" : 209
, "Oacute" : 211
, "Ocirc" : 212
, "Ograve" : 210
, "Oslash" : 216
, "Otilde" : 213
, "Ouml" : 214
, "THORN" : 222
, "Uacute" : 218
, "Ucirc" : 219
, "Ugrave" : 217
, "Uuml" : 220
, "Yacute" : 221
, "aacute" : 225
, "acirc" : 226
, "aelig" : 230
, "agrave" : 224
, "aring" : 229
, "atilde" : 227
, "auml" : 228
, "ccedil" : 231
, "eacute" : 233
, "ecirc" : 234
, "egrave" : 232
, "eth" : 240
, "euml" : 235
, "iacute" : 237
, "icirc" : 238
, "igrave" : 236
, "iuml" : 239
, "ntilde" : 241
, "oacute" : 243
, "ocirc" : 244
, "ograve" : 242
, "oslash" : 248
, "otilde" : 245
, "ouml" : 246
, "szlig" : 223
, "thorn" : 254
, "uacute" : 250
, "ucirc" : 251
, "ugrave" : 249
, "uuml" : 252
, "yacute" : 253
, "yuml" : 255
, "copy" : 169
, "reg" : 174
, "nbsp" : 160
, "iexcl" : 161
, "cent" : 162
, "pound" : 163
, "curren" : 164
, "yen" : 165
, "brvbar" : 166
, "sect" : 167
, "uml" : 168
, "ordf" : 170
, "laquo" : 171
, "not" : 172
, "shy" : 173
, "macr" : 175
, "deg" : 176
, "plusmn" : 177
, "sup1" : 185
, "sup2" : 178
, "sup3" : 179
, "acute" : 180
, "micro" : 181
, "para" : 182
, "middot" : 183
, "cedil" : 184
, "ordm" : 186
, "raquo" : 187
, "frac14" : 188
, "frac12" : 189
, "frac34" : 190
, "iquest" : 191
, "times" : 215
, "divide" : 247
, "OElig" : 338
, "oelig" : 339
, "Scaron" : 352
, "scaron" : 353
, "Yuml" : 376
, "fnof" : 402
, "circ" : 710
, "tilde" : 732
, "Alpha" : 913
, "Beta" : 914
, "Gamma" : 915
, "Delta" : 916
, "Epsilon" : 917
, "Zeta" : 918
, "Eta" : 919
, "Theta" : 920
, "Iota" : 921
, "Kappa" : 922
, "Lambda" : 923
, "Mu" : 924
, "Nu" : 925
, "Xi" : 926
, "Omicron" : 927
, "Pi" : 928
, "Rho" : 929
, "Sigma" : 931
, "Tau" : 932
, "Upsilon" : 933
, "Phi" : 934
, "Chi" : 935
, "Psi" : 936
, "Omega" : 937
, "alpha" : 945
, "beta" : 946
, "gamma" : 947
, "delta" : 948
, "epsilon" : 949
, "zeta" : 950
, "eta" : 951
, "theta" : 952
, "iota" : 953
, "kappa" : 954
, "lambda" : 955
, "mu" : 956
, "nu" : 957
, "xi" : 958
, "omicron" : 959
, "pi" : 960
, "rho" : 961
, "sigmaf" : 962
, "sigma" : 963
, "tau" : 964
, "upsilon" : 965
, "phi" : 966
, "chi" : 967
, "psi" : 968
, "omega" : 969
, "thetasym" : 977
, "upsih" : 978
, "piv" : 982
, "ensp" : 8194
, "emsp" : 8195
, "thinsp" : 8201
, "zwnj" : 8204
, "zwj" : 8205
, "lrm" : 8206
, "rlm" : 8207
, "ndash" : 8211
, "mdash" : 8212
, "lsquo" : 8216
, "rsquo" : 8217
, "sbquo" : 8218
, "ldquo" : 8220
, "rdquo" : 8221
, "bdquo" : 8222
, "dagger" : 8224
, "Dagger" : 8225
, "bull" : 8226
, "hellip" : 8230
, "permil" : 8240
, "prime" : 8242
, "Prime" : 8243
, "lsaquo" : 8249
, "rsaquo" : 8250
, "oline" : 8254
, "frasl" : 8260
, "euro" : 8364
, "image" : 8465
, "weierp" : 8472
, "real" : 8476
, "trade" : 8482
, "alefsym" : 8501
, "larr" : 8592
, "uarr" : 8593
, "rarr" : 8594
, "darr" : 8595
, "harr" : 8596
, "crarr" : 8629
, "lArr" : 8656
, "uArr" : 8657
, "rArr" : 8658
, "dArr" : 8659
, "hArr" : 8660
, "forall" : 8704
, "part" : 8706
, "exist" : 8707
, "empty" : 8709
, "nabla" : 8711
, "isin" : 8712
, "notin" : 8713
, "ni" : 8715
, "prod" : 8719
, "sum" : 8721
, "minus" : 8722
, "lowast" : 8727
, "radic" : 8730
, "prop" : 8733
, "infin" : 8734
, "ang" : 8736
, "and" : 8743
, "or" : 8744
, "cap" : 8745
, "cup" : 8746
, "int" : 8747
, "there4" : 8756
, "sim" : 8764
, "cong" : 8773
, "asymp" : 8776
, "ne" : 8800
, "equiv" : 8801
, "le" : 8804
, "ge" : 8805
, "sub" : 8834
, "sup" : 8835
, "nsub" : 8836
, "sube" : 8838
, "supe" : 8839
, "oplus" : 8853
, "otimes" : 8855
, "perp" : 8869
, "sdot" : 8901
, "lceil" : 8968
, "rceil" : 8969
, "lfloor" : 8970
, "rfloor" : 8971
, "lang" : 9001
, "rang" : 9002
, "loz" : 9674
, "spades" : 9824
, "clubs" : 9827
, "hearts" : 9829
, "diams" : 9830
}

Object.keys(sax.ENTITIES).forEach(function (key) {
    var e = sax.ENTITIES[key]
    var s = typeof e === 'number' ? String.fromCharCode(e) : e
    sax.ENTITIES[key] = s
})

for (var S in sax.STATE) sax.STATE[sax.STATE[S]] = S

// shorthand
S = sax.STATE

function emit (parser, event, data) {
  parser[event] && parser[event](data)
}

function emitNode (parser, nodeType, data) {
  if (parser.textNode) closeText(parser)
  emit(parser, nodeType, data)
}

function closeText (parser) {
  parser.textNode = textopts(parser.opt, parser.textNode)
  if (parser.textNode) emit(parser, "ontext", parser.textNode)
  parser.textNode = ""
}

function textopts (opt, text) {
  if (opt.trim) text = text.trim()
  if (opt.normalize) text = text.replace(/\s+/g, " ")
  return text
}

function error (parser, er) {
  closeText(parser)
  if (parser.trackPosition) {
    er += "\nLine: "+parser.line+
          "\nColumn: "+parser.column+
          "\nChar: "+parser.c
  }
  er = new Error(er)
  parser.error = er
  emit(parser, "onerror", er)
  return parser
}

function end (parser) {
  if (!parser.closedRoot) strictFail(parser, "Unclosed root tag")
  if ((parser.state !== S.BEGIN) && (parser.state !== S.TEXT)) error(parser, "Unexpected end")
  closeText(parser)
  parser.c = ""
  parser.closed = true
  emit(parser, "onend")
  SAXParser.call(parser, parser.strict, parser.opt)
  return parser
}

function strictFail (parser, message) {
  if (typeof parser !== 'object' || !(parser instanceof SAXParser))
    throw new Error('bad call to strictFail');
  if (parser.strict) error(parser, message)
}

function newTag (parser) {
  if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]()
  var parent = parser.tags[parser.tags.length - 1] || parser
    , tag = parser.tag = { name : parser.tagName, attributes : {} }

  // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
  if (parser.opt.xmlns) tag.ns = parent.ns
  parser.attribList.length = 0
}

function qname (name, attribute) {
  var i = name.indexOf(":")
    , qualName = i < 0 ? [ "", name ] : name.split(":")
    , prefix = qualName[0]
    , local = qualName[1]

  // <x "xmlns"="http://foo">
  if (attribute && name === "xmlns") {
    prefix = "xmlns"
    local = ""
  }

  return { prefix: prefix, local: local }
}

function attrib (parser) {
  if (!parser.strict) parser.attribName = parser.attribName[parser.looseCase]()

  if (parser.attribList.indexOf(parser.attribName) !== -1 ||
      parser.tag.attributes.hasOwnProperty(parser.attribName)) {
    return parser.attribName = parser.attribValue = ""
  }

  if (parser.opt.xmlns) {
    var qn = qname(parser.attribName, true)
      , prefix = qn.prefix
      , local = qn.local

    if (prefix === "xmlns") {
      // namespace binding attribute; push the binding into scope
      if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
        strictFail( parser
                  , "xml: prefix must be bound to " + XML_NAMESPACE + "\n"
                  + "Actual: " + parser.attribValue )
      } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
        strictFail( parser
                  , "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\n"
                  + "Actual: " + parser.attribValue )
      } else {
        var tag = parser.tag
          , parent = parser.tags[parser.tags.length - 1] || parser
        if (tag.ns === parent.ns) {
          tag.ns = Object.create(parent.ns)
        }
        tag.ns[local] = parser.attribValue
      }
    }

    // defer onattribute events until all attributes have been seen
    // so any new bindings can take effect; preserve attribute order
    // so deferred events can be emitted in document order
    parser.attribList.push([parser.attribName, parser.attribValue])
  } else {
    // in non-xmlns mode, we can emit the event right away
    parser.tag.attributes[parser.attribName] = parser.attribValue
    emitNode( parser
            , "onattribute"
            , { name: parser.attribName
              , value: parser.attribValue } )
  }

  parser.attribName = parser.attribValue = ""
}

function openTag (parser, selfClosing) {
  if (parser.opt.xmlns) {
    // emit namespace binding events
    var tag = parser.tag

    // add namespace info to tag
    var qn = qname(parser.tagName)
    tag.prefix = qn.prefix
    tag.local = qn.local
    tag.uri = tag.ns[qn.prefix] || ""

    if (tag.prefix && !tag.uri) {
      strictFail(parser, "Unbound namespace prefix: "
                       + JSON.stringify(parser.tagName))
      tag.uri = qn.prefix
    }

    var parent = parser.tags[parser.tags.length - 1] || parser
    if (tag.ns && parent.ns !== tag.ns) {
      Object.keys(tag.ns).forEach(function (p) {
        emitNode( parser
                , "onopennamespace"
                , { prefix: p , uri: tag.ns[p] } )
      })
    }

    // handle deferred onattribute events
    // Note: do not apply default ns to attributes:
    //   http://www.w3.org/TR/REC-xml-names/#defaulting
    for (var i = 0, l = parser.attribList.length; i < l; i ++) {
      var nv = parser.attribList[i]
      var name = nv[0]
        , value = nv[1]
        , qualName = qname(name, true)
        , prefix = qualName.prefix
        , local = qualName.local
        , uri = prefix == "" ? "" : (tag.ns[prefix] || "")
        , a = { name: name
              , value: value
              , prefix: prefix
              , local: local
              , uri: uri
              }

      // if there's any attributes with an undefined namespace,
      // then fail on them now.
      if (prefix && prefix != "xmlns" && !uri) {
        strictFail(parser, "Unbound namespace prefix: "
                         + JSON.stringify(prefix))
        a.uri = prefix
      }
      parser.tag.attributes[name] = a
      emitNode(parser, "onattribute", a)
    }
    parser.attribList.length = 0
  }

  parser.tag.isSelfClosing = !!selfClosing

  // process the tag
  parser.sawRoot = true
  parser.tags.push(parser.tag)
  emitNode(parser, "onopentag", parser.tag)
  if (!selfClosing) {
    // special case for <script> in non-strict mode.
    if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
      parser.state = S.SCRIPT
    } else {
      parser.state = S.TEXT
    }
    parser.tag = null
    parser.tagName = ""
  }
  parser.attribName = parser.attribValue = ""
  parser.attribList.length = 0
}

function closeTag (parser) {
  if (!parser.tagName) {
    strictFail(parser, "Weird empty close tag.")
    parser.textNode += "</>"
    parser.state = S.TEXT
    return
  }

  if (parser.script) {
    if (parser.tagName !== "script") {
      parser.script += "</" + parser.tagName + ">"
      parser.tagName = ""
      parser.state = S.SCRIPT
      return
    }
    emitNode(parser, "onscript", parser.script)
    parser.script = ""
  }

  // first make sure that the closing tag actually exists.
  // <a><b></c></b></a> will close everything, otherwise.
  var t = parser.tags.length
  var tagName = parser.tagName
  if (!parser.strict) tagName = tagName[parser.looseCase]()
  var closeTo = tagName
  while (t --) {
    var close = parser.tags[t]
    if (close.name !== closeTo) {
      // fail the first time in strict mode
      strictFail(parser, "Unexpected close tag")
    } else break
  }

  // didn't find it.  we already failed for strict, so just abort.
  if (t < 0) {
    strictFail(parser, "Unmatched closing tag: "+parser.tagName)
    parser.textNode += "</" + parser.tagName + ">"
    parser.state = S.TEXT
    return
  }
  parser.tagName = tagName
  var s = parser.tags.length
  while (s --> t) {
    var tag = parser.tag = parser.tags.pop()
    parser.tagName = parser.tag.name
    emitNode(parser, "onclosetag", parser.tagName)

    var x = {}
    for (var i in tag.ns) x[i] = tag.ns[i]

    var parent = parser.tags[parser.tags.length - 1] || parser
    if (parser.opt.xmlns && tag.ns !== parent.ns) {
      // remove namespace bindings introduced by tag
      Object.keys(tag.ns).forEach(function (p) {
        var n = tag.ns[p]
        emitNode(parser, "onclosenamespace", { prefix: p, uri: n })
      })
    }
  }
  if (t === 0) parser.closedRoot = true
  parser.tagName = parser.attribValue = parser.attribName = ""
  parser.attribList.length = 0
  parser.state = S.TEXT
}

function parseEntity (parser) {
  var entity = parser.entity
    , entityLC = entity.toLowerCase()
    , num
    , numStr = ""
  if (parser.ENTITIES[entity])
    return parser.ENTITIES[entity]
  if (parser.ENTITIES[entityLC])
    return parser.ENTITIES[entityLC]
  entity = entityLC
  if (entity.charAt(0) === "#") {
    if (entity.charAt(1) === "x") {
      entity = entity.slice(2)
      num = parseInt(entity, 16)
      numStr = num.toString(16)
    } else {
      entity = entity.slice(1)
      num = parseInt(entity, 10)
      numStr = num.toString(10)
    }
  }
  entity = entity.replace(/^0+/, "")
  if (numStr.toLowerCase() !== entity) {
    strictFail(parser, "Invalid character entity")
    return "&"+parser.entity + ";"
  }

  return String.fromCodePoint(num)
}

function write (chunk) {
  var parser = this
  if (this.error) throw this.error
  if (parser.closed) return error(parser,
    "Cannot write after close. Assign an onready handler.")
  if (chunk === null) return end(parser)
  var i = 0, c = ""
  while (parser.c = c = chunk.charAt(i++)) {
    if (parser.trackPosition) {
      parser.position ++
      if (c === "\n") {
        parser.line ++
        parser.column = 0
      } else parser.column ++
    }
    switch (parser.state) {

      case S.BEGIN:
        if (c === "<") {
          parser.state = S.OPEN_WAKA
          parser.startTagPosition = parser.position
        } else if (not(whitespace,c)) {
          // have to process this as a text node.
          // weird, but happens.
          strictFail(parser, "Non-whitespace before first tag.")
          parser.textNode = c
          parser.state = S.TEXT
        }
      continue

      case S.TEXT:
        if (parser.sawRoot && !parser.closedRoot) {
          var starti = i-1
          while (c && c!=="<" && c!=="&") {
            c = chunk.charAt(i++)
            if (c && parser.trackPosition) {
              parser.position ++
              if (c === "\n") {
                parser.line ++
                parser.column = 0
              } else parser.column ++
            }
          }
          parser.textNode += chunk.substring(starti, i-1)
        }
        if (c === "<") {
          parser.state = S.OPEN_WAKA
          parser.startTagPosition = parser.position
        } else {
          if (not(whitespace, c) && (!parser.sawRoot || parser.closedRoot))
            strictFail(parser, "Text data outside of root node.")
          if (c === "&") parser.state = S.TEXT_ENTITY
          else parser.textNode += c
        }
      continue

      case S.SCRIPT:
        // only non-strict
        if (c === "<") {
          parser.state = S.SCRIPT_ENDING
        } else parser.script += c
      continue

      case S.SCRIPT_ENDING:
        if (c === "/") {
          parser.state = S.CLOSE_TAG
        } else {
          parser.script += "<" + c
          parser.state = S.SCRIPT
        }
      continue

      case S.OPEN_WAKA:
        // either a /, ?, !, or text is coming next.
        if (c === "!") {
          parser.state = S.SGML_DECL
          parser.sgmlDecl = ""
        } else if (is(whitespace, c)) {
          // wait for it...
        } else if (is(nameStart,c)) {
          parser.state = S.OPEN_TAG
          parser.tagName = c
        } else if (c === "/") {
          parser.state = S.CLOSE_TAG
          parser.tagName = ""
        } else if (c === "?") {
          parser.state = S.PROC_INST
          parser.procInstName = parser.procInstBody = ""
        } else {
          strictFail(parser, "Unencoded <")
          // if there was some whitespace, then add that in.
          if (parser.startTagPosition + 1 < parser.position) {
            var pad = parser.position - parser.startTagPosition
            c = new Array(pad).join(" ") + c
          }
          parser.textNode += "<" + c
          parser.state = S.TEXT
        }
      continue

      case S.SGML_DECL:
        if ((parser.sgmlDecl+c).toUpperCase() === CDATA) {
          emitNode(parser, "onopencdata")
          parser.state = S.CDATA
          parser.sgmlDecl = ""
          parser.cdata = ""
        } else if (parser.sgmlDecl+c === "--") {
          parser.state = S.COMMENT
          parser.comment = ""
          parser.sgmlDecl = ""
        } else if ((parser.sgmlDecl+c).toUpperCase() === DOCTYPE) {
          parser.state = S.DOCTYPE
          if (parser.doctype || parser.sawRoot) strictFail(parser,
            "Inappropriately located doctype declaration")
          parser.doctype = ""
          parser.sgmlDecl = ""
        } else if (c === ">") {
          emitNode(parser, "onsgmldeclaration", parser.sgmlDecl)
          parser.sgmlDecl = ""
          parser.state = S.TEXT
        } else if (is(quote, c)) {
          parser.state = S.SGML_DECL_QUOTED
          parser.sgmlDecl += c
        } else parser.sgmlDecl += c
      continue

      case S.SGML_DECL_QUOTED:
        if (c === parser.q) {
          parser.state = S.SGML_DECL
          parser.q = ""
        }
        parser.sgmlDecl += c
      continue

      case S.DOCTYPE:
        if (c === ">") {
          parser.state = S.TEXT
          emitNode(parser, "ondoctype", parser.doctype)
          parser.doctype = true // just remember that we saw it.
        } else {
          parser.doctype += c
          if (c === "[") parser.state = S.DOCTYPE_DTD
          else if (is(quote, c)) {
            parser.state = S.DOCTYPE_QUOTED
            parser.q = c
          }
        }
      continue

      case S.DOCTYPE_QUOTED:
        parser.doctype += c
        if (c === parser.q) {
          parser.q = ""
          parser.state = S.DOCTYPE
        }
      continue

      case S.DOCTYPE_DTD:
        parser.doctype += c
        if (c === "]") parser.state = S.DOCTYPE
        else if (is(quote,c)) {
          parser.state = S.DOCTYPE_DTD_QUOTED
          parser.q = c
        }
      continue

      case S.DOCTYPE_DTD_QUOTED:
        parser.doctype += c
        if (c === parser.q) {
          parser.state = S.DOCTYPE_DTD
          parser.q = ""
        }
      continue

      case S.COMMENT:
        if (c === "-") parser.state = S.COMMENT_ENDING
        else parser.comment += c
      continue

      case S.COMMENT_ENDING:
        if (c === "-") {
          parser.state = S.COMMENT_ENDED
          parser.comment = textopts(parser.opt, parser.comment)
          if (parser.comment) emitNode(parser, "oncomment", parser.comment)
          parser.comment = ""
        } else {
          parser.comment += "-" + c
          parser.state = S.COMMENT
        }
      continue

      case S.COMMENT_ENDED:
        if (c !== ">") {
          strictFail(parser, "Malformed comment")
          // allow <!-- blah -- bloo --> in non-strict mode,
          // which is a comment of " blah -- bloo "
          parser.comment += "--" + c
          parser.state = S.COMMENT
        } else parser.state = S.TEXT
      continue

      case S.CDATA:
        if (c === "]") parser.state = S.CDATA_ENDING
        else parser.cdata += c
      continue

      case S.CDATA_ENDING:
        if (c === "]") parser.state = S.CDATA_ENDING_2
        else {
          parser.cdata += "]" + c
          parser.state = S.CDATA
        }
      continue

      case S.CDATA_ENDING_2:
        if (c === ">") {
          if (parser.cdata) emitNode(parser, "oncdata", parser.cdata)
          emitNode(parser, "onclosecdata")
          parser.cdata = ""
          parser.state = S.TEXT
        } else if (c === "]") {
          parser.cdata += "]"
        } else {
          parser.cdata += "]]" + c
          parser.state = S.CDATA
        }
      continue

      case S.PROC_INST:
        if (c === "?") parser.state = S.PROC_INST_ENDING
        else if (is(whitespace, c)) parser.state = S.PROC_INST_BODY
        else parser.procInstName += c
      continue

      case S.PROC_INST_BODY:
        if (!parser.procInstBody && is(whitespace, c)) continue
        else if (c === "?") parser.state = S.PROC_INST_ENDING
        else parser.procInstBody += c
      continue

      case S.PROC_INST_ENDING:
        if (c === ">") {
          emitNode(parser, "onprocessinginstruction", {
            name : parser.procInstName,
            body : parser.procInstBody
          })
          parser.procInstName = parser.procInstBody = ""
          parser.state = S.TEXT
        } else {
          parser.procInstBody += "?" + c
          parser.state = S.PROC_INST_BODY
        }
      continue

      case S.OPEN_TAG:
        if (is(nameBody, c)) parser.tagName += c
        else {
          newTag(parser)
          if (c === ">") openTag(parser)
          else if (c === "/") parser.state = S.OPEN_TAG_SLASH
          else {
            if (not(whitespace, c)) strictFail(
              parser, "Invalid character in tag name")
            parser.state = S.ATTRIB
          }
        }
      continue

      case S.OPEN_TAG_SLASH:
        if (c === ">") {
          openTag(parser, true)
          closeTag(parser)
        } else {
          strictFail(parser, "Forward-slash in opening tag not followed by >")
          parser.state = S.ATTRIB
        }
      continue

      case S.ATTRIB:
        // haven't read the attribute name yet.
        if (is(whitespace, c)) continue
        else if (c === ">") openTag(parser)
        else if (c === "/") parser.state = S.OPEN_TAG_SLASH
        else if (is(nameStart, c)) {
          parser.attribName = c
          parser.attribValue = ""
          parser.state = S.ATTRIB_NAME
        } else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_NAME:
        if (c === "=") parser.state = S.ATTRIB_VALUE
        else if (c === ">") {
          strictFail(parser, "Attribute without value")
          parser.attribValue = parser.attribName
          attrib(parser)
          openTag(parser)
        }
        else if (is(whitespace, c)) parser.state = S.ATTRIB_NAME_SAW_WHITE
        else if (is(nameBody, c)) parser.attribName += c
        else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_NAME_SAW_WHITE:
        if (c === "=") parser.state = S.ATTRIB_VALUE
        else if (is(whitespace, c)) continue
        else {
          strictFail(parser, "Attribute without value")
          parser.tag.attributes[parser.attribName] = ""
          parser.attribValue = ""
          emitNode(parser, "onattribute",
                   { name : parser.attribName, value : "" })
          parser.attribName = ""
          if (c === ">") openTag(parser)
          else if (is(nameStart, c)) {
            parser.attribName = c
            parser.state = S.ATTRIB_NAME
          } else {
            strictFail(parser, "Invalid attribute name")
            parser.state = S.ATTRIB
          }
        }
      continue

      case S.ATTRIB_VALUE:
        if (is(whitespace, c)) continue
        else if (is(quote, c)) {
          parser.q = c
          parser.state = S.ATTRIB_VALUE_QUOTED
        } else {
          strictFail(parser, "Unquoted attribute value")
          parser.state = S.ATTRIB_VALUE_UNQUOTED
          parser.attribValue = c
        }
      continue

      case S.ATTRIB_VALUE_QUOTED:
        if (c !== parser.q) {
          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_Q
          else parser.attribValue += c
          continue
        }
        attrib(parser)
        parser.q = ""
        parser.state = S.ATTRIB_VALUE_CLOSED
      continue

      case S.ATTRIB_VALUE_CLOSED:
        if (is(whitespace, c)) {
          parser.state = S.ATTRIB
        } else if (c === ">") openTag(parser)
        else if (c === "/") parser.state = S.OPEN_TAG_SLASH
        else if (is(nameStart, c)) {
          strictFail(parser, "No whitespace between attributes")
          parser.attribName = c
          parser.attribValue = ""
          parser.state = S.ATTRIB_NAME
        } else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_VALUE_UNQUOTED:
        if (not(attribEnd,c)) {
          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_U
          else parser.attribValue += c
          continue
        }
        attrib(parser)
        if (c === ">") openTag(parser)
        else parser.state = S.ATTRIB
      continue

      case S.CLOSE_TAG:
        if (!parser.tagName) {
          if (is(whitespace, c)) continue
          else if (not(nameStart, c)) {
            if (parser.script) {
              parser.script += "</" + c
              parser.state = S.SCRIPT
            } else {
              strictFail(parser, "Invalid tagname in closing tag.")
            }
          } else parser.tagName = c
        }
        else if (c === ">") closeTag(parser)
        else if (is(nameBody, c)) parser.tagName += c
        else if (parser.script) {
          parser.script += "</" + parser.tagName
          parser.tagName = ""
          parser.state = S.SCRIPT
        } else {
          if (not(whitespace, c)) strictFail(parser,
            "Invalid tagname in closing tag")
          parser.state = S.CLOSE_TAG_SAW_WHITE
        }
      continue

      case S.CLOSE_TAG_SAW_WHITE:
        if (is(whitespace, c)) continue
        if (c === ">") closeTag(parser)
        else strictFail(parser, "Invalid characters in closing tag")
      continue

      case S.TEXT_ENTITY:
      case S.ATTRIB_VALUE_ENTITY_Q:
      case S.ATTRIB_VALUE_ENTITY_U:
        switch(parser.state) {
          case S.TEXT_ENTITY:
            var returnState = S.TEXT, buffer = "textNode"
          break

          case S.ATTRIB_VALUE_ENTITY_Q:
            var returnState = S.ATTRIB_VALUE_QUOTED, buffer = "attribValue"
          break

          case S.ATTRIB_VALUE_ENTITY_U:
            var returnState = S.ATTRIB_VALUE_UNQUOTED, buffer = "attribValue"
          break
        }
        if (c === ";") {
          parser[buffer] += parseEntity(parser)
          parser.entity = ""
          parser.state = returnState
        }
        else if (is(entity, c)) parser.entity += c
        else {
          strictFail(parser, "Invalid character entity")
          parser[buffer] += "&" + parser.entity + c
          parser.entity = ""
          parser.state = returnState
        }
      continue

      default:
        throw new Error(parser, "Unknown state: " + parser.state)
    }
  } // while
  // cdata blocks can get very big under normal conditions. emit and move on.
  // if (parser.state === S.CDATA && parser.cdata) {
  //   emitNode(parser, "oncdata", parser.cdata)
  //   parser.cdata = ""
  // }
  if (parser.position >= parser.bufferCheckPosition) checkBufferLength(parser)
  return parser
}

/*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
if (!String.fromCodePoint) {
        (function() {
                var stringFromCharCode = String.fromCharCode;
                var floor = Math.floor;
                var fromCodePoint = function() {
                        var MAX_SIZE = 0x4000;
                        var codeUnits = [];
                        var highSurrogate;
                        var lowSurrogate;
                        var index = -1;
                        var length = arguments.length;
                        if (!length) {
                                return '';
                        }
                        var result = '';
                        while (++index < length) {
                                var codePoint = Number(arguments[index]);
                                if (
                                        !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
                                        codePoint < 0 || // not a valid Unicode code point
                                        codePoint > 0x10FFFF || // not a valid Unicode code point
                                        floor(codePoint) != codePoint // not an integer
                                ) {
                                        throw RangeError('Invalid code point: ' + codePoint);
                                }
                                if (codePoint <= 0xFFFF) { // BMP code point
                                        codeUnits.push(codePoint);
                                } else { // Astral code point; split in surrogate halves
                                        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                                        codePoint -= 0x10000;
                                        highSurrogate = (codePoint >> 10) + 0xD800;
                                        lowSurrogate = (codePoint % 0x400) + 0xDC00;
                                        codeUnits.push(highSurrogate, lowSurrogate);
                                }
                                if (index + 1 == length || codeUnits.length > MAX_SIZE) {
                                        result += stringFromCharCode.apply(null, codeUnits);
                                        codeUnits.length = 0;
                                }
                        }
                        return result;
                };
                if (Object.defineProperty) {
                        Object.defineProperty(String, 'fromCodePoint', {
                                'value': fromCodePoint,
                                'configurable': true,
                                'writable': true
                        });
                } else {
                        String.fromCodePoint = fromCodePoint;
                }
        }());
}

})(typeof exports === "undefined" ? sax = {} : exports);

}).call(this,undefined)
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9kbW4tbW9kZGxlL25vZGVfbW9kdWxlcy9tb2RkbGUteG1sL25vZGVfbW9kdWxlcy9zYXgvbGliL3NheC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIi8vIHdyYXBwZXIgZm9yIG5vbi1ub2RlIGVudnNcbjsoZnVuY3Rpb24gKHNheCkge1xuXG5zYXgucGFyc2VyID0gZnVuY3Rpb24gKHN0cmljdCwgb3B0KSB7IHJldHVybiBuZXcgU0FYUGFyc2VyKHN0cmljdCwgb3B0KSB9XG5zYXguU0FYUGFyc2VyID0gU0FYUGFyc2VyXG5zYXguU0FYU3RyZWFtID0gU0FYU3RyZWFtXG5zYXguY3JlYXRlU3RyZWFtID0gY3JlYXRlU3RyZWFtXG5cbi8vIFdoZW4gd2UgcGFzcyB0aGUgTUFYX0JVRkZFUl9MRU5HVEggcG9zaXRpb24sIHN0YXJ0IGNoZWNraW5nIGZvciBidWZmZXIgb3ZlcnJ1bnMuXG4vLyBXaGVuIHdlIGNoZWNrLCBzY2hlZHVsZSB0aGUgbmV4dCBjaGVjayBmb3IgTUFYX0JVRkZFUl9MRU5HVEggLSAobWF4KGJ1ZmZlciBsZW5ndGhzKSksXG4vLyBzaW5jZSB0aGF0J3MgdGhlIGVhcmxpZXN0IHRoYXQgYSBidWZmZXIgb3ZlcnJ1biBjb3VsZCBvY2N1ci4gIFRoaXMgd2F5LCBjaGVja3MgYXJlXG4vLyBhcyByYXJlIGFzIHJlcXVpcmVkLCBidXQgYXMgb2Z0ZW4gYXMgbmVjZXNzYXJ5IHRvIGVuc3VyZSBuZXZlciBjcm9zc2luZyB0aGlzIGJvdW5kLlxuLy8gRnVydGhlcm1vcmUsIGJ1ZmZlcnMgYXJlIG9ubHkgdGVzdGVkIGF0IG1vc3Qgb25jZSBwZXIgd3JpdGUoKSwgc28gcGFzc2luZyBhIHZlcnlcbi8vIGxhcmdlIHN0cmluZyBpbnRvIHdyaXRlKCkgbWlnaHQgaGF2ZSB1bmRlc2lyYWJsZSBlZmZlY3RzLCBidXQgdGhpcyBpcyBtYW5hZ2VhYmxlIGJ5XG4vLyB0aGUgY2FsbGVyLCBzbyBpdCBpcyBhc3N1bWVkIHRvIGJlIHNhZmUuICBUaHVzLCBhIGNhbGwgdG8gd3JpdGUoKSBtYXksIGluIHRoZSBleHRyZW1lXG4vLyBlZGdlIGNhc2UsIHJlc3VsdCBpbiBjcmVhdGluZyBhdCBtb3N0IG9uZSBjb21wbGV0ZSBjb3B5IG9mIHRoZSBzdHJpbmcgcGFzc2VkIGluLlxuLy8gU2V0IHRvIEluZmluaXR5IHRvIGhhdmUgdW5saW1pdGVkIGJ1ZmZlcnMuXG5zYXguTUFYX0JVRkZFUl9MRU5HVEggPSA2NCAqIDEwMjRcblxudmFyIGJ1ZmZlcnMgPSBbXG4gIFwiY29tbWVudFwiLCBcInNnbWxEZWNsXCIsIFwidGV4dE5vZGVcIiwgXCJ0YWdOYW1lXCIsIFwiZG9jdHlwZVwiLFxuICBcInByb2NJbnN0TmFtZVwiLCBcInByb2NJbnN0Qm9keVwiLCBcImVudGl0eVwiLCBcImF0dHJpYk5hbWVcIixcbiAgXCJhdHRyaWJWYWx1ZVwiLCBcImNkYXRhXCIsIFwic2NyaXB0XCJcbl1cblxuc2F4LkVWRU5UUyA9IC8vIGZvciBkaXNjb3ZlcmFiaWxpdHkuXG4gIFsgXCJ0ZXh0XCJcbiAgLCBcInByb2Nlc3NpbmdpbnN0cnVjdGlvblwiXG4gICwgXCJzZ21sZGVjbGFyYXRpb25cIlxuICAsIFwiZG9jdHlwZVwiXG4gICwgXCJjb21tZW50XCJcbiAgLCBcImF0dHJpYnV0ZVwiXG4gICwgXCJvcGVudGFnXCJcbiAgLCBcImNsb3NldGFnXCJcbiAgLCBcIm9wZW5jZGF0YVwiXG4gICwgXCJjZGF0YVwiXG4gICwgXCJjbG9zZWNkYXRhXCJcbiAgLCBcImVycm9yXCJcbiAgLCBcImVuZFwiXG4gICwgXCJyZWFkeVwiXG4gICwgXCJzY3JpcHRcIlxuICAsIFwib3Blbm5hbWVzcGFjZVwiXG4gICwgXCJjbG9zZW5hbWVzcGFjZVwiXG4gIF1cblxuZnVuY3Rpb24gU0FYUGFyc2VyIChzdHJpY3QsIG9wdCkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU0FYUGFyc2VyKSkgcmV0dXJuIG5ldyBTQVhQYXJzZXIoc3RyaWN0LCBvcHQpXG5cbiAgdmFyIHBhcnNlciA9IHRoaXNcbiAgY2xlYXJCdWZmZXJzKHBhcnNlcilcbiAgcGFyc2VyLnEgPSBwYXJzZXIuYyA9IFwiXCJcbiAgcGFyc2VyLmJ1ZmZlckNoZWNrUG9zaXRpb24gPSBzYXguTUFYX0JVRkZFUl9MRU5HVEhcbiAgcGFyc2VyLm9wdCA9IG9wdCB8fCB7fVxuICBwYXJzZXIub3B0Lmxvd2VyY2FzZSA9IHBhcnNlci5vcHQubG93ZXJjYXNlIHx8IHBhcnNlci5vcHQubG93ZXJjYXNldGFnc1xuICBwYXJzZXIubG9vc2VDYXNlID0gcGFyc2VyLm9wdC5sb3dlcmNhc2UgPyBcInRvTG93ZXJDYXNlXCIgOiBcInRvVXBwZXJDYXNlXCJcbiAgcGFyc2VyLnRhZ3MgPSBbXVxuICBwYXJzZXIuY2xvc2VkID0gcGFyc2VyLmNsb3NlZFJvb3QgPSBwYXJzZXIuc2F3Um9vdCA9IGZhbHNlXG4gIHBhcnNlci50YWcgPSBwYXJzZXIuZXJyb3IgPSBudWxsXG4gIHBhcnNlci5zdHJpY3QgPSAhIXN0cmljdFxuICBwYXJzZXIubm9zY3JpcHQgPSAhIShzdHJpY3QgfHwgcGFyc2VyLm9wdC5ub3NjcmlwdClcbiAgcGFyc2VyLnN0YXRlID0gUy5CRUdJTlxuICBwYXJzZXIuRU5USVRJRVMgPSBPYmplY3QuY3JlYXRlKHNheC5FTlRJVElFUylcbiAgcGFyc2VyLmF0dHJpYkxpc3QgPSBbXVxuXG4gIC8vIG5hbWVzcGFjZXMgZm9ybSBhIHByb3RvdHlwZSBjaGFpbi5cbiAgLy8gaXQgYWx3YXlzIHBvaW50cyBhdCB0aGUgY3VycmVudCB0YWcsXG4gIC8vIHdoaWNoIHByb3RvcyB0byBpdHMgcGFyZW50IHRhZy5cbiAgaWYgKHBhcnNlci5vcHQueG1sbnMpIHBhcnNlci5ucyA9IE9iamVjdC5jcmVhdGUocm9vdE5TKVxuXG4gIC8vIG1vc3RseSBqdXN0IGZvciBlcnJvciByZXBvcnRpbmdcbiAgcGFyc2VyLnRyYWNrUG9zaXRpb24gPSBwYXJzZXIub3B0LnBvc2l0aW9uICE9PSBmYWxzZVxuICBpZiAocGFyc2VyLnRyYWNrUG9zaXRpb24pIHtcbiAgICBwYXJzZXIucG9zaXRpb24gPSBwYXJzZXIubGluZSA9IHBhcnNlci5jb2x1bW4gPSAwXG4gIH1cbiAgZW1pdChwYXJzZXIsIFwib25yZWFkeVwiKVxufVxuXG5pZiAoIU9iamVjdC5jcmVhdGUpIE9iamVjdC5jcmVhdGUgPSBmdW5jdGlvbiAobykge1xuICBmdW5jdGlvbiBmICgpIHsgdGhpcy5fX3Byb3RvX18gPSBvIH1cbiAgZi5wcm90b3R5cGUgPSBvXG4gIHJldHVybiBuZXcgZlxufVxuXG5pZiAoIU9iamVjdC5nZXRQcm90b3R5cGVPZikgT2JqZWN0LmdldFByb3RvdHlwZU9mID0gZnVuY3Rpb24gKG8pIHtcbiAgcmV0dXJuIG8uX19wcm90b19fXG59XG5cbmlmICghT2JqZWN0LmtleXMpIE9iamVjdC5rZXlzID0gZnVuY3Rpb24gKG8pIHtcbiAgdmFyIGEgPSBbXVxuICBmb3IgKHZhciBpIGluIG8pIGlmIChvLmhhc093blByb3BlcnR5KGkpKSBhLnB1c2goaSlcbiAgcmV0dXJuIGFcbn1cblxuZnVuY3Rpb24gY2hlY2tCdWZmZXJMZW5ndGggKHBhcnNlcikge1xuICB2YXIgbWF4QWxsb3dlZCA9IE1hdGgubWF4KHNheC5NQVhfQlVGRkVSX0xFTkdUSCwgMTApXG4gICAgLCBtYXhBY3R1YWwgPSAwXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYnVmZmVycy5sZW5ndGg7IGkgPCBsOyBpICsrKSB7XG4gICAgdmFyIGxlbiA9IHBhcnNlcltidWZmZXJzW2ldXS5sZW5ndGhcbiAgICBpZiAobGVuID4gbWF4QWxsb3dlZCkge1xuICAgICAgLy8gVGV4dC9jZGF0YSBub2RlcyBjYW4gZ2V0IGJpZywgYW5kIHNpbmNlIHRoZXkncmUgYnVmZmVyZWQsXG4gICAgICAvLyB3ZSBjYW4gZ2V0IGhlcmUgdW5kZXIgbm9ybWFsIGNvbmRpdGlvbnMuXG4gICAgICAvLyBBdm9pZCBpc3N1ZXMgYnkgZW1pdHRpbmcgdGhlIHRleHQgbm9kZSBub3csXG4gICAgICAvLyBzbyBhdCBsZWFzdCBpdCB3b24ndCBnZXQgYW55IGJpZ2dlci5cbiAgICAgIHN3aXRjaCAoYnVmZmVyc1tpXSkge1xuICAgICAgICBjYXNlIFwidGV4dE5vZGVcIjpcbiAgICAgICAgICBjbG9zZVRleHQocGFyc2VyKVxuICAgICAgICBicmVha1xuXG4gICAgICAgIGNhc2UgXCJjZGF0YVwiOlxuICAgICAgICAgIGVtaXROb2RlKHBhcnNlciwgXCJvbmNkYXRhXCIsIHBhcnNlci5jZGF0YSlcbiAgICAgICAgICBwYXJzZXIuY2RhdGEgPSBcIlwiXG4gICAgICAgIGJyZWFrXG5cbiAgICAgICAgY2FzZSBcInNjcmlwdFwiOlxuICAgICAgICAgIGVtaXROb2RlKHBhcnNlciwgXCJvbnNjcmlwdFwiLCBwYXJzZXIuc2NyaXB0KVxuICAgICAgICAgIHBhcnNlci5zY3JpcHQgPSBcIlwiXG4gICAgICAgIGJyZWFrXG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBlcnJvcihwYXJzZXIsIFwiTWF4IGJ1ZmZlciBsZW5ndGggZXhjZWVkZWQ6IFwiK2J1ZmZlcnNbaV0pXG4gICAgICB9XG4gICAgfVxuICAgIG1heEFjdHVhbCA9IE1hdGgubWF4KG1heEFjdHVhbCwgbGVuKVxuICB9XG4gIC8vIHNjaGVkdWxlIHRoZSBuZXh0IGNoZWNrIGZvciB0aGUgZWFybGllc3QgcG9zc2libGUgYnVmZmVyIG92ZXJydW4uXG4gIHBhcnNlci5idWZmZXJDaGVja1Bvc2l0aW9uID0gKHNheC5NQVhfQlVGRkVSX0xFTkdUSCAtIG1heEFjdHVhbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBwYXJzZXIucG9zaXRpb25cbn1cblxuZnVuY3Rpb24gY2xlYXJCdWZmZXJzIChwYXJzZXIpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBidWZmZXJzLmxlbmd0aDsgaSA8IGw7IGkgKyspIHtcbiAgICBwYXJzZXJbYnVmZmVyc1tpXV0gPSBcIlwiXG4gIH1cbn1cblxuZnVuY3Rpb24gZmx1c2hCdWZmZXJzIChwYXJzZXIpIHtcbiAgY2xvc2VUZXh0KHBhcnNlcilcbiAgaWYgKHBhcnNlci5jZGF0YSAhPT0gXCJcIikge1xuICAgIGVtaXROb2RlKHBhcnNlciwgXCJvbmNkYXRhXCIsIHBhcnNlci5jZGF0YSlcbiAgICBwYXJzZXIuY2RhdGEgPSBcIlwiXG4gIH1cbiAgaWYgKHBhcnNlci5zY3JpcHQgIT09IFwiXCIpIHtcbiAgICBlbWl0Tm9kZShwYXJzZXIsIFwib25zY3JpcHRcIiwgcGFyc2VyLnNjcmlwdClcbiAgICBwYXJzZXIuc2NyaXB0ID0gXCJcIlxuICB9XG59XG5cblNBWFBhcnNlci5wcm90b3R5cGUgPVxuICB7IGVuZDogZnVuY3Rpb24gKCkgeyBlbmQodGhpcykgfVxuICAsIHdyaXRlOiB3cml0ZVxuICAsIHJlc3VtZTogZnVuY3Rpb24gKCkgeyB0aGlzLmVycm9yID0gbnVsbDsgcmV0dXJuIHRoaXMgfVxuICAsIGNsb3NlOiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLndyaXRlKG51bGwpIH1cbiAgLCBmbHVzaDogZnVuY3Rpb24gKCkgeyBmbHVzaEJ1ZmZlcnModGhpcykgfVxuICB9XG5cbnRyeSB7XG4gIHZhciBTdHJlYW0gPSByZXF1aXJlKFwic3RyZWFtXCIpLlN0cmVhbVxufSBjYXRjaCAoZXgpIHtcbiAgdmFyIFN0cmVhbSA9IGZ1bmN0aW9uICgpIHt9XG59XG5cblxudmFyIHN0cmVhbVdyYXBzID0gc2F4LkVWRU5UUy5maWx0ZXIoZnVuY3Rpb24gKGV2KSB7XG4gIHJldHVybiBldiAhPT0gXCJlcnJvclwiICYmIGV2ICE9PSBcImVuZFwiXG59KVxuXG5mdW5jdGlvbiBjcmVhdGVTdHJlYW0gKHN0cmljdCwgb3B0KSB7XG4gIHJldHVybiBuZXcgU0FYU3RyZWFtKHN0cmljdCwgb3B0KVxufVxuXG5mdW5jdGlvbiBTQVhTdHJlYW0gKHN0cmljdCwgb3B0KSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTQVhTdHJlYW0pKSByZXR1cm4gbmV3IFNBWFN0cmVhbShzdHJpY3QsIG9wdClcblxuICBTdHJlYW0uYXBwbHkodGhpcylcblxuICB0aGlzLl9wYXJzZXIgPSBuZXcgU0FYUGFyc2VyKHN0cmljdCwgb3B0KVxuICB0aGlzLndyaXRhYmxlID0gdHJ1ZVxuICB0aGlzLnJlYWRhYmxlID0gdHJ1ZVxuXG5cbiAgdmFyIG1lID0gdGhpc1xuXG4gIHRoaXMuX3BhcnNlci5vbmVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBtZS5lbWl0KFwiZW5kXCIpXG4gIH1cblxuICB0aGlzLl9wYXJzZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcikge1xuICAgIG1lLmVtaXQoXCJlcnJvclwiLCBlcilcblxuICAgIC8vIGlmIGRpZG4ndCB0aHJvdywgdGhlbiBtZWFucyBlcnJvciB3YXMgaGFuZGxlZC5cbiAgICAvLyBnbyBhaGVhZCBhbmQgY2xlYXIgZXJyb3IsIHNvIHdlIGNhbiB3cml0ZSBhZ2Fpbi5cbiAgICBtZS5fcGFyc2VyLmVycm9yID0gbnVsbFxuICB9XG5cbiAgdGhpcy5fZGVjb2RlciA9IG51bGw7XG5cbiAgc3RyZWFtV3JhcHMuZm9yRWFjaChmdW5jdGlvbiAoZXYpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobWUsIFwib25cIiArIGV2LCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1lLl9wYXJzZXJbXCJvblwiICsgZXZdIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uIChoKSB7XG4gICAgICAgIGlmICghaCkge1xuICAgICAgICAgIG1lLnJlbW92ZUFsbExpc3RlbmVycyhldilcbiAgICAgICAgICByZXR1cm4gbWUuX3BhcnNlcltcIm9uXCIrZXZdID0gaFxuICAgICAgICB9XG4gICAgICAgIG1lLm9uKGV2LCBoKVxuICAgICAgfSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gICAgfSlcbiAgfSlcbn1cblxuU0FYU3RyZWFtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3RyZWFtLnByb3RvdHlwZSxcbiAgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogU0FYU3RyZWFtIH0gfSlcblxuU0FYU3RyZWFtLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gIGlmICh0eXBlb2YgQnVmZmVyID09PSAnZnVuY3Rpb24nICYmXG4gICAgICB0eXBlb2YgQnVmZmVyLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmXG4gICAgICBCdWZmZXIuaXNCdWZmZXIoZGF0YSkpIHtcbiAgICBpZiAoIXRoaXMuX2RlY29kZXIpIHtcbiAgICAgIHZhciBTRCA9IHJlcXVpcmUoJ3N0cmluZ19kZWNvZGVyJykuU3RyaW5nRGVjb2RlclxuICAgICAgdGhpcy5fZGVjb2RlciA9IG5ldyBTRCgndXRmOCcpXG4gICAgfVxuICAgIGRhdGEgPSB0aGlzLl9kZWNvZGVyLndyaXRlKGRhdGEpO1xuICB9XG5cbiAgdGhpcy5fcGFyc2VyLndyaXRlKGRhdGEudG9TdHJpbmcoKSlcbiAgdGhpcy5lbWl0KFwiZGF0YVwiLCBkYXRhKVxuICByZXR1cm4gdHJ1ZVxufVxuXG5TQVhTdHJlYW0ucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uIChjaHVuaykge1xuICBpZiAoY2h1bmsgJiYgY2h1bmsubGVuZ3RoKSB0aGlzLndyaXRlKGNodW5rKVxuICB0aGlzLl9wYXJzZXIuZW5kKClcbiAgcmV0dXJuIHRydWVcbn1cblxuU0FYU3RyZWFtLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChldiwgaGFuZGxlcikge1xuICB2YXIgbWUgPSB0aGlzXG4gIGlmICghbWUuX3BhcnNlcltcIm9uXCIrZXZdICYmIHN0cmVhbVdyYXBzLmluZGV4T2YoZXYpICE9PSAtMSkge1xuICAgIG1lLl9wYXJzZXJbXCJvblwiK2V2XSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSA/IFthcmd1bWVudHNbMF1dXG4gICAgICAgICAgICAgICA6IEFycmF5LmFwcGx5KG51bGwsIGFyZ3VtZW50cylcbiAgICAgIGFyZ3Muc3BsaWNlKDAsIDAsIGV2KVxuICAgICAgbWUuZW1pdC5hcHBseShtZSwgYXJncylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gU3RyZWFtLnByb3RvdHlwZS5vbi5jYWxsKG1lLCBldiwgaGFuZGxlcilcbn1cblxuXG5cbi8vIGNoYXJhY3RlciBjbGFzc2VzIGFuZCB0b2tlbnNcbnZhciB3aGl0ZXNwYWNlID0gXCJcXHJcXG5cXHQgXCJcbiAgLy8gdGhpcyByZWFsbHkgbmVlZHMgdG8gYmUgcmVwbGFjZWQgd2l0aCBjaGFyYWN0ZXIgY2xhc3Nlcy5cbiAgLy8gWE1MIGFsbG93cyBhbGwgbWFubmVyIG9mIHJpZGljdWxvdXMgbnVtYmVycyBhbmQgZGlnaXRzLlxuICAsIG51bWJlciA9IFwiMDEyNDM1Njc4OVwiXG4gICwgbGV0dGVyID0gXCJhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ekFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaXCJcbiAgLy8gKExldHRlciB8IFwiX1wiIHwgXCI6XCIpXG4gICwgcXVvdGUgPSBcIidcXFwiXCJcbiAgLCBlbnRpdHkgPSBudW1iZXIrbGV0dGVyK1wiI1wiXG4gICwgYXR0cmliRW5kID0gd2hpdGVzcGFjZSArIFwiPlwiXG4gICwgQ0RBVEEgPSBcIltDREFUQVtcIlxuICAsIERPQ1RZUEUgPSBcIkRPQ1RZUEVcIlxuICAsIFhNTF9OQU1FU1BBQ0UgPSBcImh0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZVwiXG4gICwgWE1MTlNfTkFNRVNQQUNFID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3htbG5zL1wiXG4gICwgcm9vdE5TID0geyB4bWw6IFhNTF9OQU1FU1BBQ0UsIHhtbG5zOiBYTUxOU19OQU1FU1BBQ0UgfVxuXG4vLyB0dXJuIGFsbCB0aGUgc3RyaW5nIGNoYXJhY3RlciBzZXRzIGludG8gY2hhcmFjdGVyIGNsYXNzIG9iamVjdHMuXG53aGl0ZXNwYWNlID0gY2hhckNsYXNzKHdoaXRlc3BhY2UpXG5udW1iZXIgPSBjaGFyQ2xhc3MobnVtYmVyKVxubGV0dGVyID0gY2hhckNsYXNzKGxldHRlcilcblxuLy8gaHR0cDovL3d3dy53My5vcmcvVFIvUkVDLXhtbC8jTlQtTmFtZVN0YXJ0Q2hhclxuLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiB3b3JrcyBvbiBzdHJpbmdzLCBhIHNpbmdsZSBjaGFyYWN0ZXIgYXQgYSB0aW1lXG4vLyBhcyBzdWNoLCBpdCBjYW5ub3QgZXZlciBzdXBwb3J0IGFzdHJhbC1wbGFuZSBjaGFyYWN0ZXJzICgxMDAwMC1FRkZGRilcbi8vIHdpdGhvdXQgYSBzaWduaWZpY2FudCBicmVha2luZyBjaGFuZ2UgdG8gZWl0aGVyIHRoaXMgIHBhcnNlciwgb3IgdGhlXG4vLyBKYXZhU2NyaXB0IGxhbmd1YWdlLiAgSW1wbGVtZW50YXRpb24gb2YgYW4gZW1vamktY2FwYWJsZSB4bWwgcGFyc2VyXG4vLyBpcyBsZWZ0IGFzIGFuIGV4ZXJjaXNlIGZvciB0aGUgcmVhZGVyLlxudmFyIG5hbWVTdGFydCA9IC9bOl9BLVphLXpcXHUwMEMwLVxcdTAwRDZcXHUwMEQ4LVxcdTAwRjZcXHUwMEY4LVxcdTAyRkZcXHUwMzcwLVxcdTAzN0RcXHUwMzdGLVxcdTFGRkZcXHUyMDBDLVxcdTIwMERcXHUyMDcwLVxcdTIxOEZcXHUyQzAwLVxcdTJGRUZcXHUzMDAxLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRkRdL1xuXG52YXIgbmFtZUJvZHkgPSAvWzpfQS1aYS16XFx1MDBDMC1cXHUwMEQ2XFx1MDBEOC1cXHUwMEY2XFx1MDBGOC1cXHUwMkZGXFx1MDM3MC1cXHUwMzdEXFx1MDM3Ri1cXHUxRkZGXFx1MjAwQy1cXHUyMDBEXFx1MjA3MC1cXHUyMThGXFx1MkMwMC1cXHUyRkVGXFx1MzAwMS1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkZEXFx1MDBCN1xcdTAzMDAtXFx1MDM2RlxcdTIwM0YtXFx1MjA0MFxcLlxcZC1dL1xuXG5xdW90ZSA9IGNoYXJDbGFzcyhxdW90ZSlcbmVudGl0eSA9IGNoYXJDbGFzcyhlbnRpdHkpXG5hdHRyaWJFbmQgPSBjaGFyQ2xhc3MoYXR0cmliRW5kKVxuXG5mdW5jdGlvbiBjaGFyQ2xhc3MgKHN0cikge1xuICByZXR1cm4gc3RyLnNwbGl0KFwiXCIpLnJlZHVjZShmdW5jdGlvbiAocywgYykge1xuICAgIHNbY10gPSB0cnVlXG4gICAgcmV0dXJuIHNcbiAgfSwge30pXG59XG5cbmZ1bmN0aW9uIGlzUmVnRXhwIChjKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYykgPT09ICdbb2JqZWN0IFJlZ0V4cF0nXG59XG5cbmZ1bmN0aW9uIGlzIChjaGFyY2xhc3MsIGMpIHtcbiAgcmV0dXJuIGlzUmVnRXhwKGNoYXJjbGFzcykgPyAhIWMubWF0Y2goY2hhcmNsYXNzKSA6IGNoYXJjbGFzc1tjXVxufVxuXG5mdW5jdGlvbiBub3QgKGNoYXJjbGFzcywgYykge1xuICByZXR1cm4gIWlzKGNoYXJjbGFzcywgYylcbn1cblxudmFyIFMgPSAwXG5zYXguU1RBVEUgPVxueyBCRUdJTiAgICAgICAgICAgICAgICAgICAgIDogUysrXG4sIFRFWFQgICAgICAgICAgICAgICAgICAgICAgOiBTKysgLy8gZ2VuZXJhbCBzdHVmZlxuLCBURVhUX0VOVElUWSAgICAgICAgICAgICAgIDogUysrIC8vICZhbXAgYW5kIHN1Y2guXG4sIE9QRU5fV0FLQSAgICAgICAgICAgICAgICAgOiBTKysgLy8gPFxuLCBTR01MX0RFQ0wgICAgICAgICAgICAgICAgIDogUysrIC8vIDwhQkxBUkdcbiwgU0dNTF9ERUNMX1FVT1RFRCAgICAgICAgICA6IFMrKyAvLyA8IUJMQVJHIGZvbyBcImJhclxuLCBET0NUWVBFICAgICAgICAgICAgICAgICAgIDogUysrIC8vIDwhRE9DVFlQRVxuLCBET0NUWVBFX1FVT1RFRCAgICAgICAgICAgIDogUysrIC8vIDwhRE9DVFlQRSBcIi8vYmxhaFxuLCBET0NUWVBFX0RURCAgICAgICAgICAgICAgIDogUysrIC8vIDwhRE9DVFlQRSBcIi8vYmxhaFwiIFsgLi4uXG4sIERPQ1RZUEVfRFREX1FVT1RFRCAgICAgICAgOiBTKysgLy8gPCFET0NUWVBFIFwiLy9ibGFoXCIgWyBcImZvb1xuLCBDT01NRU5UX1NUQVJUSU5HICAgICAgICAgIDogUysrIC8vIDwhLVxuLCBDT01NRU5UICAgICAgICAgICAgICAgICAgIDogUysrIC8vIDwhLS1cbiwgQ09NTUVOVF9FTkRJTkcgICAgICAgICAgICA6IFMrKyAvLyA8IS0tIGJsYWggLVxuLCBDT01NRU5UX0VOREVEICAgICAgICAgICAgIDogUysrIC8vIDwhLS0gYmxhaCAtLVxuLCBDREFUQSAgICAgICAgICAgICAgICAgICAgIDogUysrIC8vIDwhW0NEQVRBWyBzb21ldGhpbmdcbiwgQ0RBVEFfRU5ESU5HICAgICAgICAgICAgICA6IFMrKyAvLyBdXG4sIENEQVRBX0VORElOR18yICAgICAgICAgICAgOiBTKysgLy8gXV1cbiwgUFJPQ19JTlNUICAgICAgICAgICAgICAgICA6IFMrKyAvLyA8P2hpXG4sIFBST0NfSU5TVF9CT0RZICAgICAgICAgICAgOiBTKysgLy8gPD9oaSB0aGVyZVxuLCBQUk9DX0lOU1RfRU5ESU5HICAgICAgICAgIDogUysrIC8vIDw/aGkgXCJ0aGVyZVwiID9cbiwgT1BFTl9UQUcgICAgICAgICAgICAgICAgICA6IFMrKyAvLyA8c3Ryb25nXG4sIE9QRU5fVEFHX1NMQVNIICAgICAgICAgICAgOiBTKysgLy8gPHN0cm9uZyAvXG4sIEFUVFJJQiAgICAgICAgICAgICAgICAgICAgOiBTKysgLy8gPGFcbiwgQVRUUklCX05BTUUgICAgICAgICAgICAgICA6IFMrKyAvLyA8YSBmb29cbiwgQVRUUklCX05BTUVfU0FXX1dISVRFICAgICA6IFMrKyAvLyA8YSBmb28gX1xuLCBBVFRSSUJfVkFMVUUgICAgICAgICAgICAgIDogUysrIC8vIDxhIGZvbz1cbiwgQVRUUklCX1ZBTFVFX1FVT1RFRCAgICAgICA6IFMrKyAvLyA8YSBmb289XCJiYXJcbiwgQVRUUklCX1ZBTFVFX0NMT1NFRCAgICAgICA6IFMrKyAvLyA8YSBmb289XCJiYXJcIlxuLCBBVFRSSUJfVkFMVUVfVU5RVU9URUQgICAgIDogUysrIC8vIDxhIGZvbz1iYXJcbiwgQVRUUklCX1ZBTFVFX0VOVElUWV9RICAgICA6IFMrKyAvLyA8Zm9vIGJhcj1cIiZxdW90O1wiXG4sIEFUVFJJQl9WQUxVRV9FTlRJVFlfVSAgICAgOiBTKysgLy8gPGZvbyBiYXI9JnF1b3Q7XG4sIENMT1NFX1RBRyAgICAgICAgICAgICAgICAgOiBTKysgLy8gPC9hXG4sIENMT1NFX1RBR19TQVdfV0hJVEUgICAgICAgOiBTKysgLy8gPC9hICAgPlxuLCBTQ1JJUFQgICAgICAgICAgICAgICAgICAgIDogUysrIC8vIDxzY3JpcHQ+IC4uLlxuLCBTQ1JJUFRfRU5ESU5HICAgICAgICAgICAgIDogUysrIC8vIDxzY3JpcHQ+IC4uLiA8XG59XG5cbnNheC5FTlRJVElFUyA9XG57IFwiYW1wXCIgOiBcIiZcIlxuLCBcImd0XCIgOiBcIj5cIlxuLCBcImx0XCIgOiBcIjxcIlxuLCBcInF1b3RcIiA6IFwiXFxcIlwiXG4sIFwiYXBvc1wiIDogXCInXCJcbiwgXCJBRWxpZ1wiIDogMTk4XG4sIFwiQWFjdXRlXCIgOiAxOTNcbiwgXCJBY2lyY1wiIDogMTk0XG4sIFwiQWdyYXZlXCIgOiAxOTJcbiwgXCJBcmluZ1wiIDogMTk3XG4sIFwiQXRpbGRlXCIgOiAxOTVcbiwgXCJBdW1sXCIgOiAxOTZcbiwgXCJDY2VkaWxcIiA6IDE5OVxuLCBcIkVUSFwiIDogMjA4XG4sIFwiRWFjdXRlXCIgOiAyMDFcbiwgXCJFY2lyY1wiIDogMjAyXG4sIFwiRWdyYXZlXCIgOiAyMDBcbiwgXCJFdW1sXCIgOiAyMDNcbiwgXCJJYWN1dGVcIiA6IDIwNVxuLCBcIkljaXJjXCIgOiAyMDZcbiwgXCJJZ3JhdmVcIiA6IDIwNFxuLCBcIkl1bWxcIiA6IDIwN1xuLCBcIk50aWxkZVwiIDogMjA5XG4sIFwiT2FjdXRlXCIgOiAyMTFcbiwgXCJPY2lyY1wiIDogMjEyXG4sIFwiT2dyYXZlXCIgOiAyMTBcbiwgXCJPc2xhc2hcIiA6IDIxNlxuLCBcIk90aWxkZVwiIDogMjEzXG4sIFwiT3VtbFwiIDogMjE0XG4sIFwiVEhPUk5cIiA6IDIyMlxuLCBcIlVhY3V0ZVwiIDogMjE4XG4sIFwiVWNpcmNcIiA6IDIxOVxuLCBcIlVncmF2ZVwiIDogMjE3XG4sIFwiVXVtbFwiIDogMjIwXG4sIFwiWWFjdXRlXCIgOiAyMjFcbiwgXCJhYWN1dGVcIiA6IDIyNVxuLCBcImFjaXJjXCIgOiAyMjZcbiwgXCJhZWxpZ1wiIDogMjMwXG4sIFwiYWdyYXZlXCIgOiAyMjRcbiwgXCJhcmluZ1wiIDogMjI5XG4sIFwiYXRpbGRlXCIgOiAyMjdcbiwgXCJhdW1sXCIgOiAyMjhcbiwgXCJjY2VkaWxcIiA6IDIzMVxuLCBcImVhY3V0ZVwiIDogMjMzXG4sIFwiZWNpcmNcIiA6IDIzNFxuLCBcImVncmF2ZVwiIDogMjMyXG4sIFwiZXRoXCIgOiAyNDBcbiwgXCJldW1sXCIgOiAyMzVcbiwgXCJpYWN1dGVcIiA6IDIzN1xuLCBcImljaXJjXCIgOiAyMzhcbiwgXCJpZ3JhdmVcIiA6IDIzNlxuLCBcIml1bWxcIiA6IDIzOVxuLCBcIm50aWxkZVwiIDogMjQxXG4sIFwib2FjdXRlXCIgOiAyNDNcbiwgXCJvY2lyY1wiIDogMjQ0XG4sIFwib2dyYXZlXCIgOiAyNDJcbiwgXCJvc2xhc2hcIiA6IDI0OFxuLCBcIm90aWxkZVwiIDogMjQ1XG4sIFwib3VtbFwiIDogMjQ2XG4sIFwic3psaWdcIiA6IDIyM1xuLCBcInRob3JuXCIgOiAyNTRcbiwgXCJ1YWN1dGVcIiA6IDI1MFxuLCBcInVjaXJjXCIgOiAyNTFcbiwgXCJ1Z3JhdmVcIiA6IDI0OVxuLCBcInV1bWxcIiA6IDI1MlxuLCBcInlhY3V0ZVwiIDogMjUzXG4sIFwieXVtbFwiIDogMjU1XG4sIFwiY29weVwiIDogMTY5XG4sIFwicmVnXCIgOiAxNzRcbiwgXCJuYnNwXCIgOiAxNjBcbiwgXCJpZXhjbFwiIDogMTYxXG4sIFwiY2VudFwiIDogMTYyXG4sIFwicG91bmRcIiA6IDE2M1xuLCBcImN1cnJlblwiIDogMTY0XG4sIFwieWVuXCIgOiAxNjVcbiwgXCJicnZiYXJcIiA6IDE2NlxuLCBcInNlY3RcIiA6IDE2N1xuLCBcInVtbFwiIDogMTY4XG4sIFwib3JkZlwiIDogMTcwXG4sIFwibGFxdW9cIiA6IDE3MVxuLCBcIm5vdFwiIDogMTcyXG4sIFwic2h5XCIgOiAxNzNcbiwgXCJtYWNyXCIgOiAxNzVcbiwgXCJkZWdcIiA6IDE3NlxuLCBcInBsdXNtblwiIDogMTc3XG4sIFwic3VwMVwiIDogMTg1XG4sIFwic3VwMlwiIDogMTc4XG4sIFwic3VwM1wiIDogMTc5XG4sIFwiYWN1dGVcIiA6IDE4MFxuLCBcIm1pY3JvXCIgOiAxODFcbiwgXCJwYXJhXCIgOiAxODJcbiwgXCJtaWRkb3RcIiA6IDE4M1xuLCBcImNlZGlsXCIgOiAxODRcbiwgXCJvcmRtXCIgOiAxODZcbiwgXCJyYXF1b1wiIDogMTg3XG4sIFwiZnJhYzE0XCIgOiAxODhcbiwgXCJmcmFjMTJcIiA6IDE4OVxuLCBcImZyYWMzNFwiIDogMTkwXG4sIFwiaXF1ZXN0XCIgOiAxOTFcbiwgXCJ0aW1lc1wiIDogMjE1XG4sIFwiZGl2aWRlXCIgOiAyNDdcbiwgXCJPRWxpZ1wiIDogMzM4XG4sIFwib2VsaWdcIiA6IDMzOVxuLCBcIlNjYXJvblwiIDogMzUyXG4sIFwic2Nhcm9uXCIgOiAzNTNcbiwgXCJZdW1sXCIgOiAzNzZcbiwgXCJmbm9mXCIgOiA0MDJcbiwgXCJjaXJjXCIgOiA3MTBcbiwgXCJ0aWxkZVwiIDogNzMyXG4sIFwiQWxwaGFcIiA6IDkxM1xuLCBcIkJldGFcIiA6IDkxNFxuLCBcIkdhbW1hXCIgOiA5MTVcbiwgXCJEZWx0YVwiIDogOTE2XG4sIFwiRXBzaWxvblwiIDogOTE3XG4sIFwiWmV0YVwiIDogOTE4XG4sIFwiRXRhXCIgOiA5MTlcbiwgXCJUaGV0YVwiIDogOTIwXG4sIFwiSW90YVwiIDogOTIxXG4sIFwiS2FwcGFcIiA6IDkyMlxuLCBcIkxhbWJkYVwiIDogOTIzXG4sIFwiTXVcIiA6IDkyNFxuLCBcIk51XCIgOiA5MjVcbiwgXCJYaVwiIDogOTI2XG4sIFwiT21pY3JvblwiIDogOTI3XG4sIFwiUGlcIiA6IDkyOFxuLCBcIlJob1wiIDogOTI5XG4sIFwiU2lnbWFcIiA6IDkzMVxuLCBcIlRhdVwiIDogOTMyXG4sIFwiVXBzaWxvblwiIDogOTMzXG4sIFwiUGhpXCIgOiA5MzRcbiwgXCJDaGlcIiA6IDkzNVxuLCBcIlBzaVwiIDogOTM2XG4sIFwiT21lZ2FcIiA6IDkzN1xuLCBcImFscGhhXCIgOiA5NDVcbiwgXCJiZXRhXCIgOiA5NDZcbiwgXCJnYW1tYVwiIDogOTQ3XG4sIFwiZGVsdGFcIiA6IDk0OFxuLCBcImVwc2lsb25cIiA6IDk0OVxuLCBcInpldGFcIiA6IDk1MFxuLCBcImV0YVwiIDogOTUxXG4sIFwidGhldGFcIiA6IDk1MlxuLCBcImlvdGFcIiA6IDk1M1xuLCBcImthcHBhXCIgOiA5NTRcbiwgXCJsYW1iZGFcIiA6IDk1NVxuLCBcIm11XCIgOiA5NTZcbiwgXCJudVwiIDogOTU3XG4sIFwieGlcIiA6IDk1OFxuLCBcIm9taWNyb25cIiA6IDk1OVxuLCBcInBpXCIgOiA5NjBcbiwgXCJyaG9cIiA6IDk2MVxuLCBcInNpZ21hZlwiIDogOTYyXG4sIFwic2lnbWFcIiA6IDk2M1xuLCBcInRhdVwiIDogOTY0XG4sIFwidXBzaWxvblwiIDogOTY1XG4sIFwicGhpXCIgOiA5NjZcbiwgXCJjaGlcIiA6IDk2N1xuLCBcInBzaVwiIDogOTY4XG4sIFwib21lZ2FcIiA6IDk2OVxuLCBcInRoZXRhc3ltXCIgOiA5NzdcbiwgXCJ1cHNpaFwiIDogOTc4XG4sIFwicGl2XCIgOiA5ODJcbiwgXCJlbnNwXCIgOiA4MTk0XG4sIFwiZW1zcFwiIDogODE5NVxuLCBcInRoaW5zcFwiIDogODIwMVxuLCBcInp3bmpcIiA6IDgyMDRcbiwgXCJ6d2pcIiA6IDgyMDVcbiwgXCJscm1cIiA6IDgyMDZcbiwgXCJybG1cIiA6IDgyMDdcbiwgXCJuZGFzaFwiIDogODIxMVxuLCBcIm1kYXNoXCIgOiA4MjEyXG4sIFwibHNxdW9cIiA6IDgyMTZcbiwgXCJyc3F1b1wiIDogODIxN1xuLCBcInNicXVvXCIgOiA4MjE4XG4sIFwibGRxdW9cIiA6IDgyMjBcbiwgXCJyZHF1b1wiIDogODIyMVxuLCBcImJkcXVvXCIgOiA4MjIyXG4sIFwiZGFnZ2VyXCIgOiA4MjI0XG4sIFwiRGFnZ2VyXCIgOiA4MjI1XG4sIFwiYnVsbFwiIDogODIyNlxuLCBcImhlbGxpcFwiIDogODIzMFxuLCBcInBlcm1pbFwiIDogODI0MFxuLCBcInByaW1lXCIgOiA4MjQyXG4sIFwiUHJpbWVcIiA6IDgyNDNcbiwgXCJsc2FxdW9cIiA6IDgyNDlcbiwgXCJyc2FxdW9cIiA6IDgyNTBcbiwgXCJvbGluZVwiIDogODI1NFxuLCBcImZyYXNsXCIgOiA4MjYwXG4sIFwiZXVyb1wiIDogODM2NFxuLCBcImltYWdlXCIgOiA4NDY1XG4sIFwid2VpZXJwXCIgOiA4NDcyXG4sIFwicmVhbFwiIDogODQ3NlxuLCBcInRyYWRlXCIgOiA4NDgyXG4sIFwiYWxlZnN5bVwiIDogODUwMVxuLCBcImxhcnJcIiA6IDg1OTJcbiwgXCJ1YXJyXCIgOiA4NTkzXG4sIFwicmFyclwiIDogODU5NFxuLCBcImRhcnJcIiA6IDg1OTVcbiwgXCJoYXJyXCIgOiA4NTk2XG4sIFwiY3JhcnJcIiA6IDg2MjlcbiwgXCJsQXJyXCIgOiA4NjU2XG4sIFwidUFyclwiIDogODY1N1xuLCBcInJBcnJcIiA6IDg2NThcbiwgXCJkQXJyXCIgOiA4NjU5XG4sIFwiaEFyclwiIDogODY2MFxuLCBcImZvcmFsbFwiIDogODcwNFxuLCBcInBhcnRcIiA6IDg3MDZcbiwgXCJleGlzdFwiIDogODcwN1xuLCBcImVtcHR5XCIgOiA4NzA5XG4sIFwibmFibGFcIiA6IDg3MTFcbiwgXCJpc2luXCIgOiA4NzEyXG4sIFwibm90aW5cIiA6IDg3MTNcbiwgXCJuaVwiIDogODcxNVxuLCBcInByb2RcIiA6IDg3MTlcbiwgXCJzdW1cIiA6IDg3MjFcbiwgXCJtaW51c1wiIDogODcyMlxuLCBcImxvd2FzdFwiIDogODcyN1xuLCBcInJhZGljXCIgOiA4NzMwXG4sIFwicHJvcFwiIDogODczM1xuLCBcImluZmluXCIgOiA4NzM0XG4sIFwiYW5nXCIgOiA4NzM2XG4sIFwiYW5kXCIgOiA4NzQzXG4sIFwib3JcIiA6IDg3NDRcbiwgXCJjYXBcIiA6IDg3NDVcbiwgXCJjdXBcIiA6IDg3NDZcbiwgXCJpbnRcIiA6IDg3NDdcbiwgXCJ0aGVyZTRcIiA6IDg3NTZcbiwgXCJzaW1cIiA6IDg3NjRcbiwgXCJjb25nXCIgOiA4NzczXG4sIFwiYXN5bXBcIiA6IDg3NzZcbiwgXCJuZVwiIDogODgwMFxuLCBcImVxdWl2XCIgOiA4ODAxXG4sIFwibGVcIiA6IDg4MDRcbiwgXCJnZVwiIDogODgwNVxuLCBcInN1YlwiIDogODgzNFxuLCBcInN1cFwiIDogODgzNVxuLCBcIm5zdWJcIiA6IDg4MzZcbiwgXCJzdWJlXCIgOiA4ODM4XG4sIFwic3VwZVwiIDogODgzOVxuLCBcIm9wbHVzXCIgOiA4ODUzXG4sIFwib3RpbWVzXCIgOiA4ODU1XG4sIFwicGVycFwiIDogODg2OVxuLCBcInNkb3RcIiA6IDg5MDFcbiwgXCJsY2VpbFwiIDogODk2OFxuLCBcInJjZWlsXCIgOiA4OTY5XG4sIFwibGZsb29yXCIgOiA4OTcwXG4sIFwicmZsb29yXCIgOiA4OTcxXG4sIFwibGFuZ1wiIDogOTAwMVxuLCBcInJhbmdcIiA6IDkwMDJcbiwgXCJsb3pcIiA6IDk2NzRcbiwgXCJzcGFkZXNcIiA6IDk4MjRcbiwgXCJjbHVic1wiIDogOTgyN1xuLCBcImhlYXJ0c1wiIDogOTgyOVxuLCBcImRpYW1zXCIgOiA5ODMwXG59XG5cbk9iamVjdC5rZXlzKHNheC5FTlRJVElFUykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgdmFyIGUgPSBzYXguRU5USVRJRVNba2V5XVxuICAgIHZhciBzID0gdHlwZW9mIGUgPT09ICdudW1iZXInID8gU3RyaW5nLmZyb21DaGFyQ29kZShlKSA6IGVcbiAgICBzYXguRU5USVRJRVNba2V5XSA9IHNcbn0pXG5cbmZvciAodmFyIFMgaW4gc2F4LlNUQVRFKSBzYXguU1RBVEVbc2F4LlNUQVRFW1NdXSA9IFNcblxuLy8gc2hvcnRoYW5kXG5TID0gc2F4LlNUQVRFXG5cbmZ1bmN0aW9uIGVtaXQgKHBhcnNlciwgZXZlbnQsIGRhdGEpIHtcbiAgcGFyc2VyW2V2ZW50XSAmJiBwYXJzZXJbZXZlbnRdKGRhdGEpXG59XG5cbmZ1bmN0aW9uIGVtaXROb2RlIChwYXJzZXIsIG5vZGVUeXBlLCBkYXRhKSB7XG4gIGlmIChwYXJzZXIudGV4dE5vZGUpIGNsb3NlVGV4dChwYXJzZXIpXG4gIGVtaXQocGFyc2VyLCBub2RlVHlwZSwgZGF0YSlcbn1cblxuZnVuY3Rpb24gY2xvc2VUZXh0IChwYXJzZXIpIHtcbiAgcGFyc2VyLnRleHROb2RlID0gdGV4dG9wdHMocGFyc2VyLm9wdCwgcGFyc2VyLnRleHROb2RlKVxuICBpZiAocGFyc2VyLnRleHROb2RlKSBlbWl0KHBhcnNlciwgXCJvbnRleHRcIiwgcGFyc2VyLnRleHROb2RlKVxuICBwYXJzZXIudGV4dE5vZGUgPSBcIlwiXG59XG5cbmZ1bmN0aW9uIHRleHRvcHRzIChvcHQsIHRleHQpIHtcbiAgaWYgKG9wdC50cmltKSB0ZXh0ID0gdGV4dC50cmltKClcbiAgaWYgKG9wdC5ub3JtYWxpemUpIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gIHJldHVybiB0ZXh0XG59XG5cbmZ1bmN0aW9uIGVycm9yIChwYXJzZXIsIGVyKSB7XG4gIGNsb3NlVGV4dChwYXJzZXIpXG4gIGlmIChwYXJzZXIudHJhY2tQb3NpdGlvbikge1xuICAgIGVyICs9IFwiXFxuTGluZTogXCIrcGFyc2VyLmxpbmUrXG4gICAgICAgICAgXCJcXG5Db2x1bW46IFwiK3BhcnNlci5jb2x1bW4rXG4gICAgICAgICAgXCJcXG5DaGFyOiBcIitwYXJzZXIuY1xuICB9XG4gIGVyID0gbmV3IEVycm9yKGVyKVxuICBwYXJzZXIuZXJyb3IgPSBlclxuICBlbWl0KHBhcnNlciwgXCJvbmVycm9yXCIsIGVyKVxuICByZXR1cm4gcGFyc2VyXG59XG5cbmZ1bmN0aW9uIGVuZCAocGFyc2VyKSB7XG4gIGlmICghcGFyc2VyLmNsb3NlZFJvb3QpIHN0cmljdEZhaWwocGFyc2VyLCBcIlVuY2xvc2VkIHJvb3QgdGFnXCIpXG4gIGlmICgocGFyc2VyLnN0YXRlICE9PSBTLkJFR0lOKSAmJiAocGFyc2VyLnN0YXRlICE9PSBTLlRFWFQpKSBlcnJvcihwYXJzZXIsIFwiVW5leHBlY3RlZCBlbmRcIilcbiAgY2xvc2VUZXh0KHBhcnNlcilcbiAgcGFyc2VyLmMgPSBcIlwiXG4gIHBhcnNlci5jbG9zZWQgPSB0cnVlXG4gIGVtaXQocGFyc2VyLCBcIm9uZW5kXCIpXG4gIFNBWFBhcnNlci5jYWxsKHBhcnNlciwgcGFyc2VyLnN0cmljdCwgcGFyc2VyLm9wdClcbiAgcmV0dXJuIHBhcnNlclxufVxuXG5mdW5jdGlvbiBzdHJpY3RGYWlsIChwYXJzZXIsIG1lc3NhZ2UpIHtcbiAgaWYgKHR5cGVvZiBwYXJzZXIgIT09ICdvYmplY3QnIHx8ICEocGFyc2VyIGluc3RhbmNlb2YgU0FYUGFyc2VyKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2JhZCBjYWxsIHRvIHN0cmljdEZhaWwnKTtcbiAgaWYgKHBhcnNlci5zdHJpY3QpIGVycm9yKHBhcnNlciwgbWVzc2FnZSlcbn1cblxuZnVuY3Rpb24gbmV3VGFnIChwYXJzZXIpIHtcbiAgaWYgKCFwYXJzZXIuc3RyaWN0KSBwYXJzZXIudGFnTmFtZSA9IHBhcnNlci50YWdOYW1lW3BhcnNlci5sb29zZUNhc2VdKClcbiAgdmFyIHBhcmVudCA9IHBhcnNlci50YWdzW3BhcnNlci50YWdzLmxlbmd0aCAtIDFdIHx8IHBhcnNlclxuICAgICwgdGFnID0gcGFyc2VyLnRhZyA9IHsgbmFtZSA6IHBhcnNlci50YWdOYW1lLCBhdHRyaWJ1dGVzIDoge30gfVxuXG4gIC8vIHdpbGwgYmUgb3ZlcnJpZGRlbiBpZiB0YWcgY29udGFpbHMgYW4geG1sbnM9XCJmb29cIiBvciB4bWxuczpmb289XCJiYXJcIlxuICBpZiAocGFyc2VyLm9wdC54bWxucykgdGFnLm5zID0gcGFyZW50Lm5zXG4gIHBhcnNlci5hdHRyaWJMaXN0Lmxlbmd0aCA9IDBcbn1cblxuZnVuY3Rpb24gcW5hbWUgKG5hbWUsIGF0dHJpYnV0ZSkge1xuICB2YXIgaSA9IG5hbWUuaW5kZXhPZihcIjpcIilcbiAgICAsIHF1YWxOYW1lID0gaSA8IDAgPyBbIFwiXCIsIG5hbWUgXSA6IG5hbWUuc3BsaXQoXCI6XCIpXG4gICAgLCBwcmVmaXggPSBxdWFsTmFtZVswXVxuICAgICwgbG9jYWwgPSBxdWFsTmFtZVsxXVxuXG4gIC8vIDx4IFwieG1sbnNcIj1cImh0dHA6Ly9mb29cIj5cbiAgaWYgKGF0dHJpYnV0ZSAmJiBuYW1lID09PSBcInhtbG5zXCIpIHtcbiAgICBwcmVmaXggPSBcInhtbG5zXCJcbiAgICBsb2NhbCA9IFwiXCJcbiAgfVxuXG4gIHJldHVybiB7IHByZWZpeDogcHJlZml4LCBsb2NhbDogbG9jYWwgfVxufVxuXG5mdW5jdGlvbiBhdHRyaWIgKHBhcnNlcikge1xuICBpZiAoIXBhcnNlci5zdHJpY3QpIHBhcnNlci5hdHRyaWJOYW1lID0gcGFyc2VyLmF0dHJpYk5hbWVbcGFyc2VyLmxvb3NlQ2FzZV0oKVxuXG4gIGlmIChwYXJzZXIuYXR0cmliTGlzdC5pbmRleE9mKHBhcnNlci5hdHRyaWJOYW1lKSAhPT0gLTEgfHxcbiAgICAgIHBhcnNlci50YWcuYXR0cmlidXRlcy5oYXNPd25Qcm9wZXJ0eShwYXJzZXIuYXR0cmliTmFtZSkpIHtcbiAgICByZXR1cm4gcGFyc2VyLmF0dHJpYk5hbWUgPSBwYXJzZXIuYXR0cmliVmFsdWUgPSBcIlwiXG4gIH1cblxuICBpZiAocGFyc2VyLm9wdC54bWxucykge1xuICAgIHZhciBxbiA9IHFuYW1lKHBhcnNlci5hdHRyaWJOYW1lLCB0cnVlKVxuICAgICAgLCBwcmVmaXggPSBxbi5wcmVmaXhcbiAgICAgICwgbG9jYWwgPSBxbi5sb2NhbFxuXG4gICAgaWYgKHByZWZpeCA9PT0gXCJ4bWxuc1wiKSB7XG4gICAgICAvLyBuYW1lc3BhY2UgYmluZGluZyBhdHRyaWJ1dGU7IHB1c2ggdGhlIGJpbmRpbmcgaW50byBzY29wZVxuICAgICAgaWYgKGxvY2FsID09PSBcInhtbFwiICYmIHBhcnNlci5hdHRyaWJWYWx1ZSAhPT0gWE1MX05BTUVTUEFDRSkge1xuICAgICAgICBzdHJpY3RGYWlsKCBwYXJzZXJcbiAgICAgICAgICAgICAgICAgICwgXCJ4bWw6IHByZWZpeCBtdXN0IGJlIGJvdW5kIHRvIFwiICsgWE1MX05BTUVTUEFDRSArIFwiXFxuXCJcbiAgICAgICAgICAgICAgICAgICsgXCJBY3R1YWw6IFwiICsgcGFyc2VyLmF0dHJpYlZhbHVlIClcbiAgICAgIH0gZWxzZSBpZiAobG9jYWwgPT09IFwieG1sbnNcIiAmJiBwYXJzZXIuYXR0cmliVmFsdWUgIT09IFhNTE5TX05BTUVTUEFDRSkge1xuICAgICAgICBzdHJpY3RGYWlsKCBwYXJzZXJcbiAgICAgICAgICAgICAgICAgICwgXCJ4bWxuczogcHJlZml4IG11c3QgYmUgYm91bmQgdG8gXCIgKyBYTUxOU19OQU1FU1BBQ0UgKyBcIlxcblwiXG4gICAgICAgICAgICAgICAgICArIFwiQWN0dWFsOiBcIiArIHBhcnNlci5hdHRyaWJWYWx1ZSApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdGFnID0gcGFyc2VyLnRhZ1xuICAgICAgICAgICwgcGFyZW50ID0gcGFyc2VyLnRhZ3NbcGFyc2VyLnRhZ3MubGVuZ3RoIC0gMV0gfHwgcGFyc2VyXG4gICAgICAgIGlmICh0YWcubnMgPT09IHBhcmVudC5ucykge1xuICAgICAgICAgIHRhZy5ucyA9IE9iamVjdC5jcmVhdGUocGFyZW50Lm5zKVxuICAgICAgICB9XG4gICAgICAgIHRhZy5uc1tsb2NhbF0gPSBwYXJzZXIuYXR0cmliVmFsdWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkZWZlciBvbmF0dHJpYnV0ZSBldmVudHMgdW50aWwgYWxsIGF0dHJpYnV0ZXMgaGF2ZSBiZWVuIHNlZW5cbiAgICAvLyBzbyBhbnkgbmV3IGJpbmRpbmdzIGNhbiB0YWtlIGVmZmVjdDsgcHJlc2VydmUgYXR0cmlidXRlIG9yZGVyXG4gICAgLy8gc28gZGVmZXJyZWQgZXZlbnRzIGNhbiBiZSBlbWl0dGVkIGluIGRvY3VtZW50IG9yZGVyXG4gICAgcGFyc2VyLmF0dHJpYkxpc3QucHVzaChbcGFyc2VyLmF0dHJpYk5hbWUsIHBhcnNlci5hdHRyaWJWYWx1ZV0pXG4gIH0gZWxzZSB7XG4gICAgLy8gaW4gbm9uLXhtbG5zIG1vZGUsIHdlIGNhbiBlbWl0IHRoZSBldmVudCByaWdodCBhd2F5XG4gICAgcGFyc2VyLnRhZy5hdHRyaWJ1dGVzW3BhcnNlci5hdHRyaWJOYW1lXSA9IHBhcnNlci5hdHRyaWJWYWx1ZVxuICAgIGVtaXROb2RlKCBwYXJzZXJcbiAgICAgICAgICAgICwgXCJvbmF0dHJpYnV0ZVwiXG4gICAgICAgICAgICAsIHsgbmFtZTogcGFyc2VyLmF0dHJpYk5hbWVcbiAgICAgICAgICAgICAgLCB2YWx1ZTogcGFyc2VyLmF0dHJpYlZhbHVlIH0gKVxuICB9XG5cbiAgcGFyc2VyLmF0dHJpYk5hbWUgPSBwYXJzZXIuYXR0cmliVmFsdWUgPSBcIlwiXG59XG5cbmZ1bmN0aW9uIG9wZW5UYWcgKHBhcnNlciwgc2VsZkNsb3NpbmcpIHtcbiAgaWYgKHBhcnNlci5vcHQueG1sbnMpIHtcbiAgICAvLyBlbWl0IG5hbWVzcGFjZSBiaW5kaW5nIGV2ZW50c1xuICAgIHZhciB0YWcgPSBwYXJzZXIudGFnXG5cbiAgICAvLyBhZGQgbmFtZXNwYWNlIGluZm8gdG8gdGFnXG4gICAgdmFyIHFuID0gcW5hbWUocGFyc2VyLnRhZ05hbWUpXG4gICAgdGFnLnByZWZpeCA9IHFuLnByZWZpeFxuICAgIHRhZy5sb2NhbCA9IHFuLmxvY2FsXG4gICAgdGFnLnVyaSA9IHRhZy5uc1txbi5wcmVmaXhdIHx8IFwiXCJcblxuICAgIGlmICh0YWcucHJlZml4ICYmICF0YWcudXJpKSB7XG4gICAgICBzdHJpY3RGYWlsKHBhcnNlciwgXCJVbmJvdW5kIG5hbWVzcGFjZSBwcmVmaXg6IFwiXG4gICAgICAgICAgICAgICAgICAgICAgICsgSlNPTi5zdHJpbmdpZnkocGFyc2VyLnRhZ05hbWUpKVxuICAgICAgdGFnLnVyaSA9IHFuLnByZWZpeFxuICAgIH1cblxuICAgIHZhciBwYXJlbnQgPSBwYXJzZXIudGFnc1twYXJzZXIudGFncy5sZW5ndGggLSAxXSB8fCBwYXJzZXJcbiAgICBpZiAodGFnLm5zICYmIHBhcmVudC5ucyAhPT0gdGFnLm5zKSB7XG4gICAgICBPYmplY3Qua2V5cyh0YWcubnMpLmZvckVhY2goZnVuY3Rpb24gKHApIHtcbiAgICAgICAgZW1pdE5vZGUoIHBhcnNlclxuICAgICAgICAgICAgICAgICwgXCJvbm9wZW5uYW1lc3BhY2VcIlxuICAgICAgICAgICAgICAgICwgeyBwcmVmaXg6IHAgLCB1cmk6IHRhZy5uc1twXSB9IClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gaGFuZGxlIGRlZmVycmVkIG9uYXR0cmlidXRlIGV2ZW50c1xuICAgIC8vIE5vdGU6IGRvIG5vdCBhcHBseSBkZWZhdWx0IG5zIHRvIGF0dHJpYnV0ZXM6XG4gICAgLy8gICBodHRwOi8vd3d3LnczLm9yZy9UUi9SRUMteG1sLW5hbWVzLyNkZWZhdWx0aW5nXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJzZXIuYXR0cmliTGlzdC5sZW5ndGg7IGkgPCBsOyBpICsrKSB7XG4gICAgICB2YXIgbnYgPSBwYXJzZXIuYXR0cmliTGlzdFtpXVxuICAgICAgdmFyIG5hbWUgPSBudlswXVxuICAgICAgICAsIHZhbHVlID0gbnZbMV1cbiAgICAgICAgLCBxdWFsTmFtZSA9IHFuYW1lKG5hbWUsIHRydWUpXG4gICAgICAgICwgcHJlZml4ID0gcXVhbE5hbWUucHJlZml4XG4gICAgICAgICwgbG9jYWwgPSBxdWFsTmFtZS5sb2NhbFxuICAgICAgICAsIHVyaSA9IHByZWZpeCA9PSBcIlwiID8gXCJcIiA6ICh0YWcubnNbcHJlZml4XSB8fCBcIlwiKVxuICAgICAgICAsIGEgPSB7IG5hbWU6IG5hbWVcbiAgICAgICAgICAgICAgLCB2YWx1ZTogdmFsdWVcbiAgICAgICAgICAgICAgLCBwcmVmaXg6IHByZWZpeFxuICAgICAgICAgICAgICAsIGxvY2FsOiBsb2NhbFxuICAgICAgICAgICAgICAsIHVyaTogdXJpXG4gICAgICAgICAgICAgIH1cblxuICAgICAgLy8gaWYgdGhlcmUncyBhbnkgYXR0cmlidXRlcyB3aXRoIGFuIHVuZGVmaW5lZCBuYW1lc3BhY2UsXG4gICAgICAvLyB0aGVuIGZhaWwgb24gdGhlbSBub3cuXG4gICAgICBpZiAocHJlZml4ICYmIHByZWZpeCAhPSBcInhtbG5zXCIgJiYgIXVyaSkge1xuICAgICAgICBzdHJpY3RGYWlsKHBhcnNlciwgXCJVbmJvdW5kIG5hbWVzcGFjZSBwcmVmaXg6IFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgKyBKU09OLnN0cmluZ2lmeShwcmVmaXgpKVxuICAgICAgICBhLnVyaSA9IHByZWZpeFxuICAgICAgfVxuICAgICAgcGFyc2VyLnRhZy5hdHRyaWJ1dGVzW25hbWVdID0gYVxuICAgICAgZW1pdE5vZGUocGFyc2VyLCBcIm9uYXR0cmlidXRlXCIsIGEpXG4gICAgfVxuICAgIHBhcnNlci5hdHRyaWJMaXN0Lmxlbmd0aCA9IDBcbiAgfVxuXG4gIHBhcnNlci50YWcuaXNTZWxmQ2xvc2luZyA9ICEhc2VsZkNsb3NpbmdcblxuICAvLyBwcm9jZXNzIHRoZSB0YWdcbiAgcGFyc2VyLnNhd1Jvb3QgPSB0cnVlXG4gIHBhcnNlci50YWdzLnB1c2gocGFyc2VyLnRhZylcbiAgZW1pdE5vZGUocGFyc2VyLCBcIm9ub3BlbnRhZ1wiLCBwYXJzZXIudGFnKVxuICBpZiAoIXNlbGZDbG9zaW5nKSB7XG4gICAgLy8gc3BlY2lhbCBjYXNlIGZvciA8c2NyaXB0PiBpbiBub24tc3RyaWN0IG1vZGUuXG4gICAgaWYgKCFwYXJzZXIubm9zY3JpcHQgJiYgcGFyc2VyLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJzY3JpcHRcIikge1xuICAgICAgcGFyc2VyLnN0YXRlID0gUy5TQ1JJUFRcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyc2VyLnN0YXRlID0gUy5URVhUXG4gICAgfVxuICAgIHBhcnNlci50YWcgPSBudWxsXG4gICAgcGFyc2VyLnRhZ05hbWUgPSBcIlwiXG4gIH1cbiAgcGFyc2VyLmF0dHJpYk5hbWUgPSBwYXJzZXIuYXR0cmliVmFsdWUgPSBcIlwiXG4gIHBhcnNlci5hdHRyaWJMaXN0Lmxlbmd0aCA9IDBcbn1cblxuZnVuY3Rpb24gY2xvc2VUYWcgKHBhcnNlcikge1xuICBpZiAoIXBhcnNlci50YWdOYW1lKSB7XG4gICAgc3RyaWN0RmFpbChwYXJzZXIsIFwiV2VpcmQgZW1wdHkgY2xvc2UgdGFnLlwiKVxuICAgIHBhcnNlci50ZXh0Tm9kZSArPSBcIjwvPlwiXG4gICAgcGFyc2VyLnN0YXRlID0gUy5URVhUXG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAocGFyc2VyLnNjcmlwdCkge1xuICAgIGlmIChwYXJzZXIudGFnTmFtZSAhPT0gXCJzY3JpcHRcIikge1xuICAgICAgcGFyc2VyLnNjcmlwdCArPSBcIjwvXCIgKyBwYXJzZXIudGFnTmFtZSArIFwiPlwiXG4gICAgICBwYXJzZXIudGFnTmFtZSA9IFwiXCJcbiAgICAgIHBhcnNlci5zdGF0ZSA9IFMuU0NSSVBUXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgZW1pdE5vZGUocGFyc2VyLCBcIm9uc2NyaXB0XCIsIHBhcnNlci5zY3JpcHQpXG4gICAgcGFyc2VyLnNjcmlwdCA9IFwiXCJcbiAgfVxuXG4gIC8vIGZpcnN0IG1ha2Ugc3VyZSB0aGF0IHRoZSBjbG9zaW5nIHRhZyBhY3R1YWxseSBleGlzdHMuXG4gIC8vIDxhPjxiPjwvYz48L2I+PC9hPiB3aWxsIGNsb3NlIGV2ZXJ5dGhpbmcsIG90aGVyd2lzZS5cbiAgdmFyIHQgPSBwYXJzZXIudGFncy5sZW5ndGhcbiAgdmFyIHRhZ05hbWUgPSBwYXJzZXIudGFnTmFtZVxuICBpZiAoIXBhcnNlci5zdHJpY3QpIHRhZ05hbWUgPSB0YWdOYW1lW3BhcnNlci5sb29zZUNhc2VdKClcbiAgdmFyIGNsb3NlVG8gPSB0YWdOYW1lXG4gIHdoaWxlICh0IC0tKSB7XG4gICAgdmFyIGNsb3NlID0gcGFyc2VyLnRhZ3NbdF1cbiAgICBpZiAoY2xvc2UubmFtZSAhPT0gY2xvc2VUbykge1xuICAgICAgLy8gZmFpbCB0aGUgZmlyc3QgdGltZSBpbiBzdHJpY3QgbW9kZVxuICAgICAgc3RyaWN0RmFpbChwYXJzZXIsIFwiVW5leHBlY3RlZCBjbG9zZSB0YWdcIilcbiAgICB9IGVsc2UgYnJlYWtcbiAgfVxuXG4gIC8vIGRpZG4ndCBmaW5kIGl0LiAgd2UgYWxyZWFkeSBmYWlsZWQgZm9yIHN0cmljdCwgc28ganVzdCBhYm9ydC5cbiAgaWYgKHQgPCAwKSB7XG4gICAgc3RyaWN0RmFpbChwYXJzZXIsIFwiVW5tYXRjaGVkIGNsb3NpbmcgdGFnOiBcIitwYXJzZXIudGFnTmFtZSlcbiAgICBwYXJzZXIudGV4dE5vZGUgKz0gXCI8L1wiICsgcGFyc2VyLnRhZ05hbWUgKyBcIj5cIlxuICAgIHBhcnNlci5zdGF0ZSA9IFMuVEVYVFxuICAgIHJldHVyblxuICB9XG4gIHBhcnNlci50YWdOYW1lID0gdGFnTmFtZVxuICB2YXIgcyA9IHBhcnNlci50YWdzLmxlbmd0aFxuICB3aGlsZSAocyAtLT4gdCkge1xuICAgIHZhciB0YWcgPSBwYXJzZXIudGFnID0gcGFyc2VyLnRhZ3MucG9wKClcbiAgICBwYXJzZXIudGFnTmFtZSA9IHBhcnNlci50YWcubmFtZVxuICAgIGVtaXROb2RlKHBhcnNlciwgXCJvbmNsb3NldGFnXCIsIHBhcnNlci50YWdOYW1lKVxuXG4gICAgdmFyIHggPSB7fVxuICAgIGZvciAodmFyIGkgaW4gdGFnLm5zKSB4W2ldID0gdGFnLm5zW2ldXG5cbiAgICB2YXIgcGFyZW50ID0gcGFyc2VyLnRhZ3NbcGFyc2VyLnRhZ3MubGVuZ3RoIC0gMV0gfHwgcGFyc2VyXG4gICAgaWYgKHBhcnNlci5vcHQueG1sbnMgJiYgdGFnLm5zICE9PSBwYXJlbnQubnMpIHtcbiAgICAgIC8vIHJlbW92ZSBuYW1lc3BhY2UgYmluZGluZ3MgaW50cm9kdWNlZCBieSB0YWdcbiAgICAgIE9iamVjdC5rZXlzKHRhZy5ucykuZm9yRWFjaChmdW5jdGlvbiAocCkge1xuICAgICAgICB2YXIgbiA9IHRhZy5uc1twXVxuICAgICAgICBlbWl0Tm9kZShwYXJzZXIsIFwib25jbG9zZW5hbWVzcGFjZVwiLCB7IHByZWZpeDogcCwgdXJpOiBuIH0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxuICBpZiAodCA9PT0gMCkgcGFyc2VyLmNsb3NlZFJvb3QgPSB0cnVlXG4gIHBhcnNlci50YWdOYW1lID0gcGFyc2VyLmF0dHJpYlZhbHVlID0gcGFyc2VyLmF0dHJpYk5hbWUgPSBcIlwiXG4gIHBhcnNlci5hdHRyaWJMaXN0Lmxlbmd0aCA9IDBcbiAgcGFyc2VyLnN0YXRlID0gUy5URVhUXG59XG5cbmZ1bmN0aW9uIHBhcnNlRW50aXR5IChwYXJzZXIpIHtcbiAgdmFyIGVudGl0eSA9IHBhcnNlci5lbnRpdHlcbiAgICAsIGVudGl0eUxDID0gZW50aXR5LnRvTG93ZXJDYXNlKClcbiAgICAsIG51bVxuICAgICwgbnVtU3RyID0gXCJcIlxuICBpZiAocGFyc2VyLkVOVElUSUVTW2VudGl0eV0pXG4gICAgcmV0dXJuIHBhcnNlci5FTlRJVElFU1tlbnRpdHldXG4gIGlmIChwYXJzZXIuRU5USVRJRVNbZW50aXR5TENdKVxuICAgIHJldHVybiBwYXJzZXIuRU5USVRJRVNbZW50aXR5TENdXG4gIGVudGl0eSA9IGVudGl0eUxDXG4gIGlmIChlbnRpdHkuY2hhckF0KDApID09PSBcIiNcIikge1xuICAgIGlmIChlbnRpdHkuY2hhckF0KDEpID09PSBcInhcIikge1xuICAgICAgZW50aXR5ID0gZW50aXR5LnNsaWNlKDIpXG4gICAgICBudW0gPSBwYXJzZUludChlbnRpdHksIDE2KVxuICAgICAgbnVtU3RyID0gbnVtLnRvU3RyaW5nKDE2KVxuICAgIH0gZWxzZSB7XG4gICAgICBlbnRpdHkgPSBlbnRpdHkuc2xpY2UoMSlcbiAgICAgIG51bSA9IHBhcnNlSW50KGVudGl0eSwgMTApXG4gICAgICBudW1TdHIgPSBudW0udG9TdHJpbmcoMTApXG4gICAgfVxuICB9XG4gIGVudGl0eSA9IGVudGl0eS5yZXBsYWNlKC9eMCsvLCBcIlwiKVxuICBpZiAobnVtU3RyLnRvTG93ZXJDYXNlKCkgIT09IGVudGl0eSkge1xuICAgIHN0cmljdEZhaWwocGFyc2VyLCBcIkludmFsaWQgY2hhcmFjdGVyIGVudGl0eVwiKVxuICAgIHJldHVybiBcIiZcIitwYXJzZXIuZW50aXR5ICsgXCI7XCJcbiAgfVxuXG4gIHJldHVybiBTdHJpbmcuZnJvbUNvZGVQb2ludChudW0pXG59XG5cbmZ1bmN0aW9uIHdyaXRlIChjaHVuaykge1xuICB2YXIgcGFyc2VyID0gdGhpc1xuICBpZiAodGhpcy5lcnJvcikgdGhyb3cgdGhpcy5lcnJvclxuICBpZiAocGFyc2VyLmNsb3NlZCkgcmV0dXJuIGVycm9yKHBhcnNlcixcbiAgICBcIkNhbm5vdCB3cml0ZSBhZnRlciBjbG9zZS4gQXNzaWduIGFuIG9ucmVhZHkgaGFuZGxlci5cIilcbiAgaWYgKGNodW5rID09PSBudWxsKSByZXR1cm4gZW5kKHBhcnNlcilcbiAgdmFyIGkgPSAwLCBjID0gXCJcIlxuICB3aGlsZSAocGFyc2VyLmMgPSBjID0gY2h1bmsuY2hhckF0KGkrKykpIHtcbiAgICBpZiAocGFyc2VyLnRyYWNrUG9zaXRpb24pIHtcbiAgICAgIHBhcnNlci5wb3NpdGlvbiArK1xuICAgICAgaWYgKGMgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgcGFyc2VyLmxpbmUgKytcbiAgICAgICAgcGFyc2VyLmNvbHVtbiA9IDBcbiAgICAgIH0gZWxzZSBwYXJzZXIuY29sdW1uICsrXG4gICAgfVxuICAgIHN3aXRjaCAocGFyc2VyLnN0YXRlKSB7XG5cbiAgICAgIGNhc2UgUy5CRUdJTjpcbiAgICAgICAgaWYgKGMgPT09IFwiPFwiKSB7XG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5PUEVOX1dBS0FcbiAgICAgICAgICBwYXJzZXIuc3RhcnRUYWdQb3NpdGlvbiA9IHBhcnNlci5wb3NpdGlvblxuICAgICAgICB9IGVsc2UgaWYgKG5vdCh3aGl0ZXNwYWNlLGMpKSB7XG4gICAgICAgICAgLy8gaGF2ZSB0byBwcm9jZXNzIHRoaXMgYXMgYSB0ZXh0IG5vZGUuXG4gICAgICAgICAgLy8gd2VpcmQsIGJ1dCBoYXBwZW5zLlxuICAgICAgICAgIHN0cmljdEZhaWwocGFyc2VyLCBcIk5vbi13aGl0ZXNwYWNlIGJlZm9yZSBmaXJzdCB0YWcuXCIpXG4gICAgICAgICAgcGFyc2VyLnRleHROb2RlID0gY1xuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuVEVYVFxuICAgICAgICB9XG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuVEVYVDpcbiAgICAgICAgaWYgKHBhcnNlci5zYXdSb290ICYmICFwYXJzZXIuY2xvc2VkUm9vdCkge1xuICAgICAgICAgIHZhciBzdGFydGkgPSBpLTFcbiAgICAgICAgICB3aGlsZSAoYyAmJiBjIT09XCI8XCIgJiYgYyE9PVwiJlwiKSB7XG4gICAgICAgICAgICBjID0gY2h1bmsuY2hhckF0KGkrKylcbiAgICAgICAgICAgIGlmIChjICYmIHBhcnNlci50cmFja1Bvc2l0aW9uKSB7XG4gICAgICAgICAgICAgIHBhcnNlci5wb3NpdGlvbiArK1xuICAgICAgICAgICAgICBpZiAoYyA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgICAgIHBhcnNlci5saW5lICsrXG4gICAgICAgICAgICAgICAgcGFyc2VyLmNvbHVtbiA9IDBcbiAgICAgICAgICAgICAgfSBlbHNlIHBhcnNlci5jb2x1bW4gKytcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyc2VyLnRleHROb2RlICs9IGNodW5rLnN1YnN0cmluZyhzdGFydGksIGktMSlcbiAgICAgICAgfVxuICAgICAgICBpZiAoYyA9PT0gXCI8XCIpIHtcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLk9QRU5fV0FLQVxuICAgICAgICAgIHBhcnNlci5zdGFydFRhZ1Bvc2l0aW9uID0gcGFyc2VyLnBvc2l0aW9uXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG5vdCh3aGl0ZXNwYWNlLCBjKSAmJiAoIXBhcnNlci5zYXdSb290IHx8IHBhcnNlci5jbG9zZWRSb290KSlcbiAgICAgICAgICAgIHN0cmljdEZhaWwocGFyc2VyLCBcIlRleHQgZGF0YSBvdXRzaWRlIG9mIHJvb3Qgbm9kZS5cIilcbiAgICAgICAgICBpZiAoYyA9PT0gXCImXCIpIHBhcnNlci5zdGF0ZSA9IFMuVEVYVF9FTlRJVFlcbiAgICAgICAgICBlbHNlIHBhcnNlci50ZXh0Tm9kZSArPSBjXG4gICAgICAgIH1cbiAgICAgIGNvbnRpbnVlXG5cbiAgICAgIGNhc2UgUy5TQ1JJUFQ6XG4gICAgICAgIC8vIG9ubHkgbm9uLXN0cmljdFxuICAgICAgICBpZiAoYyA9PT0gXCI8XCIpIHtcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLlNDUklQVF9FTkRJTkdcbiAgICAgICAgfSBlbHNlIHBhcnNlci5zY3JpcHQgKz0gY1xuICAgICAgY29udGludWVcblxuICAgICAgY2FzZSBTLlNDUklQVF9FTkRJTkc6XG4gICAgICAgIGlmIChjID09PSBcIi9cIikge1xuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuQ0xPU0VfVEFHXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFyc2VyLnNjcmlwdCArPSBcIjxcIiArIGNcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLlNDUklQVFxuICAgICAgICB9XG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuT1BFTl9XQUtBOlxuICAgICAgICAvLyBlaXRoZXIgYSAvLCA/LCAhLCBvciB0ZXh0IGlzIGNvbWluZyBuZXh0LlxuICAgICAgICBpZiAoYyA9PT0gXCIhXCIpIHtcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLlNHTUxfREVDTFxuICAgICAgICAgIHBhcnNlci5zZ21sRGVjbCA9IFwiXCJcbiAgICAgICAgfSBlbHNlIGlmIChpcyh3aGl0ZXNwYWNlLCBjKSkge1xuICAgICAgICAgIC8vIHdhaXQgZm9yIGl0Li4uXG4gICAgICAgIH0gZWxzZSBpZiAoaXMobmFtZVN0YXJ0LGMpKSB7XG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5PUEVOX1RBR1xuICAgICAgICAgIHBhcnNlci50YWdOYW1lID0gY1xuICAgICAgICB9IGVsc2UgaWYgKGMgPT09IFwiL1wiKSB7XG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5DTE9TRV9UQUdcbiAgICAgICAgICBwYXJzZXIudGFnTmFtZSA9IFwiXCJcbiAgICAgICAgfSBlbHNlIGlmIChjID09PSBcIj9cIikge1xuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuUFJPQ19JTlNUXG4gICAgICAgICAgcGFyc2VyLnByb2NJbnN0TmFtZSA9IHBhcnNlci5wcm9jSW5zdEJvZHkgPSBcIlwiXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyaWN0RmFpbChwYXJzZXIsIFwiVW5lbmNvZGVkIDxcIilcbiAgICAgICAgICAvLyBpZiB0aGVyZSB3YXMgc29tZSB3aGl0ZXNwYWNlLCB0aGVuIGFkZCB0aGF0IGluLlxuICAgICAgICAgIGlmIChwYXJzZXIuc3RhcnRUYWdQb3NpdGlvbiArIDEgPCBwYXJzZXIucG9zaXRpb24pIHtcbiAgICAgICAgICAgIHZhciBwYWQgPSBwYXJzZXIucG9zaXRpb24gLSBwYXJzZXIuc3RhcnRUYWdQb3NpdGlvblxuICAgICAgICAgICAgYyA9IG5ldyBBcnJheShwYWQpLmpvaW4oXCIgXCIpICsgY1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJzZXIudGV4dE5vZGUgKz0gXCI8XCIgKyBjXG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5URVhUXG4gICAgICAgIH1cbiAgICAgIGNvbnRpbnVlXG5cbiAgICAgIGNhc2UgUy5TR01MX0RFQ0w6XG4gICAgICAgIGlmICgocGFyc2VyLnNnbWxEZWNsK2MpLnRvVXBwZXJDYXNlKCkgPT09IENEQVRBKSB7XG4gICAgICAgICAgZW1pdE5vZGUocGFyc2VyLCBcIm9ub3BlbmNkYXRhXCIpXG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5DREFUQVxuICAgICAgICAgIHBhcnNlci5zZ21sRGVjbCA9IFwiXCJcbiAgICAgICAgICBwYXJzZXIuY2RhdGEgPSBcIlwiXG4gICAgICAgIH0gZWxzZSBpZiAocGFyc2VyLnNnbWxEZWNsK2MgPT09IFwiLS1cIikge1xuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuQ09NTUVOVFxuICAgICAgICAgIHBhcnNlci5jb21tZW50ID0gXCJcIlxuICAgICAgICAgIHBhcnNlci5zZ21sRGVjbCA9IFwiXCJcbiAgICAgICAgfSBlbHNlIGlmICgocGFyc2VyLnNnbWxEZWNsK2MpLnRvVXBwZXJDYXNlKCkgPT09IERPQ1RZUEUpIHtcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLkRPQ1RZUEVcbiAgICAgICAgICBpZiAocGFyc2VyLmRvY3R5cGUgfHwgcGFyc2VyLnNhd1Jvb3QpIHN0cmljdEZhaWwocGFyc2VyLFxuICAgICAgICAgICAgXCJJbmFwcHJvcHJpYXRlbHkgbG9jYXRlZCBkb2N0eXBlIGRlY2xhcmF0aW9uXCIpXG4gICAgICAgICAgcGFyc2VyLmRvY3R5cGUgPSBcIlwiXG4gICAgICAgICAgcGFyc2VyLnNnbWxEZWNsID0gXCJcIlxuICAgICAgICB9IGVsc2UgaWYgKGMgPT09IFwiPlwiKSB7XG4gICAgICAgICAgZW1pdE5vZGUocGFyc2VyLCBcIm9uc2dtbGRlY2xhcmF0aW9uXCIsIHBhcnNlci5zZ21sRGVjbClcbiAgICAgICAgICBwYXJzZXIuc2dtbERlY2wgPSBcIlwiXG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5URVhUXG4gICAgICAgIH0gZWxzZSBpZiAoaXMocXVvdGUsIGMpKSB7XG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5TR01MX0RFQ0xfUVVPVEVEXG4gICAgICAgICAgcGFyc2VyLnNnbWxEZWNsICs9IGNcbiAgICAgICAgfSBlbHNlIHBhcnNlci5zZ21sRGVjbCArPSBjXG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuU0dNTF9ERUNMX1FVT1RFRDpcbiAgICAgICAgaWYgKGMgPT09IHBhcnNlci5xKSB7XG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5TR01MX0RFQ0xcbiAgICAgICAgICBwYXJzZXIucSA9IFwiXCJcbiAgICAgICAgfVxuICAgICAgICBwYXJzZXIuc2dtbERlY2wgKz0gY1xuICAgICAgY29udGludWVcblxuICAgICAgY2FzZSBTLkRPQ1RZUEU6XG4gICAgICAgIGlmIChjID09PSBcIj5cIikge1xuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuVEVYVFxuICAgICAgICAgIGVtaXROb2RlKHBhcnNlciwgXCJvbmRvY3R5cGVcIiwgcGFyc2VyLmRvY3R5cGUpXG4gICAgICAgICAgcGFyc2VyLmRvY3R5cGUgPSB0cnVlIC8vIGp1c3QgcmVtZW1iZXIgdGhhdCB3ZSBzYXcgaXQuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFyc2VyLmRvY3R5cGUgKz0gY1xuICAgICAgICAgIGlmIChjID09PSBcIltcIikgcGFyc2VyLnN0YXRlID0gUy5ET0NUWVBFX0RURFxuICAgICAgICAgIGVsc2UgaWYgKGlzKHF1b3RlLCBjKSkge1xuICAgICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5ET0NUWVBFX1FVT1RFRFxuICAgICAgICAgICAgcGFyc2VyLnEgPSBjXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuRE9DVFlQRV9RVU9URUQ6XG4gICAgICAgIHBhcnNlci5kb2N0eXBlICs9IGNcbiAgICAgICAgaWYgKGMgPT09IHBhcnNlci5xKSB7XG4gICAgICAgICAgcGFyc2VyLnEgPSBcIlwiXG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5ET0NUWVBFXG4gICAgICAgIH1cbiAgICAgIGNvbnRpbnVlXG5cbiAgICAgIGNhc2UgUy5ET0NUWVBFX0RURDpcbiAgICAgICAgcGFyc2VyLmRvY3R5cGUgKz0gY1xuICAgICAgICBpZiAoYyA9PT0gXCJdXCIpIHBhcnNlci5zdGF0ZSA9IFMuRE9DVFlQRVxuICAgICAgICBlbHNlIGlmIChpcyhxdW90ZSxjKSkge1xuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuRE9DVFlQRV9EVERfUVVPVEVEXG4gICAgICAgICAgcGFyc2VyLnEgPSBjXG4gICAgICAgIH1cbiAgICAgIGNvbnRpbnVlXG5cbiAgICAgIGNhc2UgUy5ET0NUWVBFX0RURF9RVU9URUQ6XG4gICAgICAgIHBhcnNlci5kb2N0eXBlICs9IGNcbiAgICAgICAgaWYgKGMgPT09IHBhcnNlci5xKSB7XG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5ET0NUWVBFX0RURFxuICAgICAgICAgIHBhcnNlci5xID0gXCJcIlxuICAgICAgICB9XG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuQ09NTUVOVDpcbiAgICAgICAgaWYgKGMgPT09IFwiLVwiKSBwYXJzZXIuc3RhdGUgPSBTLkNPTU1FTlRfRU5ESU5HXG4gICAgICAgIGVsc2UgcGFyc2VyLmNvbW1lbnQgKz0gY1xuICAgICAgY29udGludWVcblxuICAgICAgY2FzZSBTLkNPTU1FTlRfRU5ESU5HOlxuICAgICAgICBpZiAoYyA9PT0gXCItXCIpIHtcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLkNPTU1FTlRfRU5ERURcbiAgICAgICAgICBwYXJzZXIuY29tbWVudCA9IHRleHRvcHRzKHBhcnNlci5vcHQsIHBhcnNlci5jb21tZW50KVxuICAgICAgICAgIGlmIChwYXJzZXIuY29tbWVudCkgZW1pdE5vZGUocGFyc2VyLCBcIm9uY29tbWVudFwiLCBwYXJzZXIuY29tbWVudClcbiAgICAgICAgICBwYXJzZXIuY29tbWVudCA9IFwiXCJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJzZXIuY29tbWVudCArPSBcIi1cIiArIGNcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLkNPTU1FTlRcbiAgICAgICAgfVxuICAgICAgY29udGludWVcblxuICAgICAgY2FzZSBTLkNPTU1FTlRfRU5ERUQ6XG4gICAgICAgIGlmIChjICE9PSBcIj5cIikge1xuICAgICAgICAgIHN0cmljdEZhaWwocGFyc2VyLCBcIk1hbGZvcm1lZCBjb21tZW50XCIpXG4gICAgICAgICAgLy8gYWxsb3cgPCEtLSBibGFoIC0tIGJsb28gLS0+IGluIG5vbi1zdHJpY3QgbW9kZSxcbiAgICAgICAgICAvLyB3aGljaCBpcyBhIGNvbW1lbnQgb2YgXCIgYmxhaCAtLSBibG9vIFwiXG4gICAgICAgICAgcGFyc2VyLmNvbW1lbnQgKz0gXCItLVwiICsgY1xuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuQ09NTUVOVFxuICAgICAgICB9IGVsc2UgcGFyc2VyLnN0YXRlID0gUy5URVhUXG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuQ0RBVEE6XG4gICAgICAgIGlmIChjID09PSBcIl1cIikgcGFyc2VyLnN0YXRlID0gUy5DREFUQV9FTkRJTkdcbiAgICAgICAgZWxzZSBwYXJzZXIuY2RhdGEgKz0gY1xuICAgICAgY29udGludWVcblxuICAgICAgY2FzZSBTLkNEQVRBX0VORElORzpcbiAgICAgICAgaWYgKGMgPT09IFwiXVwiKSBwYXJzZXIuc3RhdGUgPSBTLkNEQVRBX0VORElOR18yXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHBhcnNlci5jZGF0YSArPSBcIl1cIiArIGNcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLkNEQVRBXG4gICAgICAgIH1cbiAgICAgIGNvbnRpbnVlXG5cbiAgICAgIGNhc2UgUy5DREFUQV9FTkRJTkdfMjpcbiAgICAgICAgaWYgKGMgPT09IFwiPlwiKSB7XG4gICAgICAgICAgaWYgKHBhcnNlci5jZGF0YSkgZW1pdE5vZGUocGFyc2VyLCBcIm9uY2RhdGFcIiwgcGFyc2VyLmNkYXRhKVxuICAgICAgICAgIGVtaXROb2RlKHBhcnNlciwgXCJvbmNsb3NlY2RhdGFcIilcbiAgICAgICAgICBwYXJzZXIuY2RhdGEgPSBcIlwiXG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5URVhUXG4gICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gXCJdXCIpIHtcbiAgICAgICAgICBwYXJzZXIuY2RhdGEgKz0gXCJdXCJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJzZXIuY2RhdGEgKz0gXCJdXVwiICsgY1xuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuQ0RBVEFcbiAgICAgICAgfVxuICAgICAgY29udGludWVcblxuICAgICAgY2FzZSBTLlBST0NfSU5TVDpcbiAgICAgICAgaWYgKGMgPT09IFwiP1wiKSBwYXJzZXIuc3RhdGUgPSBTLlBST0NfSU5TVF9FTkRJTkdcbiAgICAgICAgZWxzZSBpZiAoaXMod2hpdGVzcGFjZSwgYykpIHBhcnNlci5zdGF0ZSA9IFMuUFJPQ19JTlNUX0JPRFlcbiAgICAgICAgZWxzZSBwYXJzZXIucHJvY0luc3ROYW1lICs9IGNcbiAgICAgIGNvbnRpbnVlXG5cbiAgICAgIGNhc2UgUy5QUk9DX0lOU1RfQk9EWTpcbiAgICAgICAgaWYgKCFwYXJzZXIucHJvY0luc3RCb2R5ICYmIGlzKHdoaXRlc3BhY2UsIGMpKSBjb250aW51ZVxuICAgICAgICBlbHNlIGlmIChjID09PSBcIj9cIikgcGFyc2VyLnN0YXRlID0gUy5QUk9DX0lOU1RfRU5ESU5HXG4gICAgICAgIGVsc2UgcGFyc2VyLnByb2NJbnN0Qm9keSArPSBjXG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuUFJPQ19JTlNUX0VORElORzpcbiAgICAgICAgaWYgKGMgPT09IFwiPlwiKSB7XG4gICAgICAgICAgZW1pdE5vZGUocGFyc2VyLCBcIm9ucHJvY2Vzc2luZ2luc3RydWN0aW9uXCIsIHtcbiAgICAgICAgICAgIG5hbWUgOiBwYXJzZXIucHJvY0luc3ROYW1lLFxuICAgICAgICAgICAgYm9keSA6IHBhcnNlci5wcm9jSW5zdEJvZHlcbiAgICAgICAgICB9KVxuICAgICAgICAgIHBhcnNlci5wcm9jSW5zdE5hbWUgPSBwYXJzZXIucHJvY0luc3RCb2R5ID0gXCJcIlxuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuVEVYVFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhcnNlci5wcm9jSW5zdEJvZHkgKz0gXCI/XCIgKyBjXG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5QUk9DX0lOU1RfQk9EWVxuICAgICAgICB9XG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuT1BFTl9UQUc6XG4gICAgICAgIGlmIChpcyhuYW1lQm9keSwgYykpIHBhcnNlci50YWdOYW1lICs9IGNcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgbmV3VGFnKHBhcnNlcilcbiAgICAgICAgICBpZiAoYyA9PT0gXCI+XCIpIG9wZW5UYWcocGFyc2VyKVxuICAgICAgICAgIGVsc2UgaWYgKGMgPT09IFwiL1wiKSBwYXJzZXIuc3RhdGUgPSBTLk9QRU5fVEFHX1NMQVNIXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAobm90KHdoaXRlc3BhY2UsIGMpKSBzdHJpY3RGYWlsKFxuICAgICAgICAgICAgICBwYXJzZXIsIFwiSW52YWxpZCBjaGFyYWN0ZXIgaW4gdGFnIG5hbWVcIilcbiAgICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuQVRUUklCXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuT1BFTl9UQUdfU0xBU0g6XG4gICAgICAgIGlmIChjID09PSBcIj5cIikge1xuICAgICAgICAgIG9wZW5UYWcocGFyc2VyLCB0cnVlKVxuICAgICAgICAgIGNsb3NlVGFnKHBhcnNlcilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHJpY3RGYWlsKHBhcnNlciwgXCJGb3J3YXJkLXNsYXNoIGluIG9wZW5pbmcgdGFnIG5vdCBmb2xsb3dlZCBieSA+XCIpXG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5BVFRSSUJcbiAgICAgICAgfVxuICAgICAgY29udGludWVcblxuICAgICAgY2FzZSBTLkFUVFJJQjpcbiAgICAgICAgLy8gaGF2ZW4ndCByZWFkIHRoZSBhdHRyaWJ1dGUgbmFtZSB5ZXQuXG4gICAgICAgIGlmIChpcyh3aGl0ZXNwYWNlLCBjKSkgY29udGludWVcbiAgICAgICAgZWxzZSBpZiAoYyA9PT0gXCI+XCIpIG9wZW5UYWcocGFyc2VyKVxuICAgICAgICBlbHNlIGlmIChjID09PSBcIi9cIikgcGFyc2VyLnN0YXRlID0gUy5PUEVOX1RBR19TTEFTSFxuICAgICAgICBlbHNlIGlmIChpcyhuYW1lU3RhcnQsIGMpKSB7XG4gICAgICAgICAgcGFyc2VyLmF0dHJpYk5hbWUgPSBjXG4gICAgICAgICAgcGFyc2VyLmF0dHJpYlZhbHVlID0gXCJcIlxuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IFMuQVRUUklCX05BTUVcbiAgICAgICAgfSBlbHNlIHN0cmljdEZhaWwocGFyc2VyLCBcIkludmFsaWQgYXR0cmlidXRlIG5hbWVcIilcbiAgICAgIGNvbnRpbnVlXG5cbiAgICAgIGNhc2UgUy5BVFRSSUJfTkFNRTpcbiAgICAgICAgaWYgKGMgPT09IFwiPVwiKSBwYXJzZXIuc3RhdGUgPSBTLkFUVFJJQl9WQUxVRVxuICAgICAgICBlbHNlIGlmIChjID09PSBcIj5cIikge1xuICAgICAgICAgIHN0cmljdEZhaWwocGFyc2VyLCBcIkF0dHJpYnV0ZSB3aXRob3V0IHZhbHVlXCIpXG4gICAgICAgICAgcGFyc2VyLmF0dHJpYlZhbHVlID0gcGFyc2VyLmF0dHJpYk5hbWVcbiAgICAgICAgICBhdHRyaWIocGFyc2VyKVxuICAgICAgICAgIG9wZW5UYWcocGFyc2VyKVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzKHdoaXRlc3BhY2UsIGMpKSBwYXJzZXIuc3RhdGUgPSBTLkFUVFJJQl9OQU1FX1NBV19XSElURVxuICAgICAgICBlbHNlIGlmIChpcyhuYW1lQm9keSwgYykpIHBhcnNlci5hdHRyaWJOYW1lICs9IGNcbiAgICAgICAgZWxzZSBzdHJpY3RGYWlsKHBhcnNlciwgXCJJbnZhbGlkIGF0dHJpYnV0ZSBuYW1lXCIpXG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuQVRUUklCX05BTUVfU0FXX1dISVRFOlxuICAgICAgICBpZiAoYyA9PT0gXCI9XCIpIHBhcnNlci5zdGF0ZSA9IFMuQVRUUklCX1ZBTFVFXG4gICAgICAgIGVsc2UgaWYgKGlzKHdoaXRlc3BhY2UsIGMpKSBjb250aW51ZVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBzdHJpY3RGYWlsKHBhcnNlciwgXCJBdHRyaWJ1dGUgd2l0aG91dCB2YWx1ZVwiKVxuICAgICAgICAgIHBhcnNlci50YWcuYXR0cmlidXRlc1twYXJzZXIuYXR0cmliTmFtZV0gPSBcIlwiXG4gICAgICAgICAgcGFyc2VyLmF0dHJpYlZhbHVlID0gXCJcIlxuICAgICAgICAgIGVtaXROb2RlKHBhcnNlciwgXCJvbmF0dHJpYnV0ZVwiLFxuICAgICAgICAgICAgICAgICAgIHsgbmFtZSA6IHBhcnNlci5hdHRyaWJOYW1lLCB2YWx1ZSA6IFwiXCIgfSlcbiAgICAgICAgICBwYXJzZXIuYXR0cmliTmFtZSA9IFwiXCJcbiAgICAgICAgICBpZiAoYyA9PT0gXCI+XCIpIG9wZW5UYWcocGFyc2VyKVxuICAgICAgICAgIGVsc2UgaWYgKGlzKG5hbWVTdGFydCwgYykpIHtcbiAgICAgICAgICAgIHBhcnNlci5hdHRyaWJOYW1lID0gY1xuICAgICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5BVFRSSUJfTkFNRVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHJpY3RGYWlsKHBhcnNlciwgXCJJbnZhbGlkIGF0dHJpYnV0ZSBuYW1lXCIpXG4gICAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLkFUVFJJQlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgY29udGludWVcblxuICAgICAgY2FzZSBTLkFUVFJJQl9WQUxVRTpcbiAgICAgICAgaWYgKGlzKHdoaXRlc3BhY2UsIGMpKSBjb250aW51ZVxuICAgICAgICBlbHNlIGlmIChpcyhxdW90ZSwgYykpIHtcbiAgICAgICAgICBwYXJzZXIucSA9IGNcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLkFUVFJJQl9WQUxVRV9RVU9URURcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHJpY3RGYWlsKHBhcnNlciwgXCJVbnF1b3RlZCBhdHRyaWJ1dGUgdmFsdWVcIilcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLkFUVFJJQl9WQUxVRV9VTlFVT1RFRFxuICAgICAgICAgIHBhcnNlci5hdHRyaWJWYWx1ZSA9IGNcbiAgICAgICAgfVxuICAgICAgY29udGludWVcblxuICAgICAgY2FzZSBTLkFUVFJJQl9WQUxVRV9RVU9URUQ6XG4gICAgICAgIGlmIChjICE9PSBwYXJzZXIucSkge1xuICAgICAgICAgIGlmIChjID09PSBcIiZcIikgcGFyc2VyLnN0YXRlID0gUy5BVFRSSUJfVkFMVUVfRU5USVRZX1FcbiAgICAgICAgICBlbHNlIHBhcnNlci5hdHRyaWJWYWx1ZSArPSBjXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgICBhdHRyaWIocGFyc2VyKVxuICAgICAgICBwYXJzZXIucSA9IFwiXCJcbiAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5BVFRSSUJfVkFMVUVfQ0xPU0VEXG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuQVRUUklCX1ZBTFVFX0NMT1NFRDpcbiAgICAgICAgaWYgKGlzKHdoaXRlc3BhY2UsIGMpKSB7XG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5BVFRSSUJcbiAgICAgICAgfSBlbHNlIGlmIChjID09PSBcIj5cIikgb3BlblRhZyhwYXJzZXIpXG4gICAgICAgIGVsc2UgaWYgKGMgPT09IFwiL1wiKSBwYXJzZXIuc3RhdGUgPSBTLk9QRU5fVEFHX1NMQVNIXG4gICAgICAgIGVsc2UgaWYgKGlzKG5hbWVTdGFydCwgYykpIHtcbiAgICAgICAgICBzdHJpY3RGYWlsKHBhcnNlciwgXCJObyB3aGl0ZXNwYWNlIGJldHdlZW4gYXR0cmlidXRlc1wiKVxuICAgICAgICAgIHBhcnNlci5hdHRyaWJOYW1lID0gY1xuICAgICAgICAgIHBhcnNlci5hdHRyaWJWYWx1ZSA9IFwiXCJcbiAgICAgICAgICBwYXJzZXIuc3RhdGUgPSBTLkFUVFJJQl9OQU1FXG4gICAgICAgIH0gZWxzZSBzdHJpY3RGYWlsKHBhcnNlciwgXCJJbnZhbGlkIGF0dHJpYnV0ZSBuYW1lXCIpXG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuQVRUUklCX1ZBTFVFX1VOUVVPVEVEOlxuICAgICAgICBpZiAobm90KGF0dHJpYkVuZCxjKSkge1xuICAgICAgICAgIGlmIChjID09PSBcIiZcIikgcGFyc2VyLnN0YXRlID0gUy5BVFRSSUJfVkFMVUVfRU5USVRZX1VcbiAgICAgICAgICBlbHNlIHBhcnNlci5hdHRyaWJWYWx1ZSArPSBjXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgICBhdHRyaWIocGFyc2VyKVxuICAgICAgICBpZiAoYyA9PT0gXCI+XCIpIG9wZW5UYWcocGFyc2VyKVxuICAgICAgICBlbHNlIHBhcnNlci5zdGF0ZSA9IFMuQVRUUklCXG4gICAgICBjb250aW51ZVxuXG4gICAgICBjYXNlIFMuQ0xPU0VfVEFHOlxuICAgICAgICBpZiAoIXBhcnNlci50YWdOYW1lKSB7XG4gICAgICAgICAgaWYgKGlzKHdoaXRlc3BhY2UsIGMpKSBjb250aW51ZVxuICAgICAgICAgIGVsc2UgaWYgKG5vdChuYW1lU3RhcnQsIGMpKSB7XG4gICAgICAgICAgICBpZiAocGFyc2VyLnNjcmlwdCkge1xuICAgICAgICAgICAgICBwYXJzZXIuc2NyaXB0ICs9IFwiPC9cIiArIGNcbiAgICAgICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5TQ1JJUFRcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0cmljdEZhaWwocGFyc2VyLCBcIkludmFsaWQgdGFnbmFtZSBpbiBjbG9zaW5nIHRhZy5cIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgcGFyc2VyLnRhZ05hbWUgPSBjXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYyA9PT0gXCI+XCIpIGNsb3NlVGFnKHBhcnNlcilcbiAgICAgICAgZWxzZSBpZiAoaXMobmFtZUJvZHksIGMpKSBwYXJzZXIudGFnTmFtZSArPSBjXG4gICAgICAgIGVsc2UgaWYgKHBhcnNlci5zY3JpcHQpIHtcbiAgICAgICAgICBwYXJzZXIuc2NyaXB0ICs9IFwiPC9cIiArIHBhcnNlci50YWdOYW1lXG4gICAgICAgICAgcGFyc2VyLnRhZ05hbWUgPSBcIlwiXG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5TQ1JJUFRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAobm90KHdoaXRlc3BhY2UsIGMpKSBzdHJpY3RGYWlsKHBhcnNlcixcbiAgICAgICAgICAgIFwiSW52YWxpZCB0YWduYW1lIGluIGNsb3NpbmcgdGFnXCIpXG4gICAgICAgICAgcGFyc2VyLnN0YXRlID0gUy5DTE9TRV9UQUdfU0FXX1dISVRFXG4gICAgICAgIH1cbiAgICAgIGNvbnRpbnVlXG5cbiAgICAgIGNhc2UgUy5DTE9TRV9UQUdfU0FXX1dISVRFOlxuICAgICAgICBpZiAoaXMod2hpdGVzcGFjZSwgYykpIGNvbnRpbnVlXG4gICAgICAgIGlmIChjID09PSBcIj5cIikgY2xvc2VUYWcocGFyc2VyKVxuICAgICAgICBlbHNlIHN0cmljdEZhaWwocGFyc2VyLCBcIkludmFsaWQgY2hhcmFjdGVycyBpbiBjbG9zaW5nIHRhZ1wiKVxuICAgICAgY29udGludWVcblxuICAgICAgY2FzZSBTLlRFWFRfRU5USVRZOlxuICAgICAgY2FzZSBTLkFUVFJJQl9WQUxVRV9FTlRJVFlfUTpcbiAgICAgIGNhc2UgUy5BVFRSSUJfVkFMVUVfRU5USVRZX1U6XG4gICAgICAgIHN3aXRjaChwYXJzZXIuc3RhdGUpIHtcbiAgICAgICAgICBjYXNlIFMuVEVYVF9FTlRJVFk6XG4gICAgICAgICAgICB2YXIgcmV0dXJuU3RhdGUgPSBTLlRFWFQsIGJ1ZmZlciA9IFwidGV4dE5vZGVcIlxuICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICBjYXNlIFMuQVRUUklCX1ZBTFVFX0VOVElUWV9ROlxuICAgICAgICAgICAgdmFyIHJldHVyblN0YXRlID0gUy5BVFRSSUJfVkFMVUVfUVVPVEVELCBidWZmZXIgPSBcImF0dHJpYlZhbHVlXCJcbiAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgY2FzZSBTLkFUVFJJQl9WQUxVRV9FTlRJVFlfVTpcbiAgICAgICAgICAgIHZhciByZXR1cm5TdGF0ZSA9IFMuQVRUUklCX1ZBTFVFX1VOUVVPVEVELCBidWZmZXIgPSBcImF0dHJpYlZhbHVlXCJcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICAgIGlmIChjID09PSBcIjtcIikge1xuICAgICAgICAgIHBhcnNlcltidWZmZXJdICs9IHBhcnNlRW50aXR5KHBhcnNlcilcbiAgICAgICAgICBwYXJzZXIuZW50aXR5ID0gXCJcIlxuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IHJldHVyblN0YXRlXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXMoZW50aXR5LCBjKSkgcGFyc2VyLmVudGl0eSArPSBjXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHN0cmljdEZhaWwocGFyc2VyLCBcIkludmFsaWQgY2hhcmFjdGVyIGVudGl0eVwiKVxuICAgICAgICAgIHBhcnNlcltidWZmZXJdICs9IFwiJlwiICsgcGFyc2VyLmVudGl0eSArIGNcbiAgICAgICAgICBwYXJzZXIuZW50aXR5ID0gXCJcIlxuICAgICAgICAgIHBhcnNlci5zdGF0ZSA9IHJldHVyblN0YXRlXG4gICAgICAgIH1cbiAgICAgIGNvbnRpbnVlXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihwYXJzZXIsIFwiVW5rbm93biBzdGF0ZTogXCIgKyBwYXJzZXIuc3RhdGUpXG4gICAgfVxuICB9IC8vIHdoaWxlXG4gIC8vIGNkYXRhIGJsb2NrcyBjYW4gZ2V0IHZlcnkgYmlnIHVuZGVyIG5vcm1hbCBjb25kaXRpb25zLiBlbWl0IGFuZCBtb3ZlIG9uLlxuICAvLyBpZiAocGFyc2VyLnN0YXRlID09PSBTLkNEQVRBICYmIHBhcnNlci5jZGF0YSkge1xuICAvLyAgIGVtaXROb2RlKHBhcnNlciwgXCJvbmNkYXRhXCIsIHBhcnNlci5jZGF0YSlcbiAgLy8gICBwYXJzZXIuY2RhdGEgPSBcIlwiXG4gIC8vIH1cbiAgaWYgKHBhcnNlci5wb3NpdGlvbiA+PSBwYXJzZXIuYnVmZmVyQ2hlY2tQb3NpdGlvbikgY2hlY2tCdWZmZXJMZW5ndGgocGFyc2VyKVxuICByZXR1cm4gcGFyc2VyXG59XG5cbi8qISBodHRwOi8vbXRocy5iZS9mcm9tY29kZXBvaW50IHYwLjEuMCBieSBAbWF0aGlhcyAqL1xuaWYgKCFTdHJpbmcuZnJvbUNvZGVQb2ludCkge1xuICAgICAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0cmluZ0Zyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGU7XG4gICAgICAgICAgICAgICAgdmFyIGZsb29yID0gTWF0aC5mbG9vcjtcbiAgICAgICAgICAgICAgICB2YXIgZnJvbUNvZGVQb2ludCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIE1BWF9TSVpFID0gMHg0MDAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGVVbml0cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhpZ2hTdXJyb2dhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbG93U3Vycm9nYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2RlUG9pbnQgPSBOdW1iZXIoYXJndW1lbnRzW2luZGV4XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhaXNGaW5pdGUoY29kZVBvaW50KSB8fCAvLyBgTmFOYCwgYCtJbmZpbml0eWAsIG9yIGAtSW5maW5pdHlgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZVBvaW50IDwgMCB8fCAvLyBub3QgYSB2YWxpZCBVbmljb2RlIGNvZGUgcG9pbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlUG9pbnQgPiAweDEwRkZGRiB8fCAvLyBub3QgYSB2YWxpZCBVbmljb2RlIGNvZGUgcG9pbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbG9vcihjb2RlUG9pbnQpICE9IGNvZGVQb2ludCAvLyBub3QgYW4gaW50ZWdlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBSYW5nZUVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQ6ICcgKyBjb2RlUG9pbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2RlUG9pbnQgPD0gMHhGRkZGKSB7IC8vIEJNUCBjb2RlIHBvaW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZVVuaXRzLnB1c2goY29kZVBvaW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgLy8gQXN0cmFsIGNvZGUgcG9pbnQ7IHNwbGl0IGluIHN1cnJvZ2F0ZSBoYWx2ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nI3N1cnJvZ2F0ZS1mb3JtdWxhZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hTdXJyb2dhdGUgPSAoY29kZVBvaW50ID4+IDEwKSArIDB4RDgwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dTdXJyb2dhdGUgPSAoY29kZVBvaW50ICUgMHg0MDApICsgMHhEQzAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGVVbml0cy5wdXNoKGhpZ2hTdXJyb2dhdGUsIGxvd1N1cnJvZ2F0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICsgMSA9PSBsZW5ndGggfHwgY29kZVVuaXRzLmxlbmd0aCA+IE1BWF9TSVpFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IHN0cmluZ0Zyb21DaGFyQ29kZS5hcHBseShudWxsLCBjb2RlVW5pdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGVVbml0cy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0cmluZywgJ2Zyb21Db2RlUG9pbnQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd2YWx1ZSc6IGZyb21Db2RlUG9pbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdjb25maWd1cmFibGUnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnd3JpdGFibGUnOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgU3RyaW5nLmZyb21Db2RlUG9pbnQgPSBmcm9tQ29kZVBvaW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfSgpKTtcbn1cblxufSkodHlwZW9mIGV4cG9ydHMgPT09IFwidW5kZWZpbmVkXCIgPyBzYXggPSB7fSA6IGV4cG9ydHMpO1xuIl19
},{"undefined":undefined}],74:[function(_dereq_,module,exports){
/**
 * Tiny stack for browser or server
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2014 Jason Mulligan
 * @license BSD-3 <https://raw.github.com/avoidwork/tiny-stack/master/LICENSE>
 * @link http://avoidwork.github.io/tiny-stack
 * @module tiny-stack
 * @version 0.1.0
 */

( function ( global ) {

"use strict";

/**
 * TinyStack
 *
 * @constructor
 */
function TinyStack () {
	this.data = [null];
	this.top  = 0;
}

/**
 * Clears the stack
 *
 * @method clear
 * @memberOf TinyStack
 * @return {Object} {@link TinyStack}
 */
TinyStack.prototype.clear = function clear () {
	this.data = [null];
	this.top  = 0;

	return this;
};

/**
 * Gets the size of the stack
 *
 * @method length
 * @memberOf TinyStack
 * @return {Number} Size of stack
 */
TinyStack.prototype.length = function length () {
	return this.top;
};

/**
 * Gets the item at the top of the stack
 *
 * @method peek
 * @memberOf TinyStack
 * @return {Mixed} Item at the top of the stack
 */
TinyStack.prototype.peek = function peek () {
	return this.data[this.top];
};

/**
 * Gets & removes the item at the top of the stack
 *
 * @method pop
 * @memberOf TinyStack
 * @return {Mixed} Item at the top of the stack
 */
TinyStack.prototype.pop = function pop () {
	if ( this.top > 0 ) {
		this.top--;

		return this.data.pop();
	}
	else {
		return undefined;
	}
};

/**
 * Pushes an item onto the stack
 *
 * @method push
 * @memberOf TinyStack
 * @return {Object} {@link TinyStack}
 */
TinyStack.prototype.push = function push ( arg ) {
	this.data[++this.top] = arg;

	return this;
};

/**
 * TinyStack factory
 *
 * @method factory
 * @return {Object} {@link TinyStack}
 */
function factory () {
	return new TinyStack();
}

// Node, AMD & window supported
if ( typeof exports != "undefined" ) {
	module.exports = factory;
}
else if ( typeof define == "function" ) {
	define( function () {
		return factory;
	} );
}
else {
	global.stack = factory;
}
} )( this );

},{}],75:[function(_dereq_,module,exports){
module.exports = _dereq_(79);
},{"79":79}],76:[function(_dereq_,module,exports){
'use strict';

function Base() { }

Base.prototype.get = function(name) {
  return this.$model.properties.get(this, name);
};

Base.prototype.set = function(name, value) {
  this.$model.properties.set(this, name, value);
};


module.exports = Base;
},{}],77:[function(_dereq_,module,exports){
'use strict';

var pick = _dereq_(187),
    assign = _dereq_(182),
    forEach = _dereq_(95);

var parseNameNs = _dereq_(80).parseName;


function DescriptorBuilder(nameNs) {
  this.ns = nameNs;
  this.name = nameNs.name;
  this.allTypes = [];
  this.properties = [];
  this.propertiesByName = {};
}

module.exports = DescriptorBuilder;


DescriptorBuilder.prototype.build = function() {
  return pick(this, [ 'ns', 'name', 'allTypes', 'properties', 'propertiesByName', 'bodyProperty' ]);
};

/**
 * Add property at given index.
 *
 * @param {Object} p
 * @param {Number} [idx]
 * @param {Boolean} [validate=true]
 */
DescriptorBuilder.prototype.addProperty = function(p, idx, validate) {

  if (typeof idx === 'boolean') {
    validate = idx;
    idx = undefined;
  }

  this.addNamedProperty(p, validate !== false);

  var properties = this.properties;

  if (idx !== undefined) {
    properties.splice(idx, 0, p);
  } else {
    properties.push(p);
  }
};


DescriptorBuilder.prototype.replaceProperty = function(oldProperty, newProperty, replace) {
  var oldNameNs = oldProperty.ns;

  var props = this.properties,
      propertiesByName = this.propertiesByName,
      rename = oldProperty.name !== newProperty.name;

  if (oldProperty.isBody) {

    if (!newProperty.isBody) {
      throw new Error(
        'property <' + newProperty.ns.name + '> must be body property ' +
        'to refine <' + oldProperty.ns.name + '>');
    }

    // TODO: Check compatibility
    this.setBodyProperty(newProperty, false);
  }

  // validate existence and get location of old property
  var idx = props.indexOf(oldProperty);
  if (idx === -1) {
    throw new Error('property <' + oldNameNs.name + '> not found in property list');
  }

  // remove old property
  props.splice(idx, 1);

  // replacing the named property is intentional
  //
  //  * validate only if this is a "rename" operation
  //  * add at specific index unless we "replace"
  //
  this.addProperty(newProperty, replace ? undefined : idx, rename);

  // make new property available under old name
  propertiesByName[oldNameNs.name] = propertiesByName[oldNameNs.localName] = newProperty;
};


DescriptorBuilder.prototype.redefineProperty = function(p, targetPropertyName, replace) {

  var nsPrefix = p.ns.prefix;
  var parts = targetPropertyName.split('#');

  var name = parseNameNs(parts[0], nsPrefix);
  var attrName = parseNameNs(parts[1], name.prefix).name;

  var redefinedProperty = this.propertiesByName[attrName];
  if (!redefinedProperty) {
    throw new Error('refined property <' + attrName + '> not found');
  } else {
    this.replaceProperty(redefinedProperty, p, replace);
  }

  delete p.redefines;
};

DescriptorBuilder.prototype.addNamedProperty = function(p, validate) {
  var ns = p.ns,
      propsByName = this.propertiesByName;

  if (validate) {
    this.assertNotDefined(p, ns.name);
    this.assertNotDefined(p, ns.localName);
  }

  propsByName[ns.name] = propsByName[ns.localName] = p;
};

DescriptorBuilder.prototype.removeNamedProperty = function(p) {
  var ns = p.ns,
      propsByName = this.propertiesByName;

  delete propsByName[ns.name];
  delete propsByName[ns.localName];
};

DescriptorBuilder.prototype.setBodyProperty = function(p, validate) {

  if (validate && this.bodyProperty) {
    throw new Error(
      'body property defined multiple times ' +
      '(<' + this.bodyProperty.ns.name + '>, <' + p.ns.name + '>)');
  }

  this.bodyProperty = p;
};

DescriptorBuilder.prototype.addIdProperty = function(name) {
  var nameNs = parseNameNs(name, this.ns.prefix);

  var p = {
    name: nameNs.localName,
    type: 'String',
    isAttr: true,
    ns: nameNs
  };

  // ensure that id is always the first attribute (if present)
  this.addProperty(p, 0);
};

DescriptorBuilder.prototype.assertNotDefined = function(p, name) {
  var propertyName = p.name,
      definedProperty = this.propertiesByName[propertyName];

  if (definedProperty) {
    throw new Error(
      'property <' + propertyName + '> already defined; ' +
      'override of <' + definedProperty.definedBy.ns.name + '#' + definedProperty.ns.name + '> by ' +
      '<' + p.definedBy.ns.name + '#' + p.ns.name + '> not allowed without redefines');
  }
};

DescriptorBuilder.prototype.hasProperty = function(name) {
  return this.propertiesByName[name];
};

DescriptorBuilder.prototype.addTrait = function(t, inherited) {

  var allTypes = this.allTypes;

  if (allTypes.indexOf(t) !== -1) {
    return;
  }

  forEach(t.properties, function(p) {

    // clone property to allow extensions
    p = assign({}, p, {
      name: p.ns.localName,
      inherited: inherited
    });

    Object.defineProperty(p, 'definedBy', {
      value: t
    });

    var replaces = p.replaces,
        redefines = p.redefines;

    // add replace/redefine support
    if (replaces || redefines) {
      this.redefineProperty(p, replaces || redefines, replaces);
    } else {
      if (p.isBody) {
        this.setBodyProperty(p);
      }
      this.addProperty(p);
    }
  }, this);

  allTypes.push(t);
};

},{"182":182,"187":187,"80":80,"95":95}],78:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95);

var Base = _dereq_(76);


function Factory(model, properties) {
  this.model = model;
  this.properties = properties;
}

module.exports = Factory;


Factory.prototype.createType = function(descriptor) {

  var model = this.model;

  var props = this.properties,
      prototype = Object.create(Base.prototype);

  // initialize default values
  forEach(descriptor.properties, function(p) {
    if (!p.isMany && p.default !== undefined) {
      prototype[p.name] = p.default;
    }
  });

  props.defineModel(prototype, model);
  props.defineDescriptor(prototype, descriptor);

  var name = descriptor.ns.name;

  /**
   * The new type constructor
   */
  function ModdleElement(attrs) {
    props.define(this, '$type', { value: name, enumerable: true });
    props.define(this, '$attrs', { value: {} });
    props.define(this, '$parent', { writable: true });

    forEach(attrs, function(val, key) {
      this.set(key, val);
    }, this);
  }

  ModdleElement.prototype = prototype;

  ModdleElement.hasType = prototype.$instanceOf = this.model.hasType;

  // static links
  props.defineModel(ModdleElement, model);
  props.defineDescriptor(ModdleElement, descriptor);

  return ModdleElement;
};
},{"76":76,"95":95}],79:[function(_dereq_,module,exports){
'use strict';

var isString = _dereq_(180),
    isObject = _dereq_(179),
    forEach = _dereq_(95),
    find = _dereq_(94);


var Factory = _dereq_(78),
    Registry = _dereq_(82),
    Properties = _dereq_(81);

var parseNameNs = _dereq_(80).parseName;


//// Moddle implementation /////////////////////////////////////////////////

/**
 * @class Moddle
 *
 * A model that can be used to create elements of a specific type.
 *
 * @example
 *
 * var Moddle = require('moddle');
 *
 * var pkg = {
 *   name: 'mypackage',
 *   prefix: 'my',
 *   types: [
 *     { name: 'Root' }
 *   ]
 * };
 *
 * var moddle = new Moddle([pkg]);
 *
 * @param {Array<Package>} packages  the packages to contain
 * @param {Object} options  additional options to pass to the model
 */
function Moddle(packages, options) {

  options = options || {};

  this.properties = new Properties(this);

  this.factory = new Factory(this, this.properties);
  this.registry = new Registry(packages, this.properties, options);

  this.typeCache = {};
}

module.exports = Moddle;


/**
 * Create an instance of the specified type.
 *
 * @method Moddle#create
 *
 * @example
 *
 * var foo = moddle.create('my:Foo');
 * var bar = moddle.create('my:Bar', { id: 'BAR_1' });
 *
 * @param  {String|Object} descriptor the type descriptor or name know to the model
 * @param  {Object} attrs   a number of attributes to initialize the model instance with
 * @return {Object}         model instance
 */
Moddle.prototype.create = function(descriptor, attrs) {
  var Type = this.getType(descriptor);

  if (!Type) {
    throw new Error('unknown type <' + descriptor + '>');
  }

  return new Type(attrs);
};


/**
 * Returns the type representing a given descriptor
 *
 * @method Moddle#getType
 *
 * @example
 *
 * var Foo = moddle.getType('my:Foo');
 * var foo = new Foo({ 'id' : 'FOO_1' });
 *
 * @param  {String|Object} descriptor the type descriptor or name know to the model
 * @return {Object}         the type representing the descriptor
 */
Moddle.prototype.getType = function(descriptor) {

  var cache = this.typeCache;

  var name = isString(descriptor) ? descriptor : descriptor.ns.name;

  var type = cache[name];

  if (!type) {
    descriptor = this.registry.getEffectiveDescriptor(name);
    type = cache[name] = this.factory.createType(descriptor);
  }

  return type;
};


/**
 * Creates an any-element type to be used within model instances.
 *
 * This can be used to create custom elements that lie outside the meta-model.
 * The created element contains all the meta-data required to serialize it
 * as part of meta-model elements.
 *
 * @method Moddle#createAny
 *
 * @example
 *
 * var foo = moddle.createAny('vendor:Foo', 'http://vendor', {
 *   value: 'bar'
 * });
 *
 * var container = moddle.create('my:Container', 'http://my', {
 *   any: [ foo ]
 * });
 *
 * // go ahead and serialize the stuff
 *
 *
 * @param  {String} name  the name of the element
 * @param  {String} nsUri the namespace uri of the element
 * @param  {Object} [properties] a map of properties to initialize the instance with
 * @return {Object} the any type instance
 */
Moddle.prototype.createAny = function(name, nsUri, properties) {

  var nameNs = parseNameNs(name);

  var element = {
    $type: name
  };

  var descriptor = {
    name: name,
    isGeneric: true,
    ns: {
      prefix: nameNs.prefix,
      localName: nameNs.localName,
      uri: nsUri
    }
  };

  this.properties.defineDescriptor(element, descriptor);
  this.properties.defineModel(element, this);
  this.properties.define(element, '$parent', { enumerable: false, writable: true });

  forEach(properties, function(a, key) {
    if (isObject(a) && a.value !== undefined) {
      element[a.name] = a.value;
    } else {
      element[key] = a;
    }
  });

  return element;
};

/**
 * Returns a registered package by uri or prefix
 *
 * @return {Object} the package
 */
Moddle.prototype.getPackage = function(uriOrPrefix) {
  return this.registry.getPackage(uriOrPrefix);
};

/**
 * Returns a snapshot of all known packages
 *
 * @return {Object} the package
 */
Moddle.prototype.getPackages = function() {
  return this.registry.getPackages();
};

/**
 * Returns the descriptor for an element
 */
Moddle.prototype.getElementDescriptor = function(element) {
  return element.$descriptor;
};

/**
 * Returns true if the given descriptor or instance
 * represents the given type.
 *
 * May be applied to this, if element is omitted.
 */
Moddle.prototype.hasType = function(element, type) {
  if (type === undefined) {
    type = element;
    element = this;
  }

  var descriptor = element.$model.getElementDescriptor(element);

  return !!find(descriptor.allTypes, function(t) {
    return t.name === type;
  });
};


/**
 * Returns the descriptor of an elements named property
 */
Moddle.prototype.getPropertyDescriptor = function(element, property) {
  return this.getElementDescriptor(element).propertiesByName[property];
};

},{"179":179,"180":180,"78":78,"80":80,"81":81,"82":82,"94":94,"95":95}],80:[function(_dereq_,module,exports){
'use strict';

/**
 * Parses a namespaced attribute name of the form (ns:)localName to an object,
 * given a default prefix to assume in case no explicit namespace is given.
 *
 * @param {String} name
 * @param {String} [defaultPrefix] the default prefix to take, if none is present.
 *
 * @return {Object} the parsed name
 */
module.exports.parseName = function(name, defaultPrefix) {
  var parts = name.split(/:/),
      localName, prefix;

  // no prefix (i.e. only local name)
  if (parts.length === 1) {
    localName = name;
    prefix = defaultPrefix;
  } else
  // prefix + local name
  if (parts.length === 2) {
    localName = parts[1];
    prefix = parts[0];
  } else {
    throw new Error('expected <prefix:localName> or <localName>, got ' + name);
  }

  name = (prefix ? prefix + ':' : '') + localName;

  return {
    name: name,
    prefix: prefix,
    localName: localName
  };
};
},{}],81:[function(_dereq_,module,exports){
'use strict';


/**
 * A utility that gets and sets properties of model elements.
 *
 * @param {Model} model
 */
function Properties(model) {
  this.model = model;
}

module.exports = Properties;


/**
 * Sets a named property on the target element.
 * If the value is undefined, the property gets deleted.
 *
 * @param {Object} target
 * @param {String} name
 * @param {Object} value
 */
Properties.prototype.set = function(target, name, value) {

  var property = this.model.getPropertyDescriptor(target, name);

  var propertyName = property && property.name;

  if (isUndefined(value)) {
    // unset the property, if the specified value is undefined;
    // delete from $attrs (for extensions) or the target itself
    if (property) {
      delete target[propertyName];
    } else {
      delete target.$attrs[name];
    }
  } else {
    // set the property, defining well defined properties on the fly
    // or simply updating them in target.$attrs (for extensions)
    if (property) {
      if (propertyName in target) {
        target[propertyName] = value;
      } else {
        defineProperty(target, property, value);
      }
    } else {
      target.$attrs[name] = value;
    }
  }
};

/**
 * Returns the named property of the given element
 *
 * @param  {Object} target
 * @param  {String} name
 *
 * @return {Object}
 */
Properties.prototype.get = function(target, name) {

  var property = this.model.getPropertyDescriptor(target, name);

  if (!property) {
    return target.$attrs[name];
  }

  var propertyName = property.name;

  // check if access to collection property and lazily initialize it
  if (!target[propertyName] && property.isMany) {
    defineProperty(target, property, []);
  }

  return target[propertyName];
};


/**
 * Define a property on the target element
 *
 * @param  {Object} target
 * @param  {String} name
 * @param  {Object} options
 */
Properties.prototype.define = function(target, name, options) {
  Object.defineProperty(target, name, options);
};


/**
 * Define the descriptor for an element
 */
Properties.prototype.defineDescriptor = function(target, descriptor) {
  this.define(target, '$descriptor', { value: descriptor });
};

/**
 * Define the model for an element
 */
Properties.prototype.defineModel = function(target, model) {
  this.define(target, '$model', { value: model });
};


function isUndefined(val) {
  return typeof val === 'undefined';
}

function defineProperty(target, property, value) {
  Object.defineProperty(target, property.name, {
    enumerable: !property.isReference,
    writable: true,
    value: value,
    configurable: true
  });
}
},{}],82:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(182),
    forEach = _dereq_(95);

var Types = _dereq_(83),
    DescriptorBuilder = _dereq_(77);

var parseNameNs = _dereq_(80).parseName,
    isBuiltInType = Types.isBuiltIn;


function Registry(packages, properties, options) {
  this.options = assign({ generateId: 'id' }, options || {});

  this.packageMap = {};
  this.typeMap = {};

  this.packages = [];

  this.properties = properties;

  forEach(packages, this.registerPackage, this);
}

module.exports = Registry;


Registry.prototype.getPackage = function(uriOrPrefix) {
  return this.packageMap[uriOrPrefix];
};

Registry.prototype.getPackages = function() {
  return this.packages;
};


Registry.prototype.registerPackage = function(pkg) {

  // copy package
  pkg = assign({}, pkg);

  // register types
  forEach(pkg.types, function(descriptor) {
    this.registerType(descriptor, pkg);
  }, this);

  this.packageMap[pkg.uri] = this.packageMap[pkg.prefix] = pkg;
  this.packages.push(pkg);
};


/**
 * Register a type from a specific package with us
 */
Registry.prototype.registerType = function(type, pkg) {

  type = assign({}, type, {
    superClass: (type.superClass || []).slice(),
    extends: (type.extends || []).slice(),
    properties: (type.properties || []).slice()
  });

  var ns = parseNameNs(type.name, pkg.prefix),
      name = ns.name,
      propertiesByName = {};

  // parse properties
  forEach(type.properties, function(p) {

    // namespace property names
    var propertyNs = parseNameNs(p.name, ns.prefix),
        propertyName = propertyNs.name;

    // namespace property types
    if (!isBuiltInType(p.type)) {
      p.type = parseNameNs(p.type, propertyNs.prefix).name;
    }

    assign(p, {
      ns: propertyNs,
      name: propertyName
    });

    propertiesByName[propertyName] = p;
  });

  // update ns + name
  assign(type, {
    ns: ns,
    name: name,
    propertiesByName: propertiesByName
  });

  forEach(type.extends, function(extendsName) {
    var extended = this.typeMap[extendsName];

    extended.traits = extended.traits || [];
    extended.traits.push(name);
  }, this);

  // link to package
  this.definePackage(type, pkg);

  // register
  this.typeMap[name] = type;
};


/**
 * Traverse the type hierarchy from bottom to top,
 * calling iterator with (type, inherited) for all elements in
 * the inheritance chain.
 *
 * @param {Object} nsName
 * @param {Function} iterator
 * @param {Boolean} [trait=false]
 */
Registry.prototype.mapTypes = function(nsName, iterator, trait) {

  var type = isBuiltInType(nsName.name) ? { name: nsName.name } : this.typeMap[nsName.name];

  var self = this;

  /**
   * Traverse the selected trait.
   *
   * @param {String} cls
   */
  function traverseTrait(cls) {
    return traverseSuper(cls, true);
  }

  /**
   * Traverse the selected super type or trait
   *
   * @param {String} cls
   * @param {Boolean} [trait=false]
   */
  function traverseSuper(cls, trait) {
    var parentNs = parseNameNs(cls, isBuiltInType(cls) ? '' : nsName.prefix);
    self.mapTypes(parentNs, iterator, trait);
  }

  if (!type) {
    throw new Error('unknown type <' + nsName.name + '>');
  }

  forEach(type.superClass, trait ? traverseTrait : traverseSuper);

  // call iterator with (type, inherited=!trait)
  iterator(type, !trait);

  forEach(type.traits, traverseTrait);
};


/**
 * Returns the effective descriptor for a type.
 *
 * @param  {String} type the namespaced name (ns:localName) of the type
 *
 * @return {Descriptor} the resulting effective descriptor
 */
Registry.prototype.getEffectiveDescriptor = function(name) {

  var nsName = parseNameNs(name);

  var builder = new DescriptorBuilder(nsName);

  this.mapTypes(nsName, function(type, inherited) {
    builder.addTrait(type, inherited);
  });

  // check we have an id assigned
  var id = this.options.generateId;
  if (id && !builder.hasProperty(id)) {
    builder.addIdProperty(id);
  }

  var descriptor = builder.build();

  // define package link
  this.definePackage(descriptor, descriptor.allTypes[descriptor.allTypes.length - 1].$pkg);

  return descriptor;
};


Registry.prototype.definePackage = function(target, pkg) {
  this.properties.define(target, '$pkg', { value: pkg });
};
},{"182":182,"77":77,"80":80,"83":83,"95":95}],83:[function(_dereq_,module,exports){
'use strict';

/**
 * Built-in moddle types
 */
var BUILTINS = {
  String: true,
  Boolean: true,
  Integer: true,
  Real: true,
  Element: true
};

/**
 * Converters for built in types from string representations
 */
var TYPE_CONVERTERS = {
  String: function(s) { return s; },
  Boolean: function(s) { return s === 'true'; },
  Integer: function(s) { return parseInt(s, 10); },
  Real: function(s) { return parseFloat(s, 10); }
};

/**
 * Convert a type to its real representation
 */
module.exports.coerceType = function(type, value) {

  var converter = TYPE_CONVERTERS[type];

  if (converter) {
    return converter(value);
  } else {
    return value;
  }
};

/**
 * Return whether the given type is built-in
 */
module.exports.isBuiltIn = function(type) {
  return !!BUILTINS[type];
};

/**
 * Return whether the given type is simple
 */
module.exports.isSimple = function(type) {
  return !!TYPE_CONVERTERS[type];
};
},{}],84:[function(_dereq_,module,exports){
module.exports={
  "name": "DMN",

  "uri": "http://www.omg.org/spec/DMN/20151101/dmn11.xsd",
  "xml": {
      "tagAlias": "lowerCase"
  },
  "prefix": "dmn",
  "types": [
    {
      "name": "DMNElement",
      "properties": [
        { "name": "description", "type": "String" },
        { "name": "id", "type": "String", "isAttr": true },
        { "name": "label", "type": "String", "isAttr": true }
      ]
    },
    {
      "name": "NamedElement",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "name", "type": "String", "isAttr": true}
      ]
    },
    {
      "name": "DMNElementReference",
      "properties": [
        { "name": "href", "type": "String", "isAttr": true }
      ]
    },
    {
      "name": "Definitions",
      "superClass": [ "NamedElement" ],
      "properties": [
        { "name": "namespace", "type": "String", "isAttr": true },
        { "name": "typeLanguage", "type": "String", "isAttr": true, "default": "http://www.omg.org/spec/FEEL/20140401" },
        { "name": "expressionLanguage", "type": "String", "isAttr": true, "default": "http://www.omg.org/spec/FEEL/20140401" },
        { "name": "itemDefinition", "type": "ItemDefinition", "isMany": true, "xml": { "serialize": "property" } },
        { "name": "decision", "type": "Decision", "isMany": true, "xml": { "serialize": "property" } }
      ]
    },
    {
      "name": "ItemDefinition",
      "superClass": [ "NamedElement" ],
      "properties": [
        { "name": "typeLanguage", "type": "String", "isAttr": true },
        { "name": "isCollection", "type": "Boolean", "isAttr": true, "default": false },
        { "name": "typeRef", "type": "String" },
        { "name": "allowedValue", "type": "LiteralExpression", "isMany": true, "xml": { "serialize": "property" } }
      ]
    },
    {
      "name": "Expression",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "typeRef", "type": "String", "isAttr": true }
      ]
    },
    {
      "name": "LiteralExpression",
      "superClass": [ "Expression" ],
      "properties": [
        { "name": "expressionLanguage", "type": "String", "isAttr": true },
        { "name": "text", "type": "String" }
      ]
    },
    {
      "name": "DRGElement",
      "superClass": [ "NamedElement" ],
      "properties": []
    },
    {
      "name": "Decision",
      "superClass": [ "DRGElement" ],
      "properties": [
        { "name": "question", "type": "String" },
        { "name": "allowedAnswers", "type": "String" },
        { "name": "decisionTable", "type": "DecisionTable", "xml": { "serialize": "property" } }
      ]
    },
    {
      "name": "DecisionTable",
      "superClass": [ "Expression" ],
      "properties": [
        { "name": "input", "type": "InputClause", "isMany": true, "xml": { "serialize": "property" } },
        { "name": "output", "type": "OutputClause", "isMany": true, "xml": { "serialize": "property" } },
        { "name": "rule", "type": "DecisionRule", "isMany": true, "xml": { "serialize": "property" } },
        { "name": "hitPolicy", "type": "HitPolicy", "isAttr": true , "default": "UNIQUE" },
        { "name": "aggregation", "type": "BuiltinAggregator", "isAttr": true },
        { "name": "preferredOrientation", "type": "DecisionTableOrientation", "isAttr": true, "default": "Rule-as-Row" },
        { "name": "outputLabel", "type": "String", "isAttr": true }
      ]
    },
    {
      "name": "InputClause",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "inputExpression", "type": "LiteralExpression", "xml": { "serialize": "property" } },
        { "name": "inputValues", "type": "UnaryTests", "xml": { "serialize": "property" } }
      ]
    },
    {
      "name": "OutputClause",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "outputValues", "type": "UnaryTests", "xml": { "serialize": "property" } },
        { "name": "defaultOutputEntry", "type": "LiteralExpression", "xml": { "serialize": "property" } },
        { "name": "name", "type": "String", "isAttr": true },
        { "name": "typeRef", "type": "String", "isAttr": true }
      ]
    },
    {
      "name": "UnaryTests",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "text", "type": "String" },
        { "name": "expressionLanguage", "type": "String", "isAttr": true }
      ]
    },
    {
      "name": "DecisionRule",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "inputEntry", "type": "UnaryTests", "isMany": true, "xml": { "serialize": "property" } },
        { "name": "outputEntry", "type": "LiteralExpression", "isMany": true, "xml": { "serialize": "property" } }
      ]
    }
  ],
  "emumerations": [
    {
      "name": "HitPolicy",
      "literalValues": [
        {
          "name": "UNIQUE"
        },
        {
          "name": "FIRST"
        },
        {
          "name": "PRIORITY"
        },
        {
          "name": "ANY"
        },
        {
          "name": "COLLECT"
        },
        {
          "name": "RULE ORDER"
        },
        {
          "name": "OUTPUT ORDER"
        }
      ]
    },
    {
      "name": "BuiltinAggregator",
      "literalValues": [
        {
          "name": "SUM"
        },
        {
          "name": "COUNT"
        },
        {
          "name": "MIN"
        },
        {
          "name": "MAX"
        }
      ]
    },
    {
      "name": "DecisionTableOrientation",
      "literalValues": [
        {
          "name": "Rule-as-Row"
        },
        {
          "name": "Rule-as-Column"
        },
        {
          "name": "CrossTable"
        }
      ]
    }
  ]
}

},{}],85:[function(_dereq_,module,exports){
'use strict';

var hat = _dereq_(86);


/**
 * Create a new id generator / cache instance.
 *
 * You may optionally provide a seed that is used internally.
 *
 * @param {Seed} seed
 */
function Ids(seed) {

  if (!(this instanceof Ids)) {
    return new Ids(seed);
  }

  seed = seed || [ 128, 36, 1 ];
  this._seed = seed.length ? hat.rack(seed[0], seed[1], seed[2]) : seed;
}

module.exports = Ids;

/**
 * Generate a next id.
 *
 * @param {Object} [element] element to bind the id to
 *
 * @return {String} id
 */
Ids.prototype.next = function(element) {
  return this._seed(element || true);
};

/**
 * Generate a next id with a given prefix.
 *
 * @param {Object} [element] element to bind the id to
 *
 * @return {String} id
 */
Ids.prototype.nextPrefixed = function(prefix, element) {
  var id;

  do {
    id = prefix + this.next(true);
  } while (this.assigned(id));

  // claim {prefix}{random}
  this.claim(id, element);

  // return
  return id;
};

/**
 * Manually claim an existing id.
 *
 * @param {String} id
 * @param {String} [element] element the id is claimed by
 */
Ids.prototype.claim = function(id, element) {
  this._seed.set(id, element || true);
};

/**
 * Returns true if the given id has already been assigned.
 *
 * @param  {String} id
 * @return {Boolean}
 */
Ids.prototype.assigned = function(id) {
  return this._seed.get(id) || false;
};

/**
 * Unclaim an id.
 *
 * @param  {String} id the id to unclaim
 */
Ids.prototype.unclaim = function(id) {
  delete this._seed.hats[id];
};

},{"86":86}],86:[function(_dereq_,module,exports){
var hat = module.exports = function (bits, base) {
    if (!base) base = 16;
    if (bits === undefined) bits = 128;
    if (bits <= 0) return '0';
    
    var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
    for (var i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
    }
    
    var rem = digits - Math.floor(digits);
    
    var res = '';
    
    for (var i = 0; i < Math.floor(digits); i++) {
        var x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }
    
    if (rem) {
        var b = Math.pow(base, rem);
        var x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }
    
    var parsed = parseInt(res, base);
    if (parsed !== Infinity && parsed >= Math.pow(2, bits)) {
        return hat(bits, base)
    }
    else return res;
};

hat.rack = function (bits, base, expandBy) {
    var fn = function (data) {
        var iters = 0;
        do {
            if (iters ++ > 10) {
                if (expandBy) bits += expandBy;
                else throw new Error('too many ID collisions, use more bits')
            }
            
            var id = hat(bits, base);
        } while (Object.hasOwnProperty.call(hats, id));
        
        hats[id] = data;
        return id;
    };
    var hats = fn.hats = {};
    
    fn.get = function (id) {
        return fn.hats[id];
    };
    
    fn.set = function (id, value) {
        fn.hats[id] = value;
        return fn;
    };
    
    fn.bits = bits || 128;
    fn.base = base || 16;
    return fn;
};

},{}],87:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],88:[function(_dereq_,module,exports){
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],89:[function(_dereq_,module,exports){
var baseFlatten = _dereq_(124),
    baseUniq = _dereq_(143),
    restParam = _dereq_(102);

/**
 * Creates an array of unique values, in order, from all of the provided arrays
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {...Array} [arrays] The arrays to inspect.
 * @returns {Array} Returns the new array of combined values.
 * @example
 *
 * _.union([1, 2], [4, 2], [2, 1]);
 * // => [1, 2, 4]
 */
var union = restParam(function(arrays) {
  return baseUniq(baseFlatten(arrays, false, true));
});

module.exports = union;

},{"102":102,"124":124,"143":143}],90:[function(_dereq_,module,exports){
var baseCallback = _dereq_(114),
    baseUniq = _dereq_(143),
    isIterateeCall = _dereq_(163),
    sortedUniq = _dereq_(171);

/**
 * Creates a duplicate-free version of an array, using
 * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
 * for equality comparisons, in which only the first occurence of each element
 * is kept. Providing `true` for `isSorted` performs a faster search algorithm
 * for sorted arrays. If an iteratee function is provided it's invoked for
 * each element in the array to generate the criterion by which uniqueness
 * is computed. The `iteratee` is bound to `thisArg` and invoked with three
 * arguments: (value, index, array).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias unique
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {boolean} [isSorted] Specify the array is sorted.
 * @param {Function|Object|string} [iteratee] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new duplicate-value-free array.
 * @example
 *
 * _.uniq([2, 1, 2]);
 * // => [2, 1]
 *
 * // using `isSorted`
 * _.uniq([1, 1, 2], true);
 * // => [1, 2]
 *
 * // using an iteratee function
 * _.uniq([1, 2.5, 1.5, 2], function(n) {
 *   return this.floor(n);
 * }, Math);
 * // => [1, 2.5]
 *
 * // using the `_.property` callback shorthand
 * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
 * // => [{ 'x': 1 }, { 'x': 2 }]
 */
function uniq(array, isSorted, iteratee, thisArg) {
  var length = array ? array.length : 0;
  if (!length) {
    return [];
  }
  if (isSorted != null && typeof isSorted != 'boolean') {
    thisArg = iteratee;
    iteratee = isIterateeCall(array, isSorted, thisArg) ? undefined : isSorted;
    isSorted = false;
  }
  iteratee = iteratee == null ? iteratee : baseCallback(iteratee, thisArg, 3);
  return (isSorted)
    ? sortedUniq(array, iteratee)
    : baseUniq(array, iteratee);
}

module.exports = uniq;

},{"114":114,"143":143,"163":163,"171":171}],91:[function(_dereq_,module,exports){
module.exports = _dereq_(90);

},{"90":90}],92:[function(_dereq_,module,exports){
var arrayEvery = _dereq_(106),
    baseCallback = _dereq_(114),
    baseEvery = _dereq_(120),
    isArray = _dereq_(175),
    isIterateeCall = _dereq_(163);

/**
 * Checks if `predicate` returns truthy for **all** elements of `collection`.
 * The predicate is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias all
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`.
 * @example
 *
 * _.every([true, 1, null, 'yes'], Boolean);
 * // => false
 *
 * var users = [
 *   { 'user': 'barney', 'active': false },
 *   { 'user': 'fred',   'active': false }
 * ];
 *
 * // using the `_.matches` callback shorthand
 * _.every(users, { 'user': 'barney', 'active': false });
 * // => false
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.every(users, 'active', false);
 * // => true
 *
 * // using the `_.property` callback shorthand
 * _.every(users, 'active');
 * // => false
 */
function every(collection, predicate, thisArg) {
  var func = isArray(collection) ? arrayEvery : baseEvery;
  if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
    predicate = undefined;
  }
  if (typeof predicate != 'function' || thisArg !== undefined) {
    predicate = baseCallback(predicate, thisArg, 3);
  }
  return func(collection, predicate);
}

module.exports = every;

},{"106":106,"114":114,"120":120,"163":163,"175":175}],93:[function(_dereq_,module,exports){
var arrayFilter = _dereq_(107),
    baseCallback = _dereq_(114),
    baseFilter = _dereq_(121),
    isArray = _dereq_(175);

/**
 * Iterates over elements of `collection`, returning an array of all elements
 * `predicate` returns truthy for. The predicate is bound to `thisArg` and
 * invoked with three arguments: (value, index|key, collection).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias select
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Array} Returns the new filtered array.
 * @example
 *
 * _.filter([4, 5, 6], function(n) {
 *   return n % 2 == 0;
 * });
 * // => [4, 6]
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': true },
 *   { 'user': 'fred',   'age': 40, 'active': false }
 * ];
 *
 * // using the `_.matches` callback shorthand
 * _.pluck(_.filter(users, { 'age': 36, 'active': true }), 'user');
 * // => ['barney']
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.pluck(_.filter(users, 'active', false), 'user');
 * // => ['fred']
 *
 * // using the `_.property` callback shorthand
 * _.pluck(_.filter(users, 'active'), 'user');
 * // => ['barney']
 */
function filter(collection, predicate, thisArg) {
  var func = isArray(collection) ? arrayFilter : baseFilter;
  predicate = baseCallback(predicate, thisArg, 3);
  return func(collection, predicate);
}

module.exports = filter;

},{"107":107,"114":114,"121":121,"175":175}],94:[function(_dereq_,module,exports){
var baseEach = _dereq_(118),
    createFind = _dereq_(151);

/**
 * Iterates over elements of `collection`, returning the first element
 * `predicate` returns truthy for. The predicate is bound to `thisArg` and
 * invoked with three arguments: (value, index|key, collection).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias detect
 * @category Collection
 * @param {Array|Object|string} collection The collection to search.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36, 'active': true },
 *   { 'user': 'fred',    'age': 40, 'active': false },
 *   { 'user': 'pebbles', 'age': 1,  'active': true }
 * ];
 *
 * _.result(_.find(users, function(chr) {
 *   return chr.age < 40;
 * }), 'user');
 * // => 'barney'
 *
 * // using the `_.matches` callback shorthand
 * _.result(_.find(users, { 'age': 1, 'active': true }), 'user');
 * // => 'pebbles'
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.result(_.find(users, 'active', false), 'user');
 * // => 'fred'
 *
 * // using the `_.property` callback shorthand
 * _.result(_.find(users, 'active'), 'user');
 * // => 'barney'
 */
var find = createFind(baseEach);

module.exports = find;

},{"118":118,"151":151}],95:[function(_dereq_,module,exports){
var arrayEach = _dereq_(104),
    baseEach = _dereq_(118),
    createForEach = _dereq_(152);

/**
 * Iterates over elements of `collection` invoking `iteratee` for each element.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection). Iteratee functions may exit iteration early
 * by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length" property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2]).forEach(function(n) {
 *   console.log(n);
 * }).value();
 * // => logs each value from left to right and returns the array
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
 *   console.log(n, key);
 * });
 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
 */
var forEach = createForEach(arrayEach, baseEach);

module.exports = forEach;

},{"104":104,"118":118,"152":152}],96:[function(_dereq_,module,exports){
var arrayEachRight = _dereq_(105),
    baseEachRight = _dereq_(119),
    createForEach = _dereq_(152);

/**
 * This method is like `_.forEach` except that it iterates over elements of
 * `collection` from right to left.
 *
 * @static
 * @memberOf _
 * @alias eachRight
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2]).forEachRight(function(n) {
 *   console.log(n);
 * }).value();
 * // => logs each value from right to left and returns the array
 */
var forEachRight = createForEach(arrayEachRight, baseEachRight);

module.exports = forEachRight;

},{"105":105,"119":119,"152":152}],97:[function(_dereq_,module,exports){
var arrayMap = _dereq_(108),
    baseCallback = _dereq_(114),
    baseMap = _dereq_(135),
    isArray = _dereq_(175);

/**
 * Creates an array of values by running each element in `collection` through
 * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
 * arguments: (value, index|key, collection).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
 * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
 * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
 * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
 * `sum`, `uniq`, and `words`
 *
 * @static
 * @memberOf _
 * @alias collect
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function timesThree(n) {
 *   return n * 3;
 * }
 *
 * _.map([1, 2], timesThree);
 * // => [3, 6]
 *
 * _.map({ 'a': 1, 'b': 2 }, timesThree);
 * // => [3, 6] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // using the `_.property` callback shorthand
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee, thisArg) {
  var func = isArray(collection) ? arrayMap : baseMap;
  iteratee = baseCallback(iteratee, thisArg, 3);
  return func(collection, iteratee);
}

module.exports = map;

},{"108":108,"114":114,"135":135,"175":175}],98:[function(_dereq_,module,exports){
var arrayReduce = _dereq_(110),
    baseEach = _dereq_(118),
    createReduce = _dereq_(153);

/**
 * Reduces `collection` to a value which is the accumulated result of running
 * each element in `collection` through `iteratee`, where each successive
 * invocation is supplied the return value of the previous. If `accumulator`
 * is not provided the first element of `collection` is used as the initial
 * value. The `iteratee` is bound to `thisArg` and invoked with four arguments:
 * (accumulator, value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.reduce`, `_.reduceRight`, and `_.transform`.
 *
 * The guarded methods are:
 * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `sortByAll`,
 * and `sortByOrder`
 *
 * @static
 * @memberOf _
 * @alias foldl, inject
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {*} Returns the accumulated value.
 * @example
 *
 * _.reduce([1, 2], function(total, n) {
 *   return total + n;
 * });
 * // => 3
 *
 * _.reduce({ 'a': 1, 'b': 2 }, function(result, n, key) {
 *   result[key] = n * 3;
 *   return result;
 * }, {});
 * // => { 'a': 3, 'b': 6 } (iteration order is not guaranteed)
 */
var reduce = createReduce(arrayReduce, baseEach);

module.exports = reduce;

},{"110":110,"118":118,"153":153}],99:[function(_dereq_,module,exports){
var getNative = _dereq_(159);

/* Native method references for those with the same name as other `lodash` methods. */
var nativeNow = getNative(Date, 'now');

/**
 * Gets the number of milliseconds that have elapsed since the Unix epoch
 * (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @category Date
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => logs the number of milliseconds it took for the deferred function to be invoked
 */
var now = nativeNow || function() {
  return new Date().getTime();
};

module.exports = now;

},{"159":159}],100:[function(_dereq_,module,exports){
var isObject = _dereq_(179),
    now = _dereq_(99);

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed invocations. Provide an options object to indicate that `func`
 * should be invoked on the leading and/or trailing edge of the `wait` timeout.
 * Subsequent calls to the debounced function return the result of the last
 * `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
 * on the trailing edge of the timeout only if the the debounced function is
 * invoked more than once during the `wait` timeout.
 *
 * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=false] Specify invoking on the leading
 *  edge of the timeout.
 * @param {number} [options.maxWait] The maximum time `func` is allowed to be
 *  delayed before it's invoked.
 * @param {boolean} [options.trailing=true] Specify invoking on the trailing
 *  edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // avoid costly calculations while the window size is in flux
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
 * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // ensure `batchLog` is invoked once after 1 second of debounced calls
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', _.debounce(batchLog, 250, {
 *   'maxWait': 1000
 * }));
 *
 * // cancel a debounced call
 * var todoChanges = _.debounce(batchLog, 1000);
 * Object.observe(models.todo, todoChanges);
 *
 * Object.observe(models, function(changes) {
 *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
 *     todoChanges.cancel();
 *   }
 * }, ['delete']);
 *
 * // ...at some point `models.todo` is changed
 * models.todo.completed = true;
 *
 * // ...before 1 second has passed `models.todo` is deleted
 * // which cancels the debounced `todoChanges` call
 * delete models.todo;
 */
function debounce(func, wait, options) {
  var args,
      maxTimeoutId,
      result,
      stamp,
      thisArg,
      timeoutId,
      trailingCall,
      lastCalled = 0,
      maxWait = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = wait < 0 ? 0 : (+wait || 0);
  if (options === true) {
    var leading = true;
    trailing = false;
  } else if (isObject(options)) {
    leading = !!options.leading;
    maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function cancel() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
    }
    lastCalled = 0;
    maxTimeoutId = timeoutId = trailingCall = undefined;
  }

  function complete(isCalled, id) {
    if (id) {
      clearTimeout(id);
    }
    maxTimeoutId = timeoutId = trailingCall = undefined;
    if (isCalled) {
      lastCalled = now();
      result = func.apply(thisArg, args);
      if (!timeoutId && !maxTimeoutId) {
        args = thisArg = undefined;
      }
    }
  }

  function delayed() {
    var remaining = wait - (now() - stamp);
    if (remaining <= 0 || remaining > wait) {
      complete(trailingCall, maxTimeoutId);
    } else {
      timeoutId = setTimeout(delayed, remaining);
    }
  }

  function maxDelayed() {
    complete(trailing, timeoutId);
  }

  function debounced() {
    args = arguments;
    stamp = now();
    thisArg = this;
    trailingCall = trailing && (timeoutId || !leading);

    if (maxWait === false) {
      var leadingCall = leading && !timeoutId;
    } else {
      if (!maxTimeoutId && !leading) {
        lastCalled = stamp;
      }
      var remaining = maxWait - (stamp - lastCalled),
          isCalled = remaining <= 0 || remaining > maxWait;

      if (isCalled) {
        if (maxTimeoutId) {
          maxTimeoutId = clearTimeout(maxTimeoutId);
        }
        lastCalled = stamp;
        result = func.apply(thisArg, args);
      }
      else if (!maxTimeoutId) {
        maxTimeoutId = setTimeout(maxDelayed, remaining);
      }
    }
    if (isCalled && timeoutId) {
      timeoutId = clearTimeout(timeoutId);
    }
    else if (!timeoutId && wait !== maxWait) {
      timeoutId = setTimeout(delayed, wait);
    }
    if (leadingCall) {
      isCalled = true;
      result = func.apply(thisArg, args);
    }
    if (isCalled && !timeoutId && !maxTimeoutId) {
      args = thisArg = undefined;
    }
    return result;
  }
  debounced.cancel = cancel;
  return debounced;
}

module.exports = debounce;

},{"179":179,"99":99}],101:[function(_dereq_,module,exports){
var baseDelay = _dereq_(116),
    restParam = _dereq_(102);

/**
 * Defers invoking the `func` until the current call stack has cleared. Any
 * additional arguments are provided to `func` when it's invoked.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to defer.
 * @param {...*} [args] The arguments to invoke the function with.
 * @returns {number} Returns the timer id.
 * @example
 *
 * _.defer(function(text) {
 *   console.log(text);
 * }, 'deferred');
 * // logs 'deferred' after one or more milliseconds
 */
var defer = restParam(function(func, args) {
  return baseDelay(func, 1, args);
});

module.exports = defer;

},{"102":102,"116":116}],102:[function(_dereq_,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/Web/JavaScript/Reference/Functions/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.restParam(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function restParam(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        rest = Array(length);

    while (++index < length) {
      rest[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, args[0], rest);
      case 2: return func.call(this, args[0], args[1], rest);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = rest;
    return func.apply(this, otherArgs);
  };
}

module.exports = restParam;

},{}],103:[function(_dereq_,module,exports){
(function (global){
var cachePush = _dereq_(146),
    getNative = _dereq_(159);

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 *
 * Creates a cache object to store unique values.
 *
 * @private
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var length = values ? values.length : 0;

  this.data = { 'hash': nativeCreate(null), 'set': new Set };
  while (length--) {
    this.push(values[length]);
  }
}

// Add functions to the `Set` cache.
SetCache.prototype.push = cachePush;

module.exports = SetCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvU2V0Q2FjaGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGNhY2hlUHVzaCA9IHJlcXVpcmUoJy4vY2FjaGVQdXNoJyksXG4gICAgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi9nZXROYXRpdmUnKTtcblxuLyoqIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBTZXQgPSBnZXROYXRpdmUoZ2xvYmFsLCAnU2V0Jyk7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlQ3JlYXRlID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2NyZWF0ZScpO1xuXG4vKipcbiAqXG4gKiBDcmVhdGVzIGEgY2FjaGUgb2JqZWN0IHRvIHN0b3JlIHVuaXF1ZSB2YWx1ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IFt2YWx1ZXNdIFRoZSB2YWx1ZXMgdG8gY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIFNldENhY2hlKHZhbHVlcykge1xuICB2YXIgbGVuZ3RoID0gdmFsdWVzID8gdmFsdWVzLmxlbmd0aCA6IDA7XG5cbiAgdGhpcy5kYXRhID0geyAnaGFzaCc6IG5hdGl2ZUNyZWF0ZShudWxsKSwgJ3NldCc6IG5ldyBTZXQgfTtcbiAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgdGhpcy5wdXNoKHZhbHVlc1tsZW5ndGhdKTtcbiAgfVxufVxuXG4vLyBBZGQgZnVuY3Rpb25zIHRvIHRoZSBgU2V0YCBjYWNoZS5cblNldENhY2hlLnByb3RvdHlwZS5wdXNoID0gY2FjaGVQdXNoO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldENhY2hlO1xuIl19
},{"146":146,"159":159}],104:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],105:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.forEachRight` for arrays without support for
 * callback shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEachRight(array, iteratee) {
  var length = array.length;

  while (length--) {
    if (iteratee(array[length], length, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEachRight;

},{}],106:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.every` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`.
 */
function arrayEvery(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (!predicate(array[index], index, array)) {
      return false;
    }
  }
  return true;
}

module.exports = arrayEvery;

},{}],107:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.filter` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[++resIndex] = value;
    }
  }
  return result;
}

module.exports = arrayFilter;

},{}],108:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],109:[function(_dereq_,module,exports){
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

module.exports = arrayPush;

},{}],110:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.reduce` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initFromArray] Specify using the first element of `array`
 *  as the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initFromArray) {
  var index = -1,
      length = array.length;

  if (initFromArray && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

module.exports = arrayReduce;

},{}],111:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],112:[function(_dereq_,module,exports){
var keys = _dereq_(183);

/**
 * A specialized version of `_.assign` for customizing assigned values without
 * support for argument juggling, multiple sources, and `this` binding `customizer`
 * functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns `object`.
 */
function assignWith(object, source, customizer) {
  var index = -1,
      props = keys(source),
      length = props.length;

  while (++index < length) {
    var key = props[index],
        value = object[key],
        result = customizer(value, source[key], key, object, source);

    if ((result === result ? (result !== value) : (value === value)) ||
        (value === undefined && !(key in object))) {
      object[key] = result;
    }
  }
  return object;
}

module.exports = assignWith;

},{"183":183}],113:[function(_dereq_,module,exports){
var baseCopy = _dereq_(115),
    keys = _dereq_(183);

/**
 * The base implementation of `_.assign` without support for argument juggling,
 * multiple sources, and `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return source == null
    ? object
    : baseCopy(source, keys(source), object);
}

module.exports = baseAssign;

},{"115":115,"183":183}],114:[function(_dereq_,module,exports){
var baseMatches = _dereq_(136),
    baseMatchesProperty = _dereq_(137),
    bindCallback = _dereq_(144),
    identity = _dereq_(188),
    property = _dereq_(189);

/**
 * The base implementation of `_.callback` which supports specifying the
 * number of arguments to provide to `func`.
 *
 * @private
 * @param {*} [func=_.identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function baseCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (type == 'function') {
    return thisArg === undefined
      ? func
      : bindCallback(func, thisArg, argCount);
  }
  if (func == null) {
    return identity;
  }
  if (type == 'object') {
    return baseMatches(func);
  }
  return thisArg === undefined
    ? property(func)
    : baseMatchesProperty(func, thisArg);
}

module.exports = baseCallback;

},{"136":136,"137":137,"144":144,"188":188,"189":189}],115:[function(_dereq_,module,exports){
/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property names to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @returns {Object} Returns `object`.
 */
function baseCopy(source, props, object) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];
    object[key] = source[key];
  }
  return object;
}

module.exports = baseCopy;

},{}],116:[function(_dereq_,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * The base implementation of `_.delay` and `_.defer` which accepts an index
 * of where to slice the arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to delay.
 * @param {number} wait The number of milliseconds to delay invocation.
 * @param {Object} args The arguments provide to `func`.
 * @returns {number} Returns the timer id.
 */
function baseDelay(func, wait, args) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  return setTimeout(function() { func.apply(undefined, args); }, wait);
}

module.exports = baseDelay;

},{}],117:[function(_dereq_,module,exports){
var baseIndexOf = _dereq_(131),
    cacheIndexOf = _dereq_(145),
    createCache = _dereq_(150);

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.difference` which accepts a single array
 * of values to exclude.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values) {
  var length = array ? array.length : 0,
      result = [];

  if (!length) {
    return result;
  }
  var index = -1,
      indexOf = baseIndexOf,
      isCommon = true,
      cache = (isCommon && values.length >= LARGE_ARRAY_SIZE) ? createCache(values) : null,
      valuesLength = values.length;

  if (cache) {
    indexOf = cacheIndexOf;
    isCommon = false;
    values = cache;
  }
  outer:
  while (++index < length) {
    var value = array[index];

    if (isCommon && value === value) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === value) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (indexOf(values, value, 0) < 0) {
      result.push(value);
    }
  }
  return result;
}

module.exports = baseDifference;

},{"131":131,"145":145,"150":150}],118:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(127),
    createBaseEach = _dereq_(148);

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"127":127,"148":148}],119:[function(_dereq_,module,exports){
var baseForOwnRight = _dereq_(128),
    createBaseEach = _dereq_(148);

/**
 * The base implementation of `_.forEachRight` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEachRight = createBaseEach(baseForOwnRight, true);

module.exports = baseEachRight;

},{"128":128,"148":148}],120:[function(_dereq_,module,exports){
var baseEach = _dereq_(118);

/**
 * The base implementation of `_.every` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`
 */
function baseEvery(collection, predicate) {
  var result = true;
  baseEach(collection, function(value, index, collection) {
    result = !!predicate(value, index, collection);
    return result;
  });
  return result;
}

module.exports = baseEvery;

},{"118":118}],121:[function(_dereq_,module,exports){
var baseEach = _dereq_(118);

/**
 * The base implementation of `_.filter` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function baseFilter(collection, predicate) {
  var result = [];
  baseEach(collection, function(value, index, collection) {
    if (predicate(value, index, collection)) {
      result.push(value);
    }
  });
  return result;
}

module.exports = baseFilter;

},{"118":118}],122:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
 * without support for callback shorthands and `this` binding, which iterates
 * over `collection` using the provided `eachFunc`.
 *
 * @private
 * @param {Array|Object|string} collection The collection to search.
 * @param {Function} predicate The function invoked per iteration.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @param {boolean} [retKey] Specify returning the key of the found element
 *  instead of the element itself.
 * @returns {*} Returns the found element or its key, else `undefined`.
 */
function baseFind(collection, predicate, eachFunc, retKey) {
  var result;
  eachFunc(collection, function(value, key, collection) {
    if (predicate(value, key, collection)) {
      result = retKey ? key : value;
      return false;
    }
  });
  return result;
}

module.exports = baseFind;

},{}],123:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for callback shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {Function} predicate The function invoked per iteration.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromRight) {
  var length = array.length,
      index = fromRight ? length : -1;

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

module.exports = baseFindIndex;

},{}],124:[function(_dereq_,module,exports){
var arrayPush = _dereq_(109),
    isArguments = _dereq_(174),
    isArray = _dereq_(175),
    isArrayLike = _dereq_(161),
    isObjectLike = _dereq_(166);

/**
 * The base implementation of `_.flatten` with added support for restricting
 * flattening and specifying the start index.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {boolean} [isDeep] Specify a deep flatten.
 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, isDeep, isStrict, result) {
  result || (result = []);

  var index = -1,
      length = array.length;

  while (++index < length) {
    var value = array[index];
    if (isObjectLike(value) && isArrayLike(value) &&
        (isStrict || isArray(value) || isArguments(value))) {
      if (isDeep) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, isDeep, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

module.exports = baseFlatten;

},{"109":109,"161":161,"166":166,"174":174,"175":175}],125:[function(_dereq_,module,exports){
var createBaseFor = _dereq_(149);

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"149":149}],126:[function(_dereq_,module,exports){
var baseFor = _dereq_(125),
    keysIn = _dereq_(184);

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

module.exports = baseForIn;

},{"125":125,"184":184}],127:[function(_dereq_,module,exports){
var baseFor = _dereq_(125),
    keys = _dereq_(183);

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"125":125,"183":183}],128:[function(_dereq_,module,exports){
var baseForRight = _dereq_(129),
    keys = _dereq_(183);

/**
 * The base implementation of `_.forOwnRight` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwnRight(object, iteratee) {
  return baseForRight(object, iteratee, keys);
}

module.exports = baseForOwnRight;

},{"129":129,"183":183}],129:[function(_dereq_,module,exports){
var createBaseFor = _dereq_(149);

/**
 * This function is like `baseFor` except that it iterates over properties
 * in the opposite order.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseForRight = createBaseFor(true);

module.exports = baseForRight;

},{"149":149}],130:[function(_dereq_,module,exports){
var toObject = _dereq_(172);

/**
 * The base implementation of `get` without support for string paths
 * and default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path of the property to get.
 * @param {string} [pathKey] The key representation of path.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path, pathKey) {
  if (object == null) {
    return;
  }
  if (pathKey !== undefined && pathKey in toObject(object)) {
    path = [pathKey];
  }
  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[path[index++]];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"172":172}],131:[function(_dereq_,module,exports){
var indexOfNaN = _dereq_(160);

/**
 * The base implementation of `_.indexOf` without support for binary searches.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return indexOfNaN(array, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = baseIndexOf;

},{"160":160}],132:[function(_dereq_,module,exports){
var baseIsEqualDeep = _dereq_(133),
    isObject = _dereq_(179),
    isObjectLike = _dereq_(166);

/**
 * The base implementation of `_.isEqual` without support for `this` binding
 * `customizer` functions.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
}

module.exports = baseIsEqual;

},{"133":133,"166":166,"179":179}],133:[function(_dereq_,module,exports){
var equalArrays = _dereq_(154),
    equalByTag = _dereq_(155),
    equalObjects = _dereq_(156),
    isArray = _dereq_(175),
    isTypedArray = _dereq_(181);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

module.exports = baseIsEqualDeep;

},{"154":154,"155":155,"156":156,"175":175,"181":181}],134:[function(_dereq_,module,exports){
var baseIsEqual = _dereq_(132),
    toObject = _dereq_(172);

/**
 * The base implementation of `_.isMatch` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} matchData The propery names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = toObject(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var result = customizer ? customizer(objValue, srcValue, key) : undefined;
      if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"132":132,"172":172}],135:[function(_dereq_,module,exports){
var baseEach = _dereq_(118),
    isArrayLike = _dereq_(161);

/**
 * The base implementation of `_.map` without support for callback shorthands
 * and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

module.exports = baseMap;

},{"118":118,"161":161}],136:[function(_dereq_,module,exports){
var baseIsMatch = _dereq_(134),
    getMatchData = _dereq_(158),
    toObject = _dereq_(172);

/**
 * The base implementation of `_.matches` which does not clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    var key = matchData[0][0],
        value = matchData[0][1];

    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === value && (value !== undefined || (key in toObject(object)));
    };
  }
  return function(object) {
    return baseIsMatch(object, matchData);
  };
}

module.exports = baseMatches;

},{"134":134,"158":158,"172":172}],137:[function(_dereq_,module,exports){
var baseGet = _dereq_(130),
    baseIsEqual = _dereq_(132),
    baseSlice = _dereq_(141),
    isArray = _dereq_(175),
    isKey = _dereq_(164),
    isStrictComparable = _dereq_(167),
    last = _dereq_(88),
    toObject = _dereq_(172),
    toPath = _dereq_(173);

/**
 * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to compare.
 * @returns {Function} Returns the new function.
 */
function baseMatchesProperty(path, srcValue) {
  var isArr = isArray(path),
      isCommon = isKey(path) && isStrictComparable(srcValue),
      pathKey = (path + '');

  path = toPath(path);
  return function(object) {
    if (object == null) {
      return false;
    }
    var key = pathKey;
    object = toObject(object);
    if ((isArr || !isCommon) && !(key in object)) {
      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
      if (object == null) {
        return false;
      }
      key = last(path);
      object = toObject(object);
    }
    return object[key] === srcValue
      ? (srcValue !== undefined || (key in object))
      : baseIsEqual(srcValue, object[key], undefined, true);
  };
}

module.exports = baseMatchesProperty;

},{"130":130,"132":132,"141":141,"164":164,"167":167,"172":172,"173":173,"175":175,"88":88}],138:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],139:[function(_dereq_,module,exports){
var baseGet = _dereq_(130),
    toPath = _dereq_(173);

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 */
function basePropertyDeep(path) {
  var pathKey = (path + '');
  path = toPath(path);
  return function(object) {
    return baseGet(object, path, pathKey);
  };
}

module.exports = basePropertyDeep;

},{"130":130,"173":173}],140:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.reduce` and `_.reduceRight` without support
 * for callback shorthands and `this` binding, which iterates over `collection`
 * using the provided `eachFunc`.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} accumulator The initial value.
 * @param {boolean} initFromCollection Specify using the first or last element
 *  of `collection` as the initial value.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @returns {*} Returns the accumulated value.
 */
function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
  eachFunc(collection, function(value, index, collection) {
    accumulator = initFromCollection
      ? (initFromCollection = false, value)
      : iteratee(accumulator, value, index, collection);
  });
  return accumulator;
}

module.exports = baseReduce;

},{}],141:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  start = start == null ? 0 : (+start || 0);
  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = (end === undefined || end > length) ? length : (+end || 0);
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],142:[function(_dereq_,module,exports){
/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  return value == null ? '' : (value + '');
}

module.exports = baseToString;

},{}],143:[function(_dereq_,module,exports){
var baseIndexOf = _dereq_(131),
    cacheIndexOf = _dereq_(145),
    createCache = _dereq_(150);

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.uniq` without support for callback shorthands
 * and `this` binding.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The function invoked per iteration.
 * @returns {Array} Returns the new duplicate free array.
 */
function baseUniq(array, iteratee) {
  var index = -1,
      indexOf = baseIndexOf,
      length = array.length,
      isCommon = true,
      isLarge = isCommon && length >= LARGE_ARRAY_SIZE,
      seen = isLarge ? createCache() : null,
      result = [];

  if (seen) {
    indexOf = cacheIndexOf;
    isCommon = false;
  } else {
    isLarge = false;
    seen = iteratee ? [] : result;
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value, index, array) : value;

    if (isCommon && value === value) {
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed);
      }
      result.push(value);
    }
    else if (indexOf(seen, computed, 0) < 0) {
      if (iteratee || isLarge) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

module.exports = baseUniq;

},{"131":131,"145":145,"150":150}],144:[function(_dereq_,module,exports){
var identity = _dereq_(188);

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"188":188}],145:[function(_dereq_,module,exports){
var isObject = _dereq_(179);

/**
 * Checks if `value` is in `cache` mimicking the return signature of
 * `_.indexOf` by returning `0` if the value is found, else `-1`.
 *
 * @private
 * @param {Object} cache The cache to search.
 * @param {*} value The value to search for.
 * @returns {number} Returns `0` if `value` is found, else `-1`.
 */
function cacheIndexOf(cache, value) {
  var data = cache.data,
      result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

  return result ? 0 : -1;
}

module.exports = cacheIndexOf;

},{"179":179}],146:[function(_dereq_,module,exports){
var isObject = _dereq_(179);

/**
 * Adds `value` to the cache.
 *
 * @private
 * @name push
 * @memberOf SetCache
 * @param {*} value The value to cache.
 */
function cachePush(value) {
  var data = this.data;
  if (typeof value == 'string' || isObject(value)) {
    data.set.add(value);
  } else {
    data.hash[value] = true;
  }
}

module.exports = cachePush;

},{"179":179}],147:[function(_dereq_,module,exports){
var bindCallback = _dereq_(144),
    isIterateeCall = _dereq_(163),
    restParam = _dereq_(102);

/**
 * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return restParam(function(object, sources) {
    var index = -1,
        length = object == null ? 0 : sources.length,
        customizer = length > 2 ? sources[length - 2] : undefined,
        guard = length > 2 ? sources[2] : undefined,
        thisArg = length > 1 ? sources[length - 1] : undefined;

    if (typeof customizer == 'function') {
      customizer = bindCallback(customizer, thisArg, 5);
      length -= 2;
    } else {
      customizer = typeof thisArg == 'function' ? thisArg : undefined;
      length -= (customizer ? 1 : 0);
    }
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"102":102,"144":144,"163":163}],148:[function(_dereq_,module,exports){
var getLength = _dereq_(157),
    isLength = _dereq_(165),
    toObject = _dereq_(172);

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      return eachFunc(collection, iteratee);
    }
    var index = fromRight ? length : -1,
        iterable = toObject(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"157":157,"165":165,"172":172}],149:[function(_dereq_,module,exports){
var toObject = _dereq_(172);

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{"172":172}],150:[function(_dereq_,module,exports){
(function (global){
var SetCache = _dereq_(103),
    getNative = _dereq_(159);

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 * Creates a `Set` cache object to optimize linear searches of large arrays.
 *
 * @private
 * @param {Array} [values] The values to cache.
 * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
 */
function createCache(values) {
  return (nativeCreate && Set) ? new SetCache(values) : null;
}

module.exports = createCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY3JlYXRlQ2FjaGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgU2V0Q2FjaGUgPSByZXF1aXJlKCcuL1NldENhY2hlJyksXG4gICAgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi9nZXROYXRpdmUnKTtcblxuLyoqIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBTZXQgPSBnZXROYXRpdmUoZ2xvYmFsLCAnU2V0Jyk7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlQ3JlYXRlID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2NyZWF0ZScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBgU2V0YCBjYWNoZSBvYmplY3QgdG8gb3B0aW1pemUgbGluZWFyIHNlYXJjaGVzIG9mIGxhcmdlIGFycmF5cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gW3ZhbHVlc10gVGhlIHZhbHVlcyB0byBjYWNoZS5cbiAqIEByZXR1cm5zIHtudWxsfE9iamVjdH0gUmV0dXJucyB0aGUgbmV3IGNhY2hlIG9iamVjdCBpZiBgU2V0YCBpcyBzdXBwb3J0ZWQsIGVsc2UgYG51bGxgLlxuICovXG5mdW5jdGlvbiBjcmVhdGVDYWNoZSh2YWx1ZXMpIHtcbiAgcmV0dXJuIChuYXRpdmVDcmVhdGUgJiYgU2V0KSA/IG5ldyBTZXRDYWNoZSh2YWx1ZXMpIDogbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVDYWNoZTtcbiJdfQ==
},{"103":103,"159":159}],151:[function(_dereq_,module,exports){
var baseCallback = _dereq_(114),
    baseFind = _dereq_(122),
    baseFindIndex = _dereq_(123),
    isArray = _dereq_(175);

/**
 * Creates a `_.find` or `_.findLast` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new find function.
 */
function createFind(eachFunc, fromRight) {
  return function(collection, predicate, thisArg) {
    predicate = baseCallback(predicate, thisArg, 3);
    if (isArray(collection)) {
      var index = baseFindIndex(collection, predicate, fromRight);
      return index > -1 ? collection[index] : undefined;
    }
    return baseFind(collection, predicate, eachFunc);
  };
}

module.exports = createFind;

},{"114":114,"122":122,"123":123,"175":175}],152:[function(_dereq_,module,exports){
var bindCallback = _dereq_(144),
    isArray = _dereq_(175);

/**
 * Creates a function for `_.forEach` or `_.forEachRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createForEach(arrayFunc, eachFunc) {
  return function(collection, iteratee, thisArg) {
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee)
      : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
  };
}

module.exports = createForEach;

},{"144":144,"175":175}],153:[function(_dereq_,module,exports){
var baseCallback = _dereq_(114),
    baseReduce = _dereq_(140),
    isArray = _dereq_(175);

/**
 * Creates a function for `_.reduce` or `_.reduceRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createReduce(arrayFunc, eachFunc) {
  return function(collection, iteratee, accumulator, thisArg) {
    var initFromArray = arguments.length < 3;
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee, accumulator, initFromArray)
      : baseReduce(collection, baseCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
  };
}

module.exports = createReduce;

},{"114":114,"140":140,"175":175}],154:[function(_dereq_,module,exports){
var arraySome = _dereq_(111);

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing arrays.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

module.exports = equalArrays;

},{"111":111}],155:[function(_dereq_,module,exports){
/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object)
        ? other != +other
        : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings primitives and string
      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
      return object == (other + '');
  }
  return false;
}

module.exports = equalByTag;

},{}],156:[function(_dereq_,module,exports){
var keys = _dereq_(183);

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isLoose) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

    // Recursively compare objects (susceptible to call stack limits).
    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

module.exports = equalObjects;

},{"183":183}],157:[function(_dereq_,module,exports){
var baseProperty = _dereq_(138);

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"138":138}],158:[function(_dereq_,module,exports){
var isStrictComparable = _dereq_(167),
    pairs = _dereq_(186);

/**
 * Gets the propery names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = pairs(object),
      length = result.length;

  while (length--) {
    result[length][2] = isStrictComparable(result[length][1]);
  }
  return result;
}

module.exports = getMatchData;

},{"167":167,"186":186}],159:[function(_dereq_,module,exports){
var isNative = _dereq_(177);

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"177":177}],160:[function(_dereq_,module,exports){
/**
 * Gets the index at which the first occurrence of `NaN` is found in `array`.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched `NaN`, else `-1`.
 */
function indexOfNaN(array, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 0 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    var other = array[index];
    if (other !== other) {
      return index;
    }
  }
  return -1;
}

module.exports = indexOfNaN;

},{}],161:[function(_dereq_,module,exports){
var getLength = _dereq_(157),
    isLength = _dereq_(165);

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

module.exports = isArrayLike;

},{"157":157,"165":165}],162:[function(_dereq_,module,exports){
/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],163:[function(_dereq_,module,exports){
var isArrayLike = _dereq_(161),
    isIndex = _dereq_(162),
    isObject = _dereq_(179);

/**
 * Checks if the provided arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
      ? (isArrayLike(object) && isIndex(index, object.length))
      : (type == 'string' && index in object)) {
    var other = object[index];
    return value === value ? (value === other) : (other !== other);
  }
  return false;
}

module.exports = isIterateeCall;

},{"161":161,"162":162,"179":179}],164:[function(_dereq_,module,exports){
var isArray = _dereq_(175),
    toObject = _dereq_(172);

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  var type = typeof value;
  if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
    return true;
  }
  if (isArray(value)) {
    return false;
  }
  var result = !reIsDeepProp.test(value);
  return result || (object != null && value in toObject(object));
}

module.exports = isKey;

},{"172":172,"175":175}],165:[function(_dereq_,module,exports){
/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],166:[function(_dereq_,module,exports){
/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],167:[function(_dereq_,module,exports){
var isObject = _dereq_(179);

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"179":179}],168:[function(_dereq_,module,exports){
var toObject = _dereq_(172);

/**
 * A specialized version of `_.pick` which picks `object` properties specified
 * by `props`.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} props The property names to pick.
 * @returns {Object} Returns the new object.
 */
function pickByArray(object, props) {
  object = toObject(object);

  var index = -1,
      length = props.length,
      result = {};

  while (++index < length) {
    var key = props[index];
    if (key in object) {
      result[key] = object[key];
    }
  }
  return result;
}

module.exports = pickByArray;

},{"172":172}],169:[function(_dereq_,module,exports){
var baseForIn = _dereq_(126);

/**
 * A specialized version of `_.pick` which picks `object` properties `predicate`
 * returns truthy for.
 *
 * @private
 * @param {Object} object The source object.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Object} Returns the new object.
 */
function pickByCallback(object, predicate) {
  var result = {};
  baseForIn(object, function(value, key, object) {
    if (predicate(value, key, object)) {
      result[key] = value;
    }
  });
  return result;
}

module.exports = pickByCallback;

},{"126":126}],170:[function(_dereq_,module,exports){
var isArguments = _dereq_(174),
    isArray = _dereq_(175),
    isIndex = _dereq_(162),
    isLength = _dereq_(165),
    keysIn = _dereq_(184);

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"162":162,"165":165,"174":174,"175":175,"184":184}],171:[function(_dereq_,module,exports){
/**
 * An implementation of `_.uniq` optimized for sorted arrays without support
 * for callback shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The function invoked per iteration.
 * @returns {Array} Returns the new duplicate free array.
 */
function sortedUniq(array, iteratee) {
  var seen,
      index = -1,
      length = array.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value, index, array) : value;

    if (!index || seen !== computed) {
      seen = computed;
      result[++resIndex] = value;
    }
  }
  return result;
}

module.exports = sortedUniq;

},{}],172:[function(_dereq_,module,exports){
var isObject = _dereq_(179);

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"179":179}],173:[function(_dereq_,module,exports){
var baseToString = _dereq_(142),
    isArray = _dereq_(175);

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `value` to property path array if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Array} Returns the property path array.
 */
function toPath(value) {
  if (isArray(value)) {
    return value;
  }
  var result = [];
  baseToString(value).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
}

module.exports = toPath;

},{"142":142,"175":175}],174:[function(_dereq_,module,exports){
var isArrayLike = _dereq_(161),
    isObjectLike = _dereq_(166);

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{"161":161,"166":166}],175:[function(_dereq_,module,exports){
var getNative = _dereq_(159),
    isLength = _dereq_(165),
    isObjectLike = _dereq_(166);

/** `Object#toString` result references. */
var arrayTag = '[object Array]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

module.exports = isArray;

},{"159":159,"165":165,"166":166}],176:[function(_dereq_,module,exports){
var isObject = _dereq_(179);

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 which returns 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

module.exports = isFunction;

},{"179":179}],177:[function(_dereq_,module,exports){
var isFunction = _dereq_(176),
    isObjectLike = _dereq_(166);

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isNative;

},{"166":166,"176":176}],178:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(166);

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
 * as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isNumber(8.4);
 * // => true
 *
 * _.isNumber(NaN);
 * // => true
 *
 * _.isNumber('8.4');
 * // => false
 */
function isNumber(value) {
  return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
}

module.exports = isNumber;

},{"166":166}],179:[function(_dereq_,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],180:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(166);

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
}

module.exports = isString;

},{"166":166}],181:[function(_dereq_,module,exports){
var isLength = _dereq_(165),
    isObjectLike = _dereq_(166);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

module.exports = isTypedArray;

},{"165":165,"166":166}],182:[function(_dereq_,module,exports){
var assignWith = _dereq_(112),
    baseAssign = _dereq_(113),
    createAssigner = _dereq_(147);

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object. Subsequent sources overwrite property assignments of previous sources.
 * If `customizer` is provided it's invoked to produce the assigned values.
 * The `customizer` is bound to `thisArg` and invoked with five arguments:
 * (objectValue, sourceValue, key, object, source).
 *
 * **Note:** This method mutates `object` and is based on
 * [`Object.assign`](http://ecma-international.org/ecma-262/6.0/#sec-object.assign).
 *
 * @static
 * @memberOf _
 * @alias extend
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
 * // => { 'user': 'fred', 'age': 40 }
 *
 * // using a customizer callback
 * var defaults = _.partialRight(_.assign, function(value, other) {
 *   return _.isUndefined(value) ? other : value;
 * });
 *
 * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
 * // => { 'user': 'barney', 'age': 36 }
 */
var assign = createAssigner(function(object, source, customizer) {
  return customizer
    ? assignWith(object, source, customizer)
    : baseAssign(object, source);
});

module.exports = assign;

},{"112":112,"113":113,"147":147}],183:[function(_dereq_,module,exports){
var getNative = _dereq_(159),
    isArrayLike = _dereq_(161),
    isObject = _dereq_(179),
    shimKeys = _dereq_(170);

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"159":159,"161":161,"170":170,"179":179}],184:[function(_dereq_,module,exports){
var isArguments = _dereq_(174),
    isArray = _dereq_(175),
    isIndex = _dereq_(162),
    isLength = _dereq_(165),
    isObject = _dereq_(179);

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"162":162,"165":165,"174":174,"175":175,"179":179}],185:[function(_dereq_,module,exports){
var arrayMap = _dereq_(108),
    baseDifference = _dereq_(117),
    baseFlatten = _dereq_(124),
    bindCallback = _dereq_(144),
    keysIn = _dereq_(184),
    pickByArray = _dereq_(168),
    pickByCallback = _dereq_(169),
    restParam = _dereq_(102);

/**
 * The opposite of `_.pick`; this method creates an object composed of the
 * own and inherited enumerable properties of `object` that are not omitted.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {Function|...(string|string[])} [predicate] The function invoked per
 *  iteration or property names to omit, specified as individual property
 *  names or arrays of property names.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'user': 'fred', 'age': 40 };
 *
 * _.omit(object, 'age');
 * // => { 'user': 'fred' }
 *
 * _.omit(object, _.isNumber);
 * // => { 'user': 'fred' }
 */
var omit = restParam(function(object, props) {
  if (object == null) {
    return {};
  }
  if (typeof props[0] != 'function') {
    var props = arrayMap(baseFlatten(props), String);
    return pickByArray(object, baseDifference(keysIn(object), props));
  }
  var predicate = bindCallback(props[0], props[1], 3);
  return pickByCallback(object, function(value, key, object) {
    return !predicate(value, key, object);
  });
});

module.exports = omit;

},{"102":102,"108":108,"117":117,"124":124,"144":144,"168":168,"169":169,"184":184}],186:[function(_dereq_,module,exports){
var keys = _dereq_(183),
    toObject = _dereq_(172);

/**
 * Creates a two dimensional array of the key-value pairs for `object`,
 * e.g. `[[key1, value1], [key2, value2]]`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the new array of key-value pairs.
 * @example
 *
 * _.pairs({ 'barney': 36, 'fred': 40 });
 * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
 */
function pairs(object) {
  object = toObject(object);

  var index = -1,
      props = keys(object),
      length = props.length,
      result = Array(length);

  while (++index < length) {
    var key = props[index];
    result[index] = [key, object[key]];
  }
  return result;
}

module.exports = pairs;

},{"172":172,"183":183}],187:[function(_dereq_,module,exports){
var baseFlatten = _dereq_(124),
    bindCallback = _dereq_(144),
    pickByArray = _dereq_(168),
    pickByCallback = _dereq_(169),
    restParam = _dereq_(102);

/**
 * Creates an object composed of the picked `object` properties. Property
 * names may be specified as individual arguments or as arrays of property
 * names. If `predicate` is provided it's invoked for each property of `object`
 * picking the properties `predicate` returns truthy for. The predicate is
 * bound to `thisArg` and invoked with three arguments: (value, key, object).
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {Function|...(string|string[])} [predicate] The function invoked per
 *  iteration or property names to pick, specified as individual property
 *  names or arrays of property names.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'user': 'fred', 'age': 40 };
 *
 * _.pick(object, 'user');
 * // => { 'user': 'fred' }
 *
 * _.pick(object, _.isString);
 * // => { 'user': 'fred' }
 */
var pick = restParam(function(object, props) {
  if (object == null) {
    return {};
  }
  return typeof props[0] == 'function'
    ? pickByCallback(object, bindCallback(props[0], props[1], 3))
    : pickByArray(object, baseFlatten(props));
});

module.exports = pick;

},{"102":102,"124":124,"144":144,"168":168,"169":169}],188:[function(_dereq_,module,exports){
/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],189:[function(_dereq_,module,exports){
var baseProperty = _dereq_(138),
    basePropertyDeep = _dereq_(139),
    isKey = _dereq_(164);

/**
 * Creates a function that returns the property value at `path` on a
 * given object.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': { 'c': 2 } } },
 *   { 'a': { 'b': { 'c': 1 } } }
 * ];
 *
 * _.map(objects, _.property('a.b.c'));
 * // => [2, 1]
 *
 * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
}

module.exports = property;

},{"138":138,"139":139,"164":164}],190:[function(_dereq_,module,exports){
/**
 * Set attribute `name` to `val`, or get attr `name`.
 *
 * @param {Element} el
 * @param {String} name
 * @param {String} [val]
 * @api public
 */

module.exports = function(el, name, val) {
  // get
  if (arguments.length == 2) {
    return el.getAttribute(name);
  }

  // remove
  if (val === null) {
    return el.removeAttribute(name);
  }

  // set
  el.setAttribute(name, val);

  return el;
};
},{}],191:[function(_dereq_,module,exports){
module.exports = _dereq_(198);
},{"198":198}],192:[function(_dereq_,module,exports){
module.exports = _dereq_(201);
},{"201":201}],193:[function(_dereq_,module,exports){
module.exports = _dereq_(205);
},{"205":205}],194:[function(_dereq_,module,exports){
module.exports = _dereq_(202);
},{"202":202}],195:[function(_dereq_,module,exports){
module.exports = _dereq_(203);
},{"203":203}],196:[function(_dereq_,module,exports){
module.exports = _dereq_(204);
},{"204":204}],197:[function(_dereq_,module,exports){
module.exports = function(el) {
  el.parentNode && el.parentNode.removeChild(el);
};
},{}],198:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

try {
  var index = _dereq_(199);
} catch (err) {
  var index = _dereq_(199);
}

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el || !el.nodeType) {
    throw new Error('A DOM element reference is required');
  }
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var className = this.el.getAttribute('class') || '';
  var str = className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

},{"199":199}],199:[function(_dereq_,module,exports){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],200:[function(_dereq_,module,exports){
var matches = _dereq_(203)

module.exports = function (element, selector, checkYoSelf, root) {
  element = checkYoSelf ? {parentNode: element} : element

  root = root || document

  // Make sure `element !== document` and `element != null`
  // otherwise we get an illegal invocation
  while ((element = element.parentNode) && element !== document) {
    if (matches(element, selector))
      return element
    // After `matches` on the edge case that
    // the selector matches the root
    // (when the root is not the document)
    if (element === root)
      return
  }
}

},{"203":203}],201:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

try {
  var closest = _dereq_(200);
} catch(err) {
  var closest = _dereq_(200);
}

try {
  var event = _dereq_(202);
} catch(err) {
  var event = _dereq_(202);
}

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    var target = e.target || e.srcElement;
    e.delegateTarget = closest(target, selector, true, el);
    if (e.delegateTarget) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

},{"200":200,"202":202}],202:[function(_dereq_,module,exports){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
},{}],203:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

try {
  var query = _dereq_(204);
} catch (err) {
  var query = _dereq_(204);
}

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matches
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (!el || el.nodeType !== 1) return false;
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

},{"204":204}],204:[function(_dereq_,module,exports){
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

},{}],205:[function(_dereq_,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var innerHTMLBug = false;
var bugTestDiv;
if (typeof document !== 'undefined') {
  bugTestDiv = document.createElement('div');
  // Setup
  bugTestDiv.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
  // Make sure that link elements get serialized correctly by innerHTML
  // This requires a wrapper element in IE
  innerHTMLBug = !bugTestDiv.getElementsByTagName('link').length;
  bugTestDiv = undefined;
}

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  // for script/link/style tags to work in IE6-8, you have to wrap
  // in a div with a non-whitespace character in front, ha!
  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.polyline =
map.ellipse =
map.polygon =
map.circle =
map.text =
map.line =
map.path =
map.rect =
map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return a DOM Node instance, which could be a TextNode,
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
 * instance, depending on the contents of the `html` string.
 *
 * @param {String} html - HTML string to "domify"
 * @param {Document} doc - The `document` instance to create the Node for
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
 * @api private
 */

function parse(html, doc) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // default to the global `document` object
  if (!doc) doc = document;

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return doc.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = doc.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = doc.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = doc.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

},{}],206:[function(_dereq_,module,exports){
'use strict';

/**
 * Calculate the selection update for the given
 * current and new input values.
 *
 * @param {Object} currentSelection as {start, end}
 * @param {String} currentValue
 * @param {String} newValue
 *
 * @return {Object} newSelection as {start, end}
 */
function calculateUpdate(currentSelection, currentValue, newValue) {

  var currentCursor = currentSelection.start,
      newCursor = currentCursor,
      diff = newValue.length - currentValue.length,
      idx;

  var lengthDelta = newValue.length - currentValue.length;

  var currentTail = currentValue.substring(currentCursor);

  // check if we can remove common ending from the equation
  // to be able to properly detect a selection change for
  // the following scenarios:
  //
  //  * (AAATTT|TF) => (AAAT|TF)
  //  * (AAAT|TF) =>  (AAATTT|TF)
  //
  if (newValue.lastIndexOf(currentTail) === newValue.length - currentTail.length) {
    currentValue = currentValue.substring(0, currentValue.length - currentTail.length);
    newValue = newValue.substring(0, newValue.length - currentTail.length);
  }

  // diff
  var diff = createDiff(currentValue, newValue);

  if (diff) {
    if (diff.type === 'remove') {
      newCursor = diff.newStart;
    } else {
      newCursor = diff.newEnd;
    }
  }

  return range(newCursor);
}

module.exports = calculateUpdate;


function createDiff(currentValue, newValue) {

  var insert;

  var l_str, l_char, l_idx = 0,
      s_str, s_char, s_idx = 0;

  if (newValue.length > currentValue.length) {
    l_str = newValue;
    s_str = currentValue;
  } else {
    l_str = currentValue;
    s_str = newValue;
  }

  // assume there will be only one insert / remove and
  // detect that _first_ edit operation only
  while (l_idx < l_str.length) {

    l_char = l_str.charAt(l_idx);
    s_char = s_str.charAt(s_idx);

    // chars no not equal
    if (l_char !== s_char) {

      if (!insert) {
        insert = {
          l_start: l_idx,
          s_start: s_idx
        };
      }

      l_idx++;
    }

    // chars equal (again?)
    else {

      if (insert && !insert.complete) {
        insert.l_end = l_idx;
        insert.s_end = s_idx;
        insert.complete = true;
      }

      s_idx++;
      l_idx++;
    }
  }

  if (insert && !insert.complete) {
    insert.complete = true;
    insert.s_end = s_str.length;
    insert.l_end = l_str.length;
  }

  // no diff
  if (!insert) {
    return;
  }

  if (newValue.length > currentValue.length) {
    return {
      newStart: insert.l_start,
      newEnd: insert.l_end,
      type: 'add'
    };
  } else {
    return {
      newStart: insert.s_start,
      newEnd: insert.s_end,
      type: newValue.length < currentValue.length ? 'remove' : 'replace'
    };
  }
}

/**
 * Utility method for creating a new selection range {start, end} object.
 *
 * @param {Number} start
 * @param {Number} [end]
 *
 * @return {Object} selection range as {start, end}
 */
function range(start, end) {
  return {
    start: start,
    end: end === undefined ? start : end
  };
}

module.exports.range = range;


function splitStr(str, position) {
  return {
    before: str.substring(0, position),
    after: str.substring(position)
  };
}
},{}],207:[function(_dereq_,module,exports){
module.exports = _dereq_(208);

},{"208":208}],208:[function(_dereq_,module,exports){
'use strict';

var di = _dereq_(63);


/**
 * Bootstrap an injector from a list of modules, instantiating a number of default components
 *
 * @ignore
 * @param {Array<didi.Module>} bootstrapModules
 *
 * @return {didi.Injector} a injector to use to access the components
 */
function bootstrap(bootstrapModules) {

  var modules = [],
      components = [];

  function hasModule(m) {
    return modules.indexOf(m) >= 0;
  }

  function addModule(m) {
    modules.push(m);
  }

  function visit(m) {
    if (hasModule(m)) {
      return;
    }

    (m.__depends__ || []).forEach(visit);

    if (hasModule(m)) {
      return;
    }

    addModule(m);
    (m.__init__ || []).forEach(function(c) {
      components.push(c);
    });
  }

  bootstrapModules.forEach(visit);

  var injector = new di.Injector(modules);

  components.forEach(function(c) {

    try {
      // eagerly resolve component (fn or string)
      injector[typeof c === 'string' ? 'get' : 'invoke'](c);
    } catch (e) {
      console.error('Failed to instantiate component');
      console.error(e.stack);

      throw e;
    }
  });

  return injector;
}

/**
 * Creates an injector from passed options.
 *
 * @ignore
 * @param  {Object} options
 * @return {didi.Injector}
 */
function createInjector(options) {

  options = options || {};

  var configModule = {
    'config': ['value', options]
  };

  var coreModule = _dereq_(213);

  var modules = [ configModule, coreModule ].concat(options.modules || []);

  return bootstrap(modules);
}


/**
 * The main table-js entry point that bootstraps the table with the given
 * configuration.
 *
 * To register extensions with the table, pass them as Array<didi.Module> to the constructor.
 *
 * @class tjs.Table
 * @memberOf tjs
 * @constructor
 *
 * @param {Object} options
 * @param {Array<didi.Module>} [options.modules] external modules to instantiate with the table
 * @param {didi.Injector} [injector] an (optional) injector to bootstrap the table with
 */
function Table(options, injector) {

  // create injector unless explicitly specified
  this.injector = injector = injector || createInjector(options);

  // API

  /**
   * Resolves a table service
   *
   * @method Table#get
   *
   * @param {String} name the name of the table service to be retrieved
   * @param {Object} [locals] a number of locals to use to resolve certain dependencies
   */
  this.get = injector.get;

  /**
   * Executes a function into which table services are injected
   *
   * @method Table#invoke
   *
   * @param {Function|Object[]} fn the function to resolve
   * @param {Object} locals a number of locals to use to resolve certain dependencies
   */
  this.invoke = injector.invoke;

  // init

  // indicate via event


  /**
   * An event indicating that all plug-ins are loaded.
   *
   * Use this event to fire other events to interested plug-ins
   *
   * @memberOf Table
   *
   * @event table.init
   *
   * @example
   *
   * eventBus.on('table.init', function() {
   *   eventBus.fire('my-custom-event', { foo: 'BAR' });
   * });
   *
   * @type {Object}
   */
  this.get('eventBus').fire('table.init');
}

module.exports = Table;


/**
 * Destroys the table
 *
 * @method  Table#destroy
 */
Table.prototype.destroy = function() {
  this.get('eventBus').fire('table.destroy');
};

},{"213":213,"63":63}],209:[function(_dereq_,module,exports){
'use strict';

var Model = _dereq_(259);


/**
 * A factory for diagram-js shapes
 */
function ElementFactory() {
  this._uid = 12;
}

module.exports = ElementFactory;


ElementFactory.prototype.createTable = function(attrs) {
  return document.createElement('table');
  //return this.create('table', attrs);
};

ElementFactory.prototype.createRow = function(attrs) {
  return this.create('row', attrs);
};

ElementFactory.prototype.createColumn = function(attrs) {
  return this.create('column', attrs);
};

/**
 * Create a model element with the given type and
 * a number of pre-set attributes.
 *
 * @param  {String} type
 * @param  {Object} attrs
 * @return {djs.model.Base} the newly created model instance
 */
ElementFactory.prototype.create = function(type, attrs) {

  attrs = attrs || {};

  if (!attrs.id) {
    attrs.id = type + '_' + (this._uid++);
  }

  return Model.create(type, attrs);
};

},{"259":259}],210:[function(_dereq_,module,exports){
'use strict';

var ELEMENT_ID = 'data-element-id';


/**
 * @class
 *
 * A registry that keeps track of all shapes in the diagram.
 */
function ElementRegistry() {
  this._elements = {};
}

module.exports = ElementRegistry;

/**
 * Register a pair of (element, gfx, (secondaryGfx)).
 *
 * @param {djs.model.Base} element
 * @param {Snap<SVGElement>} gfx
 * @param {Snap<SVGElement>} [secondaryGfx] optional other element to register, too
 */
ElementRegistry.prototype.add = function(element, gfx, secondaryGfx) {

  var id = element.id;

  this._validateId(id);

  // associate dom node with element
  gfx.setAttribute(ELEMENT_ID, id);

  if (secondaryGfx) {
    secondaryGfx.setAttribute(ELEMENT_ID, id);
  }

  this._elements[id] = { element: element, gfx: gfx, secondaryGfx: secondaryGfx };
};

/**
 * Removes an element from the registry.
 *
 * @param {djs.model.Base} element
 */
ElementRegistry.prototype.remove = function(element) {
  var elements = this._elements,
      id = element.id || element,
      container = id && elements[id];

  if (container) {

    // unset element id on gfx
    container.gfx.setAttribute(ELEMENT_ID, null);

    if (container.secondaryGfx) {
      container.secondaryGfx.setAttribute(ELEMENT_ID, null);
    }

    delete elements[id];
  }
};

/**
 * Update the id of an element
 *
 * @param {djs.model.Base} element
 * @param {String} newId
 */
ElementRegistry.prototype.updateId = function(element, newId) {

  this._validateId(newId);

  if (typeof element === 'string') {
    element = this.get(element);
  }

  var gfx = this.getGraphics(element),
      secondaryGfx = this.getGraphics(element, true);

  this.remove(element);

  element.id = newId;

  this.add(element, gfx, secondaryGfx);
};

/**
 * Return the model element for a given id or graphics.
 *
 * @example
 *
 * elementRegistry.get('SomeElementId_1');
 * elementRegistry.get(gfx);
 *
 *
 * @param {String|SVGElement} filter for selecting the element
 *
 * @return {djs.model.Base}
 */
ElementRegistry.prototype.get = function(filter) {
  var id;

  if (typeof filter === 'string') {
    id = filter;
  } else {
    // get by graphics
    id = filter && filter.getAttribute(ELEMENT_ID);
  }

  var container = this._elements[id];
  return container && container.element;
};

/**
 * Return all elements that match a given filter function.
 *
 * @param {Function} fn
 *
 * @return {Array<djs.model.Base>}
 */
ElementRegistry.prototype.filter = function(fn) {

  var filtered = [];

  this.forEach(function(element, gfx) {
    if (fn(element, gfx)) {
      filtered.push(element);
    }
  });

  return filtered;
};

/**
 * Iterate over all diagram elements.
 *
 * @param {Function} fn
 */
ElementRegistry.prototype.forEach = function(fn) {

  var map = this._elements;

  Object.keys(map).forEach(function(id) {
    var container = map[id],
        element = container.element,
        gfx = container.gfx;

    return fn(element, gfx);
  });
};

/**
 * Return the graphical representation of an element or its id.
 *
 * @example
 * elementRegistry.getGraphics('SomeElementId_1');
 * elementRegistry.getGraphics(rootElement); // <g ...>
 *
 * elementRegistry.getGraphics(rootElement, true); // <svg ...>
 *
 *
 * @param {String|djs.model.Base} filter
 * @param {Boolean} [secondary=false] whether to return the secondary connected element
 *
 * @return {SVGElement}
 */
ElementRegistry.prototype.getGraphics = function(filter, secondary) {
  var id = filter.id || filter;

  var container = this._elements[id];
  return container && (secondary ? container.secondaryGfx : container.gfx);
};

/**
 * Validate the suitability of the given id and signals a problem
 * with an exception.
 *
 * @param {String} id
 *
 * @throws {Error} if id is empty or already assigned
 */
ElementRegistry.prototype._validateId = function(id) {
  if (!id) {
    throw new Error('element must have an id');
  }

  if (this._elements[id]) {
    throw new Error('element with id ' + id + ' already added');
  }
};

},{}],211:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95);

/**
 * A factory that creates graphical elements
 *
 * @param {Renderer} renderer
 */
function GraphicsFactory(elementRegistry, renderer) {
  this._renderer = renderer;
  this._elementRegistry = elementRegistry;
}

GraphicsFactory.$inject = [ 'elementRegistry', 'renderer' ];

module.exports = GraphicsFactory;

GraphicsFactory.prototype.create = function(type, element, parent) {
  var newElement;
  switch(type) {
    case 'row':
      newElement = document.createElement('tr');
      break;
    case 'cell':
      // cells consist of a td element with a nested span which contains the content
      newElement = document.createElement(element.row.useTH ? 'th' : 'td');
      var contentContainer = document.createElement('span');
      newElement.appendChild(contentContainer);
      break;
  }
  if (newElement && type === 'row') {
    if (element.next) {
      parent.insertBefore(newElement, this._elementRegistry.getGraphics(element.next));
    } else {
      parent.appendChild(newElement);
    }
  } else if (type === 'cell') {
    var neighboringCell = this._elementRegistry.filter(function(el) {
      return el.row === element.row && el.column === element.column.next;
    })[0];
    if (neighboringCell) {
      parent.insertBefore(newElement, this._elementRegistry.getGraphics(neighboringCell));
    } else {
      parent.appendChild(newElement);
    }
  }
  return newElement || document.createElement('div');
};

GraphicsFactory.prototype.moveRow = function(source, target, above) {
  var gfxSource = this._elementRegistry.getGraphics(source);
  var gfxTarget;

  if(above) {
    gfxTarget = this._elementRegistry.getGraphics(target);
    gfxTarget.parentNode.insertBefore(gfxSource, gfxTarget);
  } else {
    if(source.next) {
      gfxTarget = this._elementRegistry.getGraphics(source.next);
      gfxTarget.parentNode.insertBefore(gfxSource, gfxTarget);
    } else {
      gfxSource.parentNode.appendChild(gfxSource);
    }
  }
};

GraphicsFactory.prototype.moveColumn = function(source, target, left) {
  var self = this;

  // find all cells which belong to the source and add them at their new place
  this._elementRegistry.forEach(function(element, gfx) {
    if(element._type === 'cell' && element.column === source) {

      // find the cell exactly right of them
      self._elementRegistry.forEach(function(targetElement, targetGfx) {
        if(targetElement._type === 'cell' && targetElement.row === element.row) {
          if(left && targetElement.column === target) {
            targetGfx.parentNode.insertBefore(gfx, targetGfx);
          } else if(!left && targetElement.column === source.next) {
            targetGfx.parentNode.insertBefore(gfx, targetGfx);
          }
        }
      });
    }
  });
};


GraphicsFactory.prototype.update = function(type, element, gfx) {

  // Do not update root element
  if (!element.parent) {
    return;
  }

  var self = this;
  // redraw
  if (type === 'row') {
    this._renderer.drawRow(gfx, element);

    // also redraw all cells in this row
    forEach(this._elementRegistry.filter(function(el) {
      return el.row === element;
    }), function(cell) {
      self.update('cell', cell, self._elementRegistry.getGraphics(cell));
    });
  } else
  if (type === 'column') {
    this._renderer.drawColumn(gfx, element);

    // also redraw all cells in this column
    forEach(this._elementRegistry.filter(function(el) {
      return el.column === element;
    }), function(cell) {
      self.update('cell', cell, self._elementRegistry.getGraphics(cell));
    });
  } else
  if (type === 'cell') {
    this._renderer.drawCell(gfx, element);
  } else {
    throw new Error('unknown type: ' + type);
  }
};

GraphicsFactory.prototype.remove = function(element) {
  var gfx = this._elementRegistry.getGraphics(element);

  // remove
  gfx.parentNode && gfx.parentNode.removeChild(gfx);
};

},{"95":95}],212:[function(_dereq_,module,exports){
'use strict';

var isNumber = _dereq_(178),
    assign = _dereq_(182),
    forEach = _dereq_(95),
    every = _dereq_(92);

function ensurePx(number) {
  return isNumber(number) ? number + 'px' : number;
}

/**
 * Creates a HTML container element for a table element with
 * the given configuration
 *
 * @param  {Object} options
 * @return {HTMLElement} the container element
 */
function createContainer(options) {

  options = assign({}, { width: '100%', height: '100%' }, options);

  var container = options.container || document.body;

  // create a <div> around the table element with the respective size
  // this way we can always get the correct container size
  var parent = document.createElement('div');
  parent.setAttribute('class', 'tjs-container');

  container.appendChild(parent);

  return parent;
}

var REQUIRED_MODEL_ATTRS = {
  row: [ 'next', 'previous' ],
  column: [ 'next', 'previous' ],
  cell: [ 'row', 'column' ]
};

/**
 * The main drawing sheet.
 *
 * @class
 * @constructor
 *
 * @emits Sheet#sheet.init
 *
 * @param {Object} config
 * @param {EventBus} eventBus
 * @param {GraphicsFactory} graphicsFactory
 * @param {ElementRegistry} elementRegistry
 */
function Sheet(config, eventBus, elementRegistry, graphicsFactory) {
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;

  this._init(config || {});
}

Sheet.$inject = [ 'config.sheet', 'eventBus', 'elementRegistry', 'graphicsFactory' ];

module.exports = Sheet;


Sheet.prototype.getLastColumn = function() {
  return this._lastColumn;
};

Sheet.prototype.setLastColumn = function(element) {
  this._lastColumn = element;
};

Sheet.prototype.getLastRow = function(type) {
  return this._lastRow[type];
};

Sheet.prototype.setLastRow = function(element, type) {
  this._lastRow[type] = element;
};

Sheet.prototype.setSibling = function(first, second) {
  if (first) first.next = second;
  if (second) second.previous = first;
};

Sheet.prototype.addSiblings = function(type, element) {
  var tmp, subType;
  if (type === 'row') {
    subType = element.isHead ? 'head' : element.isFoot ? 'foot' : 'body';
  }
  if (!element.previous && !element.next) {
    if (type === 'column') {
      // add column to end of table per default
      element.next = null;
      this.setSibling(this.getLastColumn(), element);
      this.setLastColumn(element);
    } else if (type === 'row') {
      // add row to end of table per default
      element.next = null;
      this.setSibling(this.getLastRow(subType), element);
      this.setLastRow(element, subType);
    }
  } else if (element.previous && !element.next) {
    tmp = element.previous.next;
    this.setSibling(element.previous, element);
    this.setSibling(element, tmp);
    if(!tmp) {
      if(type === 'row') {
        this.setLastRow(element, subType);
      } else if (type === 'column') {
        this.setLastColumn(element, subType);
      }
    }
  } else if (!element.previous && element.next) {
    tmp = element.next.previous;
    this.setSibling(tmp, element);
    this.setSibling(element, element.next);
  } else if (element.previous && element.next) {
    if (element.previous.next !== element.next) {
      throw new Error('cannot set both previous and next when adding new element <' + type + '>');
    } else {
      this.setSibling(element.previous, element);
      this.setSibling(element, element.next);
    }
  }
};

Sheet.prototype.removeSiblings = function(type, element) {
  var subType;
  if (type === 'row') {
    subType = element.isHead ? 'head' : element.isFoot ? 'foot' : 'body';
  }
  if (type === 'column') {
    if (this.getLastColumn() === element) {
      this.setLastColumn(element.previous);
    }
  } else
  if (type === 'row') {
    if (this.getLastRow(subType) === element) {
      this.setLastRow(element.previous, subType);
    }
  }
  if (element.previous) {
    element.previous.next = element.next;
  }
  if (element.next) {
    element.next.previous = element.previous;
  }
  delete element.previous;
  delete element.next;
};

Sheet.prototype._init = function(config) {

  // Creates a <table> element that is wrapped into a <div>.
  // This way we are always able to correctly figure out the size of the table element
  // by querying the parent node.
  //
  // <div class="tjs-container" style="width: {desired-width}, height: {desired-height}">
  //   <table width="100%" height="100%">
  //    ...
  //   </table>
  // </div>

  // html container
  var eventBus = this._eventBus,
      container = createContainer(config),
      self = this;

  this._container = container;

  this._rootNode = document.createElement('table');

  assign(this._rootNode.style, {
    width: ensurePx(config.width),
    height: ensurePx(config.height)
  });

  container.appendChild(this._rootNode);

  this._head = document.createElement('thead');
  this._body = document.createElement('tbody');
  this._foot = document.createElement('tfoot');

  this._rootNode.appendChild(this._head);
  this._rootNode.appendChild(this._body);
  this._rootNode.appendChild(this._foot);

  this._lastColumn = null;
  this._lastRow = {
    head: null,
    body: null,
    foot: null
  };

  eventBus.on('table.init', function(event) {

    /**
     * An event indicating that the table is ready to be used.
     *
     * @memberOf Sheet
     *
     * @event sheet.init
     *
     * @type {Object}
     * @property {DOMElement} sheet the created table element
     * @property {Snap<SVGGroup>} viewport the direct parent of diagram elements and shapes
     */

    eventBus.fire('sheet.init', {sheet: self._rootNode});
  });

  eventBus.on('table.destroy', function() {

    var parent = self._container.parentNode;

    if (parent) {
      parent.removeChild(container);
    }

    eventBus.fire('sheet.destroy', { sheet: self._rootNode });
  });

};


/**
 * Returns the html element that encloses the
 * drawing canvas.
 *
 * @return {DOMNode}
 */
Sheet.prototype.getContainer = function() {
  return this._container;
};


/**
 * Returns the table body element of the table.
 *
 * @return {DOMNode}
 */
Sheet.prototype.getBody = function() {
  return this._body;
};

/**
 * Moves a row above or below another row
 *
 */
Sheet.prototype.moveRow = function(source, target, above) {

  if(source === target) {
    return;
  }

  this._eventBus.fire('row.move', {
    source: source,
    target: target,
    above: above
  });

  // update the last row if necessary
  if(this.getLastRow('body') === source) {
    this.setLastRow(source.previous, 'body');
  }

  // re-wire the prev/next relations for the source
  if(source.previous) {
    source.previous.next = source.next;
  }
  if(source.next) {
    source.next.previous = source.previous;
  }
  // re-wire the prev/next relations for the target
  if(above) {
    if(target.previous) {
      // (previous --> source --> target)
      target.previous.next = source;
      source.previous = target.previous;

      source.next = target;
      target.previous = source;
    } else {
      // (null --> source --> target)
      source.previous = null;

      source.next = target;
      target.previous = source;
    }
  } else {
    if(target.next) {
      // (target --> source --> next)
      target.next.previous = source;
      source.next = target.next;

      source.previous = target;
      target.next = source;
    } else {
      // (target --> source --> null)
      source.next = null;

      source.previous = target;
      target.next = source;
      this.setLastRow(source, 'body');
    }
  }

  this._graphicsFactory.moveRow(source, target, above);

  this._eventBus.fire('row.moved', {
    source: source,
    target: target,
    above: above
  });

};

/**
 * Moves a column left or right another column
 *
 */
Sheet.prototype.moveColumn = function(source, target, left) {

  if(source === target) {
    return;
  }

  this._eventBus.fire('column.move', {
    source: source,
    target: target,
    left: left
  });

  // update the last row if necessary
  if(this.getLastColumn() === source) {
    this.setLastColumn(source.previous);
  }

  // re-wire the prev/next relations for the source
  if(source.previous) {
    source.previous.next = source.next;
  }
  if(source.next) {
    source.next.previous = source.previous;
  }
  // re-wire the prev/next relations for the target
  if(left) {
    if(target.previous) {
      // (previous --> source --> target)
      target.previous.next = source;
      source.previous = target.previous;

      source.next = target;
      target.previous = source;
    } else {
      // (null --> source --> target)
      source.previous = null;

      source.next = target;
      target.previous = source;
    }
  } else {
    if(target.next) {
      // (target --> source --> next)
      target.next.previous = source;
      source.next = target.next;

      source.previous = target;
      target.next = source;
    } else {
      // (target --> source --> null)
      source.next = null;

      source.previous = target;
      target.next = source;
      this.setLastColumn(source);
    }
  }

  this._graphicsFactory.moveColumn(source, target, left);

  this._eventBus.fire('column.moved', {
    source: source,
    target: target,
    left: left
  });

};


///////////// add functionality ///////////////////////////////

Sheet.prototype._ensureValid = function(type, element) {
  if (!element.id) {
    throw new Error('element must have an id');
  }

  if (this._elementRegistry.get(element.id)) {
    throw new Error('element with id ' + element.id + ' already exists');
  }

  var requiredAttrs = REQUIRED_MODEL_ATTRS[type];

  var valid = every(requiredAttrs, function(attr) {
    return typeof element[attr] !== 'undefined';
  });

  if (!valid) {
    throw new Error(
      'must supply { ' + requiredAttrs.join(', ') + ' } with ' + type);
  }
};

/**
 * Adds an element to the sheet.
 *
 * This wires the parent <-> child relationship between the element and
 * a explicitly specified parent or an implicit root element.
 *
 * During add it emits the events
 *
 *  * <{type}.add> (element, parent)
 *  * <{type}.added> (element, gfx)
 *
 * Extensions may hook into these events to perform their magic.
 *
 * @param {String} type
 * @param {Object|djs.model.Base} element
 * @param {Object|djs.model.Base} [parent]
 *
 * @return {Object|djs.model.Base} the added element
 */
Sheet.prototype._addElement = function(type, element, parent) {

  element._type = type;

  var eventBus = this._eventBus,
      graphicsFactory = this._graphicsFactory;

  this._ensureValid(type, element);

  eventBus.fire(type + '.add', element);

  // create graphics

  element.parent = parent || this._rootNode;

  var gfx = graphicsFactory.create(type, element, element.parent);

  this._elementRegistry.add(element, gfx);

  // update its visual
  graphicsFactory.update(type, element, gfx);

  eventBus.fire(type + '.added', { element: element, gfx: gfx });

  return element;
};

Sheet.prototype.addRow = function(row) {
  this.addSiblings('row', row);

  var r = this._addElement('row', row, row.isHead ? this._head : row.isFoot ? this._foot : this._body);

  this._eventBus.fire('cells.add', r);

  // create new cells
  var self = this;
  forEach(this._elementRegistry.filter(function(el) {
    return el._type === 'column';
  }).sort(function(a, b) {
    var c = a;
    while (!!(c = c.next)) {
      if (c === b) {
        return -1;
      }
    }
    return 1;
  }), function(el) {
    self._addCell({row: r, column: el, id: 'cell_'+el.id+'_'+r.id});
  });

  this._eventBus.fire('cells.added', r);

  return r;
};

Sheet.prototype.addColumn = function(column) {

  this.addSiblings('column', column);

  var c = this._addElement('column', column);

  this._eventBus.fire('cells.add', c);

  // create new cells
  var self = this;
  forEach(this._elementRegistry.filter(function(el) {
    return el._type === 'row';
  }), function(el) {
    self._addCell({row: el, column: c, id: 'cell_'+c.id+'_'+el.id});
  });

  this._eventBus.fire('cells.added', c);

  return c;
};

Sheet.prototype._addCell = function(cell) {
  return this._addElement('cell', cell, this._elementRegistry.getGraphics(cell.row.id));
};

Sheet.prototype.setCellContent = function(config) {
  if (typeof config.column === 'object') {
    config.column = config.column.id;
  }
  if (typeof config.row === 'object') {
    config.row = config.row.id;
  }

  this._elementRegistry.get('cell_'+config.column+'_'+config.row).content = config.content;
  this._graphicsFactory.update('cell', this._elementRegistry.get('cell_'+config.column+'_'+config.row),
    this._elementRegistry.getGraphics('cell_'+config.column+'_'+config.row));
};

Sheet.prototype.getCellContent = function(config) {
  return this._elementRegistry.get('cell_'+config.column+'_'+config.row).content;
};


/**
 * Internal remove element
 */
Sheet.prototype._removeElement = function(element, type) {

  var elementRegistry = this._elementRegistry,
      graphicsFactory = this._graphicsFactory,
      eventBus = this._eventBus;

  element = elementRegistry.get(element.id || element);

  if (!element) {
    // element was removed already
    return;
  }

  eventBus.fire(type + '.remove', { element: element });

  graphicsFactory.remove(element);

  element.parent = null;

  elementRegistry.remove(element);

  eventBus.fire(type + '.removed', { element: element });

  return element;
};

Sheet.prototype.removeRow = function(element) {

  this.removeSiblings('row', element);

  var el = this._removeElement(element, 'row');

  // remove cells
  this._eventBus.fire('cells.remove', el);

  var self = this;
  forEach(this._elementRegistry.filter(function(el) {
    return el.row === element;
  }), function(el) {
    self._removeElement(el.id, 'cell');
  });

  this._eventBus.fire('cells.removed', el);

  return el;
};

Sheet.prototype.removeColumn = function(element) {

  this.removeSiblings('column', element);

  var el = this._removeElement(element, 'column');

  // remove cells
  this._eventBus.fire('cells.remove', el);

  var self = this;
  forEach(this._elementRegistry.filter(function(el) {
    return el.column === element;
  }), function(el) {
    self._removeElement(el.id, 'cell');
  });

  this._eventBus.fire('cells.removed', el);

  return el;
};

Sheet.prototype.getRootElement = function() {
  return this._rootNode;
};

Sheet.prototype.setRootElement = function(root) {
  this._rootNode = root;
};

},{"178":178,"182":182,"92":92,"95":95}],213:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [ _dereq_(215) ],
  __init__: [ 'sheet' ],
  sheet: [ 'type', _dereq_(212) ],
  elementRegistry: [ 'type', _dereq_(210) ],
  elementFactory: ['type', _dereq_(209)],
  graphicsFactory: [ 'type', _dereq_(211) ],
  eventBus: [ 'type', _dereq_(54) ]
};

},{"209":209,"210":210,"211":211,"212":212,"215":215,"54":54}],214:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95),
    colDistance = function colDistance(from, to) {
      var i = 0,
          current = from.column;
      while (current && current !== to.column) {
        current = current.next;
        i++;
      }
      return !current ? -1 : i;
    },
    rowDistance = function rowDistance(from, to) {
      var i = 0,
          current = from.row;
      while (current && current !== to.row) {
        current = current.next;
        i++;
      }
      return !current ? -1 : i;
    };

/**
 * The default renderer used for rows, columns and cells.
 *
 */
function Renderer(elementRegistry, eventBus) {
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
}

Renderer.$inject = [ 'elementRegistry', 'eventBus' ];

module.exports = Renderer;

Renderer.prototype.drawRow = function drawRow(gfx, data) {
  this._eventBus.fire('row.render', {
    gfx: gfx,
    data: data
  });
  return gfx;
};

Renderer.prototype.drawColumn = function drawColumn(gfx, data) {
  this._eventBus.fire('column.render', {
    gfx: gfx,
    data: data
  });
  return gfx;
};

Renderer.prototype.drawCell = function drawCell(gfx, data) {
  if (data.colspan) {
    gfx.setAttribute('colspan', data.colspan);
  }
  if (data.rowspan) {
    gfx.setAttribute('rowspan', data.rowspan);
  }

  gfx.setAttribute('style', '');

  // traverse backwards to find colspanned elements which might overlap us
  var cells = this._elementRegistry.filter(function(element) {
    return element._type === 'cell' && element.row === data.row;
  });

  forEach(cells, function(cell) {
    var d = colDistance(cell, data);
    if (cell.colspan && d > 0 && d < cell.colspan) {
      gfx.setAttribute('style', 'display: none;');
    }
  });

  // traverse backwards to find rowspanned elements which might overlap us
  cells = this._elementRegistry.filter(function(element) {
    return element._type === 'cell' && element.column === data.column;
  });

  forEach(cells, function(cell) {
    var d = rowDistance(cell, data);
    if (cell.rowspan && d > 0 && d < cell.rowspan) {
      gfx.setAttribute('style', 'display: none;');
    }
  });

  if (data.content) {
    if (typeof data.content === 'string' && !data.content.tagName) {
      gfx.childNodes[0].textContent = data.content;
    } else if (!!data.content.tagName) {
      gfx.childNodes[0].appendChild(data.content);
    }
  } else {
    gfx.childNodes[0].textContent = '';
  }

  this._eventBus.fire('cell.render', {
    gfx: gfx,
    data: data
  });

  return gfx;
};


},{"95":95}],215:[function(_dereq_,module,exports){
module.exports = {
  renderer: [ 'type', _dereq_(214) ]
};

},{"214":214}],216:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(193);

// document wide unique overlay ids
var ids = new (_dereq_(59))('row');

/**
 * Adds a control to the table to add more rows
 *
 * @param {EventBus} eventBus
 */
function AddRow(eventBus, sheet, elementRegistry, modeling) {

  this.row = null;

  var self = this;
  // add the row control row
  eventBus.on('utilityColumn.added', function(event) {
    var column = event.column;
    self.row = sheet.addRow({
      id: 'tjs-controls',
      isFoot: true
    });

    var node = domify('<a title="Add row" class="table-js-add-row"><span>+</span></a>');

    node.addEventListener('mouseup', function() {
      modeling.createRow({ id: ids.next() });
    });

    sheet.setCellContent({
      row: self.row,
      column: column,
      content: node
    });

  });
}

AddRow.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'modeling' ];

module.exports = AddRow;

AddRow.prototype.getRow = function() {
  return this.row;
};

},{"193":193,"59":59}],217:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);

function AddRowRenderer(
    eventBus,
    addRow) {

  eventBus.on('cell.render', function(event) {
    if (event.data.row === addRow.getRow() && event.data.content) {
      domClasses(event.gfx).add('add-rule');
      event.gfx.childNodes[0].appendChild(event.data.content);
    }
  });

  eventBus.on('row.render', function(event) {
    if (event.data === addRow.getRow()) {
      domClasses(event.gfx).add('rules-controls');
    }
  });

}

AddRowRenderer.$inject = [
  'eventBus',
  'addRow'
];

module.exports = AddRowRenderer;

},{"191":191}],218:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'addRow', 'addRowRenderer'],
  __depends__: [
    _dereq_(248),
    _dereq_(258)
  ],
  addRow: [ 'type', _dereq_(216) ],
  addRowRenderer: [ 'type', _dereq_(217) ]
};

},{"216":216,"217":217,"248":248,"258":258}],219:[function(_dereq_,module,exports){
'use strict';

/**
 * Adds change support to the sheet, including
 *
 * <ul>
 *   <li>redrawing rows and cells on change</li>
 * </ul>
 *
 * @param {EventBus} eventBus
 * @param {ElementRegistry} elementRegistry
 * @param {GraphicsFactory} graphicsFactory
 */
function ChangeSupport(eventBus, elementRegistry, graphicsFactory) {

  // redraw row / cells on change

  eventBus.on('element.changed', function(event) {

    var element = event.element;

    if (!event.gfx) {
      event.gfx = elementRegistry.getGraphics(element);
    }

    // shape + gfx may have been deleted
    if (!event.gfx) {
      return;
    }

    if (element.column) {
      eventBus.fire('cell.changed', event);
    } else {
      eventBus.fire('row.changed', event);
    }
  });

  eventBus.on('elements.changed', function(event) {
    for(var i = 0; i < event.elements.length; i++) {
      eventBus.fire('element.changed', { element: event.elements[i] });
    }
  });

  eventBus.on('cell.changed', function(event) {
    graphicsFactory.update('cell', event.element, event.gfx);
  });

  eventBus.on('row.changed', function(event) {
    graphicsFactory.update('row', event.element, event.gfx);

    // also update all cells of the row
    var cells = elementRegistry.filter(function(ea) {
      return ea.row === event.element;
    });
    for(var i = 0; i < cells.length; i++) {
      graphicsFactory.update('cell', cells[i], elementRegistry.getGraphics(cells[i]));
    }
  });
}

ChangeSupport.$inject = [ 'eventBus', 'elementRegistry', 'graphicsFactory' ];

module.exports = ChangeSupport;

},{}],220:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'changeSupport'],
  changeSupport: [ 'type', _dereq_(219) ]
};

},{"219":219}],221:[function(_dereq_,module,exports){
'use strict';



var domify = _dereq_(193),
    domClasses = _dereq_(191),
    assign = _dereq_(182),
    forEach = _dereq_(95);

/**
 * Offers the ability to create a combobox which is a combination of an
 *
 * <ul>
 *   <li>input</li>
 *   <li>dropdown</li>
 *   <li>typeahead</li>
 * </ul>
 *
 * @param {Object}   config
 * @param {String}   config.label
 *                            Text of the label which will be placed before the input field
 * @param {String[]} config.classNames
 *                            Array of Strings each identifying a class name of the comboBox container
 * @param {String[]} config.options
 *                            Array of Strings each specifying one option for the dropdown and typeahead feature
 * @param {String[]} config.dropdownClassNames
 *                            Array of Strings each identifying a class name of the dropdown container
 */
function ComboBox(config) {

  var self = this;
  var template = domify("<div>\r\n  <label></label>\r\n  <input tabindex=\"0\" />\r\n  <span class=\"cb-caret\"></span>\r\n</div>\r\n");

  var label = config.label,
      classNames = config.classNames,
      options = config.options,
      dropdownClassNames = config.dropdownClassNames;

  this._dropdown = document.createElement('ul');
  this._template = template;
  this._dropdownOpen = false;
  this._disabled = false;

  this._listeners = {};

  // assign classes to the combobox template
  forEach(classNames, function(className) {
    domClasses(template).add(className);
  });

  // assign classes to the dropdown node
  forEach(dropdownClassNames, function(className) {
    domClasses(self._dropdown).add(className);
  });

  // create options
  forEach(options, function(option) {
    var node = document.createElement('li');
    node.setAttribute('tabindex', '1');
    node.textContent = option;
    self._dropdown.appendChild(node);
  });

  // set the label of the combobox
  template.querySelector('label').textContent = label + ':';


  // --- event listeners ---

  // toggles the dropdown on click on the caret symbol
  template.querySelector('span').addEventListener('click', function(evt) {
    self._toggleDropdown(options);
    evt.stopPropagation();
  });

  // closes the dropdown when it is open and the user clicks somewhere
  document.body.addEventListener('click', function(evt) {
    self._closeDropdown();
  });

  // updates the value of the input field when the user
  //   a. clicks on an option in the dropdown
  //   b. focuses an option in the dropdown via keyboard
  var update = function(evt) {
    self.setValue(evt.target.textContent);
  };
  this._dropdown.addEventListener('click', function(evt) {
    update(evt);

    // stop event propagation to prevent closing potential complex cells
    evt.stopPropagation();

    // still close the dropdown
    self._closeDropdown();
  });
  this._dropdown.addEventListener('focus', update, true);

  // keyboard behavior for dropdown and input field
  var keyboardFunction = function(evt) {
    var code = evt.which || evt.keyCode;

    // ESC
    if (code === 27) {
      self._closeDropdown();
    } else

    // ENTER
    if (code === 13) {
      self._toggleDropdown(options);
    } else

    // TAB, DOWN
    if (code === 9 || code === 40) {
      evt.preventDefault();
      self._focusNext(code === 9 && evt.shiftKey);
    } else

    // UP
    if (code === 38) {
      evt.preventDefault();
      self._focusNext(true);
    }

  };
  this._dropdown.addEventListener('keydown', keyboardFunction);
  this._template.querySelector('input').addEventListener('keydown', keyboardFunction);

  // when typing, show only options that match the typed text
  this._template.querySelector('input').addEventListener('input', function(evt) {
    var filteredList = options.filter(function(option) {
      return option.toLowerCase().indexOf(self._template.querySelector('input').value.toLowerCase()) !== -1;
    });
    self._openDropdown(filteredList);

    self._fireEvent('valueChanged', {
      newValue: self._template.querySelector('input').value
    });

  });

  return this;
}

/**
 * Focuses the next field in the dropdown. Opens the dropdown if it is closed.
 *
 * @param {boolean} reverse Focus previous field instead of next field
 */
ComboBox.prototype._focusNext = function(reverse) {

  if (!this._isDropdownOpen()) {
    this._openDropdown();
    return;
  }

  var element = document.activeElement;
  var focus;

  // get the element which should have focus
  if (element === this._template.querySelector('input')) {
    focus = this._dropdown[reverse ? 'lastChild' : 'firstChild'];
  } else if (element.parentNode === this._dropdown) {
    focus = element[reverse ? 'previousSibling' : 'nextSibling'];
  }

  // if the element is not displayed (due to text input),
  // select next visible element instead
  while (focus && focus.style.display === 'none') {
    focus = focus[reverse ? 'previousSibling' : 'nextSibling'];
  }

  // if no element can be selected (search reached end of list), focus input field
  if (!focus) {
    focus = this._template.querySelector('input');
  }
  focus.focus();
};

ComboBox.prototype._toggleDropdown = function(options) {
  if (this._isDropdownOpen()) {
    this._closeDropdown();
  } else {
    this._openDropdown(options);
  }
};

ComboBox.prototype._openedDropdown = null;

ComboBox.prototype._isDropdownOpen = function() {
  return this._dropdownOpen;
};

ComboBox.prototype._closeDropdown = function() {
  if (this._isDropdownOpen()) {
    this._dropdownOpen = false;
    ComboBox.prototype._openedDropdown = null;
    domClasses(this._template).remove('expanded');
    this._dropdown.parentNode.removeChild(this._dropdown);
  }
};

/**
 *  Opens the dropdown menu for the input field.
 *
 *  @param {String[]} options Array of options which should be displayed in the dropdown
 *        If an option was specified in the constructor, but is not included in this list,
 *        it will be hidden via CSS. If the options array is empty, the dropdown is closed.
 */
ComboBox.prototype._openDropdown = function(options) {

  if (ComboBox.prototype._openedDropdown) {
    ComboBox.prototype._openedDropdown._closeDropdown();
  }

  // close dropdown if options array is empty or the comboBox is disabled
  if (options && options.length === 0 || this._disabled) {
    this._closeDropdown();
    return;
  }

  // update the display of options depending on options array
  forEach(this._dropdown.childNodes, function(child) {
    if (!options || options.indexOf(child.textContent) !== -1) {
      child.style.display = 'block';
    } else {
      child.style.display = 'none';
    }
  });

  // position the dropdown in relation to the position of the input element
  var input = this._template.querySelector('input');
  var e = input;
  var offset = {x:0,y:0};
  while (e)
  {
      offset.x += e.offsetLeft;
      offset.y += e.offsetTop;
      e = e.offsetParent;
  }

  assign(this._dropdown.style, {
    'display': 'block',
    'position': 'absolute',
    'top': (offset.y + input.clientHeight)+'px',
    'left': offset.x+'px',
    'width': input.clientWidth+'px',
  });
  document.body.appendChild(this._dropdown);

  ComboBox.prototype._openedDropdown = this;
  this._dropdownOpen = true;

  domClasses(this._template).add('expanded');

};

ComboBox.prototype._fireEvent = function(evt, payload) {
  forEach(this._listeners[evt], function(listener) {
    listener(payload);
  });
};

ComboBox.prototype.setValue = function(newValue) {
  this._fireEvent('valueChanged', {
    oldValue: this._template.querySelector('input').value,
    newValue: newValue
  });
  this._template.querySelector('input').value = newValue;
};

ComboBox.prototype.getValue = function() {
  return this._template.querySelector('input').value;
};

ComboBox.prototype.getNode = function() {
  return this._template;
};

ComboBox.prototype.addEventListener = function(event, fct) {
  this._listeners[event] = this._listeners[event] || [];
  this._listeners[event].push(fct);
};

ComboBox.prototype.disable = function() {
  this._disabled = true;
  this._template.querySelector('input').setAttribute('disabled', 'true');
};

ComboBox.prototype.enable = function() {
  this._disabled = false;
  this._template.querySelector('input').setAttribute('disabled', 'false');
};


module.exports = ComboBox;

},{"182":182,"191":191,"193":193,"95":95}],222:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(182),
    domClasses = _dereq_(191),
    domRemove = _dereq_(197);


/**
 *  A ComplexCell is a table cell that renders a template on click
 *  This can be used for cells containing complex data that can not be edited inline
 *
 *  In order to define a cell as complex, the cell must have a special property complex defining
 *  the configuration of the cell such as template or position:
 *
 *  Complex Property:
 *     - template: {DOMNode}
 *              HTML template of the complex content
 *     - className: {String | String[]} (optional, defaults to 'complex-cell')
 *              Defines the classNames which are set on the container of the complex cell
 *     - offset: {Object} (option, defaults to {x: 0, y: 0})
 *              Defines the offset of the template from the top left corner of the cell
 *
 *  Additional properties can be added to the complex object to retrieve them in events.
 *
 * Example:
 * cell.complex = {
 *      className: 'dmn-clauseexpression-setter',
 *      template: domify('<div>Hello World</div>'),
 *      type: 'mapping',
 *      offset: { x: 0, y: 10 }
 * };
 */
function ComplexCell(eventBus, elementRegistry) {

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;

  this.setupListeners();
}


ComplexCell.prototype.setupListeners = function() {
  var self = this;

  // click on body closes open complex cells
  document.body.addEventListener('click', function(event) {
    if (!event.preventDialogClose) {
      self.close();
    }
  });

  // also close the dialog on a hashchange, e.g. for single page applications that go to another page
  window.addEventListener('hashchange', function(event) {
    self.close();
  });

  this._eventBus.on(['table.scroll', 'table.destroy', 'popupmenu.open'], function(event) {
    self.close();
  });

  // click on elements close potentially open complex cells
  // and open a complex cell at the position of the cell
  this._eventBus.on('element.click', function(event) {

    self.close();

    // set flag on original event to prevent closing the opened dialog
    // this only applies if the event has an original event (so it was generated
    // from a browser event that travels the dom tree)
    if (event.originalEvent) {
      event.originalEvent.preventDialogClose = true;
    }

    if (event.element && event.element.complex) {

      // calculate position based on the position of the cell
      var gfx = self._elementRegistry.getGraphics(event.element);

      // traverse the offset parent chain to find the offset sum
      var e = gfx;
      var offset = {x:0,y:0};
      while (e)
      {
          offset.x += e.offsetLeft;
          offset.y += e.offsetTop;
          e = e.offsetParent;
      }

      // now also traverse the complete parent chain to determine the full scroll offset
      e = gfx;
      while (e && typeof e.scrollTop === 'number' && typeof e.scrollLeft === 'number')
      {
          offset.x -= e.scrollLeft;
          offset.y -= e.scrollTop;
          e = e.parentNode;
      }

      // add the global scroll offset
      offset.x += window.pageXOffset;
      offset.y += window.pageYOffset;

      event.element.complex.position = {
        x: offset.x,
        y: offset.y
      };

      self.open(event.element.complex);
    }
  });
};

ComplexCell.prototype.close = function() {
  if (this._current) {
    this._eventBus.fire('complexCell.close', this._current);

    domRemove(this._current.container);
    this._current = null;
  }
};

ComplexCell.prototype.isOpen = function() {
  return !!this._current;
};

/**
 * Creates a container that holds the template
 */
ComplexCell.prototype._createContainer = function(className, position) {
  var container = document.createElement('div');

  assign(container.style, {
    position: 'absolute',
    left: position.x + 'px',
    top: position.y  + 'px',
    width: 'auto',
    height: 'auto'
  });

  // stop propagation of click events on the container to avoid closing the template
  container.addEventListener('click', function(event) {
    event.stopPropagation();
  });

  if (typeof className === 'string') {
    domClasses(container).add(className);
  } else {
    for(var i = 0; i < className.length; i++) {
      domClasses(container).add(className[i]);
    }
  }

  return container;
};

ComplexCell.prototype.open = function(config) {
  var className = config.className || 'complex-cell',
      template = config.template;

  // make sure, only one complex cell dialog is open at a time
  if (this.isOpen()) {
    this.close();
  }

  // apply the optional offset configuration to the calculated position
  var position = {
    x: config.position.x + (config.offset && config.offset.x || 0),
    y: config.position.y + (config.offset && config.offset.y || 0)
  };

  var parent = document.body,

      // create the template container
      container = this._createContainer(className, position);

  // attach the template container to the document body
  this._attachContainer(container, parent);

  // attach the template node to the container
  this._attachContent(template, container);

  // save the currently open complex cell
  this._current = {
    container: container,
    config: config
  };

  this._eventBus.fire('complexCell.open', this._current);

  return this;
};

/**
 * Attaches the container to the DOM.
 *
 * @param {Object} container
 * @param {Object} parent
 */
ComplexCell.prototype._attachContainer = function(container, parent) {
  // Attach to DOM
  parent.appendChild(container);
};

/**
 * Attaches the content to the container.
 *
 * @param {Object} container
 * @param {Object} parent
 */
ComplexCell.prototype._attachContent = function(content, container) {
  container.appendChild(content);
};

ComplexCell.$inject = [ 'eventBus', 'elementRegistry' ];

module.exports = ComplexCell;

},{"182":182,"191":191,"197":197}],223:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: [ 'complexCell' ],
  complexCell: [ 'type', _dereq_(222) ]
};

},{"222":222}],224:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);
/**
 *  The controls module adds a container to the top-right corner of the table which holds
 *  some control elements
 */
function Controls(eventBus) {

  this._eventBus = eventBus;
  this.controlsContainer;

  var self = this;

  eventBus.on('sheet.init', function(evt) {

    var domNode = document.createElement('div');
    domClasses(domNode).add('tjs-controls');

    self.controlsContainer = domNode;
    evt.sheet.parentNode.appendChild(domNode);
    
    eventBus.fire('controls.init', {
      node: domNode,
      controls: self
    });

  });

}

Controls.prototype.addControl = function(label, fct) {
  this._eventBus.fire('controls.add', {
    label: label
  });

  var newNode = document.createElement('a');
  newNode.textContent = label;

  newNode.addEventListener('click', fct);

  this.controlsContainer.appendChild(newNode);

  this._eventBus.fire('controls.added', {
    label: label,
    node: newNode
  });
};


Controls.$inject = [ 'eventBus' ];

module.exports = Controls;

},{"191":191}],225:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: [ 'controls' ],
  controls: [ 'type', _dereq_(224) ]
};

},{"224":224}],226:[function(_dereq_,module,exports){
'use strict';

var debounce = _dereq_(100);
var DEBOUNCE_DELAY = 300;

function EditBehavior(
    eventBus,
    selection,
    sheet,
    elementRegistry,
    modeling,
    rules,
    graphicsFactory,
    keyboard,
    commandStack,
    tableName) {

  var replaceFct = function(text) {
    return text
      .replace(/<div><br><\/div>/ig, '\n')  // replace div with a br with single linebreak
      .replace(/<br(\s*)\/*>/ig, '\n')      // replace single line-breaks
      .replace(/<(div|p)(\s*)\/*>/ig, '\n') // add a line break before all div and p tags
      .replace(/&nbsp;/ig, ' ')             // replace non breaking spaces with normal spaces
      .replace(/(<([^>]+)>)/ig, '');        // remove any remaining tags
  };

  var sanitizeInput = function(text) {
    var encodedString = replaceFct(text).trim();

    // create an temporary textarea to translate html entities to normal chars
    var textArea = document.createElement('textarea');
        textArea.innerHTML = encodedString;
    return textArea.value;
  };

  var sanitizeInputWithoutTrim = function(text) {
    var encodedString = replaceFct(text);

    // create an temporary textarea to translate html entities to normal chars
    var textArea = document.createElement('textarea');
        textArea.innerHTML = encodedString;
    return textArea.value;
  };

  eventBus.on('element.focus', function(event) {
    if (rules.allowed('cell.edit', {
      row: event.element.row,
      column: event.element.column,
      content: event.element.content
    }) && !event.element.row.isFoot &&
          !event.element.complex) {

      event.gfx.childNodes[0].focus();

      var element = event.element;

      selection.select(element);

      // select the content of the focused cell
      var sel = window.getSelection();
      sel.selectAllChildren(event.gfx.childNodes[0]);

      // IE has execCommand, but throws an Exception when trying to use it with
      // enableInlineTableEditing
      // We need this line so that FF does not screw us with its build in
      // table editing features
      try {
        document.execCommand('enableInlineTableEditing', false, 'false');
      } catch(e) {
        // only catch the IE error
        if (e.description !== 'Invalid argument.') {
          // rethrow all other errors
          throw e;
        }
      }
    }
  });

  eventBus.on('element.mousedown', function(event) {
    if (rules.allowed('cell.edit', {
      row: event.element.row,
      column: event.element.column,
      content: event.element.content
    }) && !event.element.row.isFoot &&
          selection.get() !== event.element &&
          !event.element.complex) {

      selection.select(event.element);

      // ensure that we get a focus event afterwards
      // prevent chrome from firing a buildin focus event
      event.preventDefault();
      // cause all browsers to focus the child node
      event.gfx.childNodes[0].focus();
    }
  });

  eventBus.on('element.blur', function(event) {
    var element = event.element;

    if (selection.isSelected(element)) {
      selection.deselect();
    }
  });

  eventBus.on('element.input', debounce(function(event) {
    var element = event.element;
    var gfx = elementRegistry.getGraphics(event.element);
    if (selection.isSelected(element)) {

      modeling.editCell(element.row.id, element.column.id, sanitizeInputWithoutTrim(gfx.innerHTML));

    }
  }, DEBOUNCE_DELAY));

  eventBus.on('selection.changed', function(event) {
    if (event.oldSelection) {
      // apply changes of the diagram to the model
      var gfxOld = elementRegistry.getGraphics(event.oldSelection);
      if (gfxOld) {
        modeling.editCell(event.oldSelection.row.id, event.oldSelection.column.id, sanitizeInput(gfxOld.innerHTML));
        graphicsFactory.update('row', event.oldSelection.row, elementRegistry.getGraphics(event.oldSelection.row));
        graphicsFactory.update('column', event.oldSelection.column,
                elementRegistry.getGraphics(event.oldSelection.column));
      }
    }
    if (event.newSelection) {
      graphicsFactory.update('cell', event.newSelection, elementRegistry.getGraphics(event.newSelection));
      graphicsFactory.update('row', event.newSelection.row, elementRegistry.getGraphics(event.newSelection.row));
      graphicsFactory.update('column', event.newSelection.column,
              elementRegistry.getGraphics(event.newSelection.column));
    }
  });

  var nameFocus = false;
  var nameElement = null;
  eventBus.on('tableName.init', function(event) {
    if (rules.allowed('name.edit')) {

      nameElement = event.node;

      eventBus.fire('tableName.allowEdit', {
        editAllowed: true
      });

      event.node.setAttribute('contenteditable', true);

      event.node.addEventListener('focus', function(evt) {
        nameFocus = true;
      }, true);
      event.node.addEventListener('blur', function(evt) {
        nameFocus = false;
        var newName = sanitizeInput(evt.target.innerHTML);
        if (newName !== tableName.getName()) {
          modeling.editName(newName);
        }
      }, true);
    }
  });

  if (keyboard) {
    keyboard._listeners.unshift(function(key, modifiers) {
      if(key === 13) {
        var evt = modifiers;
        if(modifiers.ctrlKey || modifiers.metaKey) {
          // standard behavior (linebreak) on ctrl+enter
          // http://stackoverflow.com/a/12957539/4582955
            var selectObj = document.getSelection();
            var range = selectObj.getRangeAt(0);

            var br = document.createElement('br'),
                textNode = document.createTextNode('\u00a0');
                    //Passing ' ' directly will not end up being shown correctly

            range.deleteContents();             // delete the selection
            range.insertNode(br);               // add a linebreak
            range.collapse(false);              // go after the linebreak
            range.insertNode(textNode);         // add a whitespace (so the linebreak gets displayed)
            range.collapse(true);               // place cursor before whitespace

            // update the selection with the new range
            selectObj.removeAllRanges();
            selectObj.addRange(range);

        } else if(modifiers.shiftKey) {
          evt.preventDefault();
          selection.selectAbove();
        } else {
          evt.preventDefault();
          selection.selectBelow();
        }
      }
    });
  }
}

EditBehavior.$inject = [
  'eventBus',
  'selection',
  'sheet',
  'elementRegistry',
  'modeling',
  'rules',
  'graphicsFactory',
  'keyboard',
  'commandStack',
  'tableName' ];

module.exports = EditBehavior;

},{"100":100}],227:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);

function EditRenderer(
    eventBus,
    rules) {

  eventBus.on('cell.render', function(event) {
    if (rules.allowed('cell.edit', {
      row: event.data.row,
      column: event.data.column,
      content: event.data.content
    }) && !event.data.row.isFoot  &&
          !event.data.complex) {
      event.gfx.childNodes[0].setAttribute('contenteditable', true);
    } else {
      event.gfx.childNodes[0].setAttribute('contenteditable', false);
    }

    event.gfx.childNodes[0].setAttribute('spellcheck', 'false');

    if (event.data.selected) {
      domClasses(event.gfx).add('focused');
    } else {
      domClasses(event.gfx).remove('focused');
    }

    if (!event.data.row.isFoot) {

      if (event.data.row.selected && !event.data.isHead) {
        domClasses(event.gfx).add('row-focused');
      } else {
        domClasses(event.gfx).remove('row-focused');
      }
      if (event.data.column.selected && !event.data.row.useTH) {
        domClasses(event.gfx).add('col-focused');
      } else {
        domClasses(event.gfx).remove('col-focused');
      }
    }

  });

  eventBus.on('row.render', function(event) {
    if (event.data.selected && !event.data.isHead) {
      domClasses(event.gfx).add('row-focused');
    } else {
      domClasses(event.gfx).remove('row-focused');
    }

  });
}

EditRenderer.$inject = [
  'eventBus',
  'rules'
];

module.exports = EditRenderer;

},{"191":191}],228:[function(_dereq_,module,exports){
'use strict';

/**
 * A service that offers the current selection in a table.
 * Offers the api to control the selection, too.
 *
 * @class
 *
 * @param {EventBus} eventBus the event bus
 */
function Selection(eventBus, elementRegistry) {

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;

  this._selectedElement = null;
}

Selection.$inject = [ 'eventBus', 'elementRegistry' ];

module.exports = Selection;


Selection.prototype.deselect = function(skipEvent) {
  if (this._selectedElement) {
    var oldSelection = this._selectedElement;

    this._selectedElement.row.selected = false;
    this._selectedElement.column.selected = false;
    this._selectedElement.selected = false;
    this._selectedElement = null;
    if (!skipEvent) {
      this._eventBus.fire('selection.changed', { oldSelection: oldSelection, newSelection: this._selectedElement });
    }
    return oldSelection;
  }
};


Selection.prototype.get = function() {
  return this._selectedElement;
};

Selection.prototype.isSelected = function(element) {
  return this._selectedElement === element;
};


/**
 * This method selects a cell in the table.
 *
 * @method Selection#select
 *
 * @param  {Object} element element to be selected
 */
Selection.prototype.select = function(element) {
  if (!element || this.isSelected(element)) {
    return;
  }

  var oldSelection = this._selectedElement;

  if (oldSelection) {
    this.deselect(true);
  }

  this._selectedElement = element;
  element.selected = true;
  element.row.selected = true;
  element.column.selected = true;

  this._eventBus.fire('selection.changed', { oldSelection: oldSelection, newSelection: this._selectedElement });
};

/**
 * This method selects the cell above the currently selected cell
 *
 * @method Selection#selectAbove
 */
Selection.prototype.selectAbove = function() {
  var node = this.get();
  if(node && node.row && node.row.previous) {
    var cell = this._elementRegistry.filter(function(element) {
      return element.row && element.row === node.row.previous &&
         element.column && element.column === node.column;
    })[0];
    this.select(cell);
    this._elementRegistry.getGraphics(cell.id).firstChild.focus();
  }
};

/**
 * This method selects the cell below the currently selected cell
 *
 * @method Selection#selectBelow
 */
Selection.prototype.selectBelow = function() {
  var node = this.get();
  if(node && node.row && node.row.next) {
    var cell = this._elementRegistry.filter(function(element) {
      return element.row && element.row === node.row.next &&
         element.column && element.column === node.column;
    })[0];
    this.select(cell);
    this._elementRegistry.getGraphics(cell.id).firstChild.focus();
  }
};

},{}],229:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'editBehavior', 'editRenderer' ],
  __depends__: [
    _dereq_(233),
    _dereq_(248),
    _dereq_(235),
    _dereq_(57)
  ],
  selection: [ 'type', _dereq_(228) ],
  editBehavior: [ 'type', _dereq_(226) ],
  editRenderer: [ 'type', _dereq_(227) ]
};

},{"226":226,"227":227,"228":228,"233":233,"235":235,"248":248,"57":57}],230:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95);

var NOT_REGISTERED_ERROR = 'is not a registered action',
    IS_REGISTERED_ERROR = 'is already registered';

/**
 * An interface that provides access to modeling actions by decoupling
 * the one who requests the action to be triggered and the trigger itself.
 *
 * It's possible to add new actions by registering them with ´registerAction´ and likewise
 * unregister existing ones with ´unregisterAction´.
 *
 */
function EditorActions(commandStack) {

  this._actions = {
    undo: function() {
      commandStack.undo();
    },
    redo: function() {
      commandStack.redo();
    }
  };
}

EditorActions.$inject = [ 'commandStack' ];

module.exports = EditorActions;


/**
 * Triggers a registered action
 *
 * @param  {String} action
 * @param  {Object} opts
 *
 * @return {Unknown} Returns what the registered listener returns
 */
EditorActions.prototype.trigger = function(action, opts) {
  if (!this._actions[action]) {
    throw error(action, NOT_REGISTERED_ERROR);
  }

  return this._actions[action](opts);
};


/**
 * Registers a collections of actions.
 * The key of the object will be the name of the action.
 *
 * @example
 * ´´´
 * var actions = {
  *    redo: function() {
  *      commandStack.redo();
  *    },
  *    ruleAdd: function() {
  *      var newRow = {id: Id.next()};
  *      modeling.createRow(newRow);
  *    }
  * ];
 * editorActions.register(actions);
 *
 * editorActions.isRegistered('spaceTool'); // true
 * ´´´
 *
 * @param  {Object} actions
 */
EditorActions.prototype.register = function(actions, listener) {
  if (typeof actions === 'string') {
    return this._registerAction(actions, listener);
  }

  forEach(actions, function(listener, action) {
    this._registerAction(action, listener);
  }, this);
};

/**
 * Registers a listener to an action key
 *
 * @param  {String} action
 * @param  {Function} listener
 */
EditorActions.prototype._registerAction = function(action, listener) {
  if (this.isRegistered(action)) {
    throw error(action, IS_REGISTERED_ERROR);
  }

  this._actions[action] = listener;
};

/**
 * Unregister an existing action
 *
 * @param {String} action
 */
EditorActions.prototype.unregister = function(action) {
  if (!this.isRegistered(action)) {
    throw error(action, NOT_REGISTERED_ERROR);
  }

  this._actions[action] = undefined;
};

/**
 * Returns the number of actions that are currently registered
 *
 * @return {Number}
 */
EditorActions.prototype.length = function() {
  return Object.keys(this._actions).length;
};

/**
 * Checks wether the given action is registered
 *
 * @param {String} action
 *
 * @return {Boolean}
 */
EditorActions.prototype.isRegistered = function(action) {
  return !!this._actions[action];
};


function error(action, message) {
  return new Error(action + ' ' + message);
}

},{"95":95}],231:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'editorActions' ],
  editorActions: [ 'type', _dereq_(230) ]
};

},{"230":230}],232:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95),
    domDelegate = _dereq_(192);


var isPrimaryButton = _dereq_(60).isPrimaryButton;

/**
 * A plugin that provides interaction events for table elements.
 *
 * It emits the following events:
 *
 *   * element.hover
 *   * element.out
 *   * element.click
 *   * element.dblclick
 *   * element.mousedown
 *   * element.focus
 *   * element.blur
 *
 * Each event is a tuple { element, gfx, originalEvent }.
 *
 * Canceling the event via Event#preventDefault() prevents the original DOM operation.
 *
 * @param {EventBus} eventBus
 */
function InteractionEvents(eventBus, elementRegistry) {

  function fire(type, event) {
    var target = event.delegateTarget || event.target,
        gfx = target,
        element = elementRegistry.get(gfx),
        returnValue;

    if (!gfx || !element) {
      return;
    }

    returnValue = eventBus.fire(type, { element: element, gfx: gfx, originalEvent: event });

    if (returnValue === false) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  var handlers = {};

  function mouseHandler(type) {

    var fn = handlers[type];

    if (!fn) {
      fn = handlers[type] = function(event) {
        // only indicate left mouse button interactions and contextmenu
        if (isPrimaryButton(event) || type === 'element.contextmenu') {
          fire(type, event);
        }
      };
    }

    return fn;
  }

  var bindings = {
    mouseover: 'element.hover',
    mouseout: 'element.out',
    click: 'element.click',
    dblclick: 'element.dblclick',
    mousedown: 'element.mousedown',
    mousemove: 'element.mousemove',
    mouseup: 'element.mouseup',
    focus: 'element.focus',
    blur: 'element.blur',
    input: 'element.input',
    contextmenu: 'element.contextmenu'
  };

  var elementSelector = 'td,th';

  ///// event registration

  function isFocusEvent(event) {
    return event === 'focus' || event === 'blur';
  }

  function registerEvent(node, event, localEvent) {
    var handler = mouseHandler(localEvent);
    handler.$delegate = domDelegate.bind(node, elementSelector, event, handler, isFocusEvent(event));
  }

  function unregisterEvent(node, event, localEvent) {
    domDelegate.unbind(node, event, mouseHandler(localEvent).$delegate, isFocusEvent(event));
  }

  function registerEvents(node) {
    forEach(bindings, function(val, key) {
      registerEvent(node, key, val);
    });
  }

  function unregisterEvents(node) {
    forEach(bindings, function(val, key) {
      unregisterEvent(node, key, val);
    });
  }

  function scrollHandler(node) {

    var fn = handlers.scroll;

    if (!fn) {
      fn = handlers.scroll = function (event) {
        if (event.target.contains(node)) {
          eventBus.fire('table.scroll', { gfx: event.target, originalEvent: event });
        }
      };
    }

    return fn;
  }

  function registerScrollEvent(node) {
    document.addEventListener('scroll', scrollHandler(node), true);
  }

  function unregisterScrollEvent(node) {
    document.removeEventListener('scroll', scrollHandler(node), true);
  }

  eventBus.on('sheet.destroy', function(event) {
    unregisterEvents(event.sheet);
    unregisterScrollEvent(event.sheet);
  });

  eventBus.on('sheet.init', function(event) {
    registerEvents(event.sheet);
    registerScrollEvent(event.sheet);
  });


  // API

  this.fire = fire;

  this.mouseHandler = mouseHandler;

  this.registerEvent = registerEvent;
  this.unregisterEvent = unregisterEvent;
}


InteractionEvents.$inject = [ 'eventBus', 'elementRegistry' ];

module.exports = InteractionEvents;


/**
 * An event indicating that the mouse hovered over an element
 *
 * @event element.hover
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the mouse has left an element
 *
 * @event element.out
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the mouse has clicked an element
 *
 * @event element.click
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the mouse has double clicked an element
 *
 * @event element.dblclick
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the mouse has gone down on an element.
 *
 * @event element.mousedown
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the mouse has gone up on an element.
 *
 * @event element.mouseup
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the element has gained focus.
 *
 * @event element.focus
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the element has lost focus
 *
 * @event element.blur
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

},{"192":192,"60":60,"95":95}],233:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'interactionEvents' ],
  interactionEvents: [ 'type', _dereq_(232) ]
};

},{"232":232}],234:[function(_dereq_,module,exports){
'use strict';

var domEvent = _dereq_(194),
    domMatches = _dereq_(195);

/**
 * A keyboard abstraction that may be activated and
 * deactivated by users at will, consuming key events
 * and triggering table actions.
 *
 * The implementation fires the following key events that allow
 * other components to hook into key handling:
 *
 *  - keyboard.bind
 *  - keyboard.unbind
 *  - keyboard.init
 *  - keyboard.destroy
 *
 * All events contain the fields (node, listeners).
 *
 * A default binding for the keyboard may be specified via the
 * `keyboard.bindTo` configuration option.
 *
 * @param {EventBus} eventBus
 * @param {CommandStack} commandStack
 */
function Keyboard(config, eventBus, editorActions) {
  var self = this;

  this._eventBus = eventBus;
  this._editorActions = editorActions;

  this._listeners = [];

  // our key handler is a singleton that passes
  // (keycode, modifiers) to each listener.
  //
  // listeners must indicate that they handled a key event
  // by returning true. This stops the event propagation.
  //
  this._keyHandler = function(event) {

    var i, l,
        target = event.target,
        listeners = self._listeners,
        code = event.keyCode || event.charCode || -1;

    if (domMatches(target, 'input, textarea')) {
      return;
    }

    for (i = 0; !!(l = listeners[i]); i++) {
      if (l(code, event)) {
        event.stopPropagation();
        event.preventDefault();
      }
    }
  };

  // properly clean dom registrations
  eventBus.on('table.destroy', function() {
    self._fire('destroy');

    self.unbind();
    self._listeners = null;
  });

  eventBus.on('table.init', function() {
    self._fire('init');

    if (config && config.bindTo) {
      self.bind(config.bindTo);
    }
  });

  this._init();
}

Keyboard.$inject = [ 'config.keyboard', 'eventBus', 'editorActions' ];

module.exports = Keyboard;


Keyboard.prototype.bind = function(node) {
  this._node = node;

  // bind key events
  domEvent.bind(node, 'keydown', this._keyHandler, true);

  this._fire('bind');
};

Keyboard.prototype.getBinding = function() {
  return this._node;
};

Keyboard.prototype.unbind = function() {
  var node = this._node;

  if (node) {
    this._fire('unbind');

    // unbind key events
    domEvent.unbind(node, 'keydown', this._keyHandler, true);
  }

  this._node = null;
};


Keyboard.prototype._fire = function(event) {
  this._eventBus.fire('keyboard.' + event, { node: this._node, listeners: this._listeners });
};

Keyboard.prototype._init = function() {
  var listeners = this._listeners,
      editorActions = this._editorActions;


  // init default listeners

  // undo
  // (CTRL|CMD) + Z
  function undo(key, modifiers) {

    if (isCmd(modifiers) && !isShift(modifiers) && key === 90) {
      editorActions.trigger('undo');

      return true;
    }
  }

  // redo
  // CTRL + Y
  // CMD + SHIFT + Z
  function redo(key, modifiers) {

    if (isCmd(modifiers) && (key === 89 || (key === 90 && isShift(modifiers)))) {
      editorActions.trigger('redo');

      return true;
    }
  }

  listeners.push(undo);
  listeners.push(redo);
};


/**
 * Add a listener function that is notified with (key, modifiers) whenever
 * the keyboard is bound and the user presses a key.
 *
 * @param {Function} listenerFn
 */
Keyboard.prototype.addListener = function(listenerFn) {
  this._listeners.push(listenerFn);
};

Keyboard.prototype.hasModifier = hasModifier;
Keyboard.prototype.isCmd = isCmd;
Keyboard.prototype.isShift = isShift;


function hasModifier(modifiers) {
  return (modifiers.ctrlKey || modifiers.metaKey || modifiers.shiftKey || modifiers.altKey);
}

function isCmd(modifiers) {
  return modifiers.ctrlKey || modifiers.metaKey;
}

function isShift(modifiers) {
  return modifiers.shiftKey;
}

},{"194":194,"195":195}],235:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(231)
  ],
  __init__: [ 'keyboard' ],
  keyboard: [ 'type', _dereq_(234) ]
};

},{"231":231,"234":234}],236:[function(_dereq_,module,exports){
'use strict';

var debounce = _dereq_(100);

function LineNumbers(eventBus, sheet) {

  this._sheet = sheet;
  this._utilityColumn = null;

  var self = this;

  eventBus.on('utilityColumn.added', function(event) {
    var column = event.column;
    self._utilityColumn = column;
    self.updateLineNumbers();
  });
  eventBus.on([ 'cells.added', 'row.removed', 'row.moved' ], debounce(self.updateLineNumbers.bind(self), 100, {
    'leading': true,
    'trailing': true
  }));
}


LineNumbers.$inject = [ 'eventBus', 'sheet' ];

module.exports = LineNumbers;

LineNumbers.prototype.updateLineNumbers = function() {
  if (!this._utilityColumn || !this._sheet.getLastRow('body')) {
    // only render line numbers if utility column has been added
    return;
  }

  // find the first row
  var currentRow = this._sheet.getLastRow('body');
  while (currentRow.previous) {
    currentRow = currentRow.previous;
  }

  // update the row number for all rows
  var i = 1;
  while (currentRow) {
    this._sheet.setCellContent({
      row: currentRow,
      column: this._utilityColumn,
      content: i
    });
    i++;
    currentRow = currentRow.next;
  }
};

},{"100":100}],237:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'lineNumbers' ],
  __depends__: [
    _dereq_(258)
  ],
  lineNumbers: [ 'type', _dereq_(236) ]
};

},{"236":236,"258":258}],238:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95);


/**
 * The basic modeling entry point.
 *
 * @param {EventBus} eventBus
 * @param {ElementFactory} elementFactory
 * @param {CommandStack} commandStack
 */
function Modeling(eventBus, elementFactory, commandStack, sheet) {
  this._eventBus = eventBus;
  this._elementFactory = elementFactory;
  this._commandStack = commandStack;
  this._sheet = sheet;

  var self = this;

  // high priority listener to make sure listeners are initialized when
  // subsequent setup steps ask whether operations are possible
  eventBus.on('table.init', 1500, function() {
    // register modeling handlers
    self._registerHandlers(commandStack);
  });
}

Modeling.$inject = [ 'eventBus', 'elementFactory', 'commandStack', 'sheet' ];

module.exports = Modeling;


Modeling.prototype.getHandlers = function() {
  return {
    'row.create': _dereq_(241),
    'row.delete': _dereq_(243),
    'row.clear': _dereq_(239),
    'row.move': _dereq_(247),

    'column.create': _dereq_(240),
    'column.delete': _dereq_(242),
    'column.move': _dereq_(246),

    'cell.edit': _dereq_(244),

    'name.edit': _dereq_(245)
  };
};

/**
 * Register handlers with the command stack
 *
 * @param {CommandStack} commandStack
 */
Modeling.prototype._registerHandlers = function(commandStack) {
  forEach(this.getHandlers(), function(handler, id) {
    commandStack.registerHandler(id, handler);
  });
};


///// modeling helpers /////////////////////////////////////////

Modeling.prototype.createRow = function(row) {

  row = this._elementFactory.create('row', row);

  var context = {
    row: row
  };
  this._commandStack.execute('row.create', context);

  return context.row;
};

Modeling.prototype.moveRow = function(source, target, above) {
  var context = {
    source: source,
    target: target,
    above: above
  };

  this._commandStack.execute('row.move', context);

  return context;
};

Modeling.prototype.createColumn = function(column) {

  column = this._elementFactory.create('column', column);

  var context = {
    column: column
  };

  this._commandStack.execute('column.create', context);

  return context.column;
};

Modeling.prototype.deleteRow = function(row) {

  var context = {
    row: row
  };

  this._commandStack.execute('row.delete', context);

  return context.row;
};

Modeling.prototype.clearRow = function(row) {

  var context = {
    row: row
  };

  this._commandStack.execute('row.clear', context);

  return context.row;
};

Modeling.prototype.deleteColumn = function(column) {

  var context = {
    column: column
  };

  this._commandStack.execute('column.delete', context);

  return context.column;
};

Modeling.prototype.moveColumn = function(source, target, left) {
  var context = {
    source: source,
    target: target,
    left: left
  };

  this._commandStack.execute('column.move', context);

  return context;
};

Modeling.prototype.editCell = function(row, column, content) {

  var context = {
    row: row,
    column: column,
    content: content
  };

  if (content.trim() !== this._sheet.getCellContent(context)) {
    // only execute edit command if content changed
    this._commandStack.execute('cell.edit', context);
  }

  return context;
};

Modeling.prototype.editName = function(newName) {
  var context = {
    newName : newName
  };

  this._commandStack.execute('name.edit', context);

  return context;
};

},{"239":239,"240":240,"241":241,"242":242,"243":243,"244":244,"245":245,"246":246,"247":247,"95":95}],239:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95);

/**
 * A handler that implements reversible clear of rows
 *
 * @param {sheet} sheet
 */
function DeleteRowHandler(sheet, elementRegistry, utilityColumn) {
  this._sheet = sheet;
  this._elementRegistry = elementRegistry;
  this._utilityColumn = utilityColumn;
}

DeleteRowHandler.$inject = [ 'sheet', 'elementRegistry', 'utilityColumn' ];

module.exports = DeleteRowHandler;



////// api /////////////////////////////////////////


/**
 * Clear a row
 *
 * @param {Object} context
 */
DeleteRowHandler.prototype.execute = function(context) {
  var self = this;
  var utilityColumn = this._utilityColumn && this._utilityColumn.getColumn();
  var cells = this._elementRegistry.filter(function(element) {
    if (utilityColumn) {
      return element._type === 'cell' && element.row === context.row && element.column !== utilityColumn;
    } else {
      return element._type === 'cell' && element.row === context.row;
    }
  });
  context._oldContent = [];
  forEach(cells, function(cell) {
    context._oldContent.push(cell.content);
    self._sheet.setCellContent({row: context.row, column: cell.column, content: null});
  });
};


/**
 * Undo clear by resetting the content
 */
DeleteRowHandler.prototype.revert = function(context) {
  var self = this;
  var utilityColumn = this._utilityColumn && this._utilityColumn.getColumn();
  var cells = this._elementRegistry.filter(function(element) {
    if (utilityColumn) {
      return element._type === 'cell' && element.row === context.row && element.column !== utilityColumn;
    } else {
      return element._type === 'cell' && element.row === context.row;
    }
  });
  var i = 0;
  forEach(cells, function(cell) {
    self._sheet.setCellContent({row: context.row, column: cell.column, content: context._oldContent[i++]});
  });
};

},{"95":95}],240:[function(_dereq_,module,exports){
'use strict';

/**
 * A handler that implements reversible addition of columns.
 *
 * @param {sheet} sheet
 */
function CreateColumnHandler(sheet) {
  this._sheet = sheet;
}

CreateColumnHandler.$inject = [ 'sheet' ];

module.exports = CreateColumnHandler;



////// api /////////////////////////////////////////


/**
 * Appends a column to the sheet
 *
 * @param {Object} context
 */
CreateColumnHandler.prototype.execute = function(context) {
  if (context._previousColumn) {
    context.column.previous = context._previousColumn;
  }
  if (context._nextColumn) {
    context.column.next = context._nextColumn;
  }

  this._sheet.addColumn(context.column);

  context._previousColumn = context.column.previous;
  context._nextColumn = context.column.next;

  return context.column;
};


/**
 * Undo create by removing the column
 */
CreateColumnHandler.prototype.revert = function(context) {
  this._sheet.removeColumn(context.column);
};

},{}],241:[function(_dereq_,module,exports){
'use strict';

/**
 * A handler that implements reversible addition of rows.
 *
 * @param {sheet} sheet
 */
function CreateRowHandler(sheet) {
  this._sheet = sheet;
}

CreateRowHandler.$inject = [ 'sheet' ];

module.exports = CreateRowHandler;



////// api /////////////////////////////////////////


/**
 * Appends a row to the sheet
 *
 * @param {Object} context
 */
CreateRowHandler.prototype.execute = function(context) {
  if (context._previousRow) {
    context.row.previous = context._previousRow;
  }
  if (context._nextRow) {
    context.row.next = context._nextRow;
  }

  this._sheet.addRow(context.row);

  context._previousRow = context.row.previous;
  context._nextRow = context.row.next;

  return context.row;
};


/**
 * Undo create by removing the row
 */
CreateRowHandler.prototype.revert = function(context) {
  this._sheet.removeRow(context.row);
};

},{}],242:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95);

/**
 * A handler that implements reversible addition of columns.
 *
 * @param {sheet} sheet
 */
function DeleteColumnHandler(sheet, elementRegistry) {
  this._sheet = sheet;
  this._elementRegistry = elementRegistry;
}

DeleteColumnHandler.$inject = [ 'sheet', 'elementRegistry' ];

module.exports = DeleteColumnHandler;



////// api /////////////////////////////////////////


/**
 * Appends a column to the sheet
 *
 * @param {Object} context
 */
DeleteColumnHandler.prototype.execute = function(context) {

  // save the neighbors
  context._next = context.column.next;
  context._previous = context.column.previous;

  // save the cells
  context._cells = this._elementRegistry.filter(function(element) {
    return element._type === 'cell' && element.column === context.column;
  });

  this._sheet.removeColumn(context.column);
  return context.column;
};


/**
 * Undo create by removing the column
 */
DeleteColumnHandler.prototype.revert = function(context) {
  context.column.next = context._next;
  context.column.previous = context._previous;

  this._sheet.addColumn(context.column);

  var self = this;

  // relive the cells
  forEach(context._cells, function(cell) {
    self._sheet.setCellContent({row: cell.row, column: context.column, content: cell.content});
  });
};

},{"95":95}],243:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95);

/**
 * A handler that implements reversible addition of rows.
 *
 * @param {sheet} sheet
 */
function DeleteRowHandler(sheet, elementRegistry) {
  this._sheet = sheet;
  this._elementRegistry = elementRegistry;
}

DeleteRowHandler.$inject = [ 'sheet', 'elementRegistry' ];

module.exports = DeleteRowHandler;



////// api /////////////////////////////////////////


/**
 * Appends a row to the sheet
 *
 * @param {Object} context
 */
DeleteRowHandler.prototype.execute = function(context) {

  // save the neighbors
  context._next = context.row.next;
  context._previous = context.row.previous;

  // save the cells
  context._cells = this._elementRegistry.filter(function(element) {
    return element._type === 'cell' && element.row === context.row;
  });

  this._sheet.removeRow(context.row);
  return context.row;
};


/**
 * Undo create by removing the row
 */
DeleteRowHandler.prototype.revert = function(context) {
  context.row.next = context._next;
  context.row.previous = context._previous;

  this._sheet.addRow(context.row);

  var self = this;

  // relive the cells
  forEach(context._cells, function(cell) {
    self._sheet.setCellContent({column: cell.column, row: context.row, content: cell.content});
  });
};

},{"95":95}],244:[function(_dereq_,module,exports){
'use strict';

/**
 * A handler that implements reversible addition of rows.
 *
 * @param {sheet} sheet
 */
function EditCellHandler(sheet) {
  this._sheet = sheet;
}

EditCellHandler.$inject = [ 'sheet' ];

module.exports = EditCellHandler;



////// api /////////////////////////////////////////


/**
 * Edits the content of the cell
 *
 * @param {Object} context
 */
EditCellHandler.prototype.execute = function(context) {
  context.oldContent = this._sheet.getCellContent(context);
  this._sheet.setCellContent(context);
  return context;
};


/**
 * Undo Edit by resetting the content
 */
EditCellHandler.prototype.revert = function(context) {
  this._sheet.setCellContent({row: context.row, column: context.column, content: context.oldContent});
  return context;
};

},{}],245:[function(_dereq_,module,exports){
'use strict';

/**
 * A handler that implements reversible editing of the table name.
 *
 * @param {tableName} tableName
 */
function EditNameHandler(tableName) {
  this._tableName = tableName;
}

EditNameHandler.$inject = [ 'tableName' ];

module.exports = EditNameHandler;



////// api /////////////////////////////////////////


/**
 * Edits the table name
 *
 * @param {Object} context
 */
EditNameHandler.prototype.execute = function(context) {
  context.oldName = this._tableName.getName();
  this._tableName.setName(context.newName);
  return context;
};


/**
 * Undo Edit by resetting the content
 */
EditNameHandler.prototype.revert = function(context) {
  this._tableName.setName(context.oldName);
  return context;
};

},{}],246:[function(_dereq_,module,exports){
'use strict';

/**
 * A handler that implements reversible move of columns
 *
 * @param {sheet} sheet
 */
function MoveColumnHandler(sheet) {
  this._sheet = sheet;
}

MoveColumnHandler.$inject = [ 'sheet' ];

module.exports = MoveColumnHandler;



////// api /////////////////////////////////////////


/**
 * Move a column
 *
 * @param {Object} context
 */
MoveColumnHandler.prototype.execute = function(context) {

  context.previousRight = context.source.next;
  this._sheet.moveColumn(context.source, context.target, context.left);

};


/**
 * Undo move
 *
 * @param {Object} context
 */
MoveColumnHandler.prototype.revert = function(context) {
  if(context.previousRight) {
    // if it had a column below previously, we can move it back there again
    this._sheet.moveColumn(context.source, context.previousRight, true);
  } else {
    // if it was the last column before moving it, move it back there again
    this._sheet.moveColumn(context.source, this._sheet.getLastColumn(), false);
  }
};

},{}],247:[function(_dereq_,module,exports){
'use strict';

/**
 * A handler that implements reversible move of rows
 *
 * @param {sheet} sheet
 */
function MoveRowHandler(sheet) {
  this._sheet = sheet;
}

MoveRowHandler.$inject = [ 'sheet' ];

module.exports = MoveRowHandler;



////// api /////////////////////////////////////////


/**
 * Move a row
 *
 * @param {Object} context
 */
MoveRowHandler.prototype.execute = function(context) {

  context.previousBelow = context.source.next;
  this._sheet.moveRow(context.source, context.target, context.above);

};


/**
 * Undo move
 *
 * @param {Object} context
 */
MoveRowHandler.prototype.revert = function(context) {
  if(context.previousBelow) {
    // if it had a row below previously, we can move it back there again
    this._sheet.moveRow(context.source, context.previousBelow, true);
  } else {
    // if it was the last row before moving it, move it back there again
    this._sheet.moveRow(context.source, this._sheet.getLastRow('body'), false);
  }
};

},{}],248:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(53),
    _dereq_(220),
    _dereq_(57),
    _dereq_(258)
  ],
  __init__: [ 'modeling' ],
  modeling: [ 'type', _dereq_(238) ]
};

},{"220":220,"238":238,"258":258,"53":53,"57":57}],249:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(95),
    assign = _dereq_(182),
    domDelegate = _dereq_(192),
    domify = _dereq_(193),
    domClasses = _dereq_(191),
    domAttr = _dereq_(190),
    domRemove = _dereq_(197);


var DATA_REF = 'data-id';

/**
 * A popup menu that can be used to display a list of actions.
 *
 * {@link PopupMenu#open} is used to create and open the popup menu.
 * With {@link PopupMenu#update} it is possible to update certain entries in the popup menu
 * (see examples below).
 *
 * @example
 *
 * // create a basic popup menu
 * popupMenu.open(
 *   {
 *     position: { x: 100, y: 100 },
 *     entries: [
 *       {
 *         id: 'entry-1',
 *         label: 'Entry 1',
 *         action: function(event, entry) {
 *           // do some stuff
 *         }
 *       },
 *       {
 *         id: 'entry-2',
 *         label: 'Entry 2'
 *       }
 *     ]
 *   }
 * );
 *
 * // create a more complex popup menu
 * popupMenu.open({
 *   position: { x: 100, y: 100 },
 *   entries: [
 *     {
 *       id: 'entry-1',
 *       label: 'Entry 1',
 *       action: function(event, entry) {
 *         if (entry.active) {
 *           // Removes the HTML class 'active' from the entry div, if it is clicked.
 *           popupMenu.update(entry, { active: false });
 *         } else {
*           // Adds the HTML class 'active' from the entry div, if it is clicked.
 *           popupMenu.update(entry, { active: true });
 *         }
 *       }
 *     }
 *   ]
 * });
 *
 * // With popupMenu.update() it is possbile to update a certain entry by id.
 * // This functionality can be used to add the HTML classes 'active' or
 * // 'disabled' to a certain entry div element. This can be useful in action
 * // handler functions (see complex example above).
 * popupMenu.update('header-entry-a', { active: true });
 * popupMenu.update('header-entry-a', { disabled: true });
 *
 * // It is also possible to remove these classes:
 * popupMenu.update('header-entry-a', { active: false });
 * popupMenu.update('header-entry-a', { disabled: false });
 *
 *
 * @param {EventBus} eventBus
 * @param {Sheet} sheet
 *
 * @class
 * @constructor
 */
function PopupMenu(eventBus, sheet) {

  this._eventBus = eventBus;
  this._sheet  = sheet;

  var self = this;
  this._eventBus.on('table.scroll', function(event) {
    self.close();
  });
}

PopupMenu.$inject = [ 'eventBus', 'sheet' ];


/**
 * Creates the popup menu, adds entries and attaches it to the DOM.
 *
 * @param {Object} menu
 * @param {Object} menu.position
 * @param {String} [menu.className] a custom HTML class name for the popup menu
 *
 * @param {Array.<Object>} menu.entries
 * @param {String} menu.entries[].id
 * @param {String} menu.entries[].content Either an embedded entries array or an object describing the entry
 * @param {String} menu.entries[].content.label
 * @param {String} [menu.entries[].content.className] a custom HTML class name for the entry div element
 * @param {Object} [menu.entries[].content.action] a handler function that will be called on a click on the entry
 *
 * @return {PopupMenu}
 */
PopupMenu.prototype.open = function(menu) {

  var className = menu.className || 'tjs-menu',
      position = menu.position,
      entries = menu.entries;

  if (!position) {
    throw new Error('the position argument is missing');
  }

  if (!entries) {
    throw new Error('the entries argument is missing');
  }

  // make sure, only one popup menu is open at a time
  if (this.isOpen()) {
    this.close();
  }

  var //sheet = this._sheet,
      parent = document.body, //sheet.getContainer(),
      container = this._createContainer(className, position);

  this._createEntries(entries, container);

  this._attachContainer(container, parent);

  this._current = {
    container: container,
    menu: menu
  };

  this._eventBus.fire('popupmenu.open', this._current);

  return this;
};


/**
 * Removes the popup menu and unbinds the event handlers.
 */
PopupMenu.prototype.close = function() {

  if (!this.isOpen()) {
    return;
  }

  this._eventBus.fire('popupmenu.close', this._current);

  domRemove(this._current.container);
  this._current = null;
};


/**
 * Determines, if an open popup menu exist.
 * @return {Boolean}
 */
PopupMenu.prototype.isOpen = function() {
  return !!this._current;
};


/**
 * Trigger an action associated with an entry.
 *
 * @param {Object} event
 */
PopupMenu.prototype.trigger = function(event) {

  // silence other actions
  event.preventDefault();

  var element = event.delegateTarget || event.target,
      entryId = domAttr(element, DATA_REF);

  var entry = this._getEntry(entryId);

  if (entry.action) {
    return entry.action.call(null, event, entry);
  }
};


/**
 * Updates the attributes of an entry instance.
 *
 * The properties `active` and `disabled` will be added to entries as class names.
 * This allows for state specific styling.
 *
 * @example
 *
 * popupMenu.update('header-entry-a', { active: true });
 * popupMenu.update('header-entry-a', { disabled: true });
 *
 * @param  {String|Object} entry the id of an entry or the entry instance itself
 * @param  {Object} updatedAttrs an object with the attributes that will be updated
 */
PopupMenu.prototype.update = function(entry, updatedAttrs) {

  if (typeof entry === 'string') {
    entry = this._getEntry(entry);
  }

  assign(entry, updatedAttrs);

  // redraw the menu by reopening it
  this.open(this._current.menu);
};


/**
 * Gets an entry instance (either entry or headerEntry) by id.
 *
 * @param  {String} entryId
 *
 * @return {Object} entry instance
 */
PopupMenu.prototype._getEntry = function(entryId) {

  var menu = this._current.menu;

  var searchFct = function(haystack, needle) {
    for(var i = 0; i < haystack.length; i++) {
      if (haystack[i].id === needle) {
        return haystack[i];
      }
      if (haystack[i].content.entries) {
        var found = searchFct(haystack[i].content.entries, needle);
        if (found) {
          return found;
        }
      }
    }
  };
  var entry = searchFct(menu.entries, entryId);

  if (!entry) {
    throw new Error('entry not found');
  }

  return entry;
};


/**
 * Creates the popup menu container.
 *
 * @param {String} event
 * @param {Object} position
 */
PopupMenu.prototype._createContainer = function(className, position) {
  var container = domify('<nav class="tjs-context-menu">');

  assign(container.style, {
    position: 'absolute',
    left: position.x + 'px',
    top: position.y  + 'px'
  });

  domClasses(container).add(className);

  return container;
};


/**
 * Attaches the container to the DOM and binds the event handlers.
 *
 * @param {Object} container
 * @param {Object} parent
 */
PopupMenu.prototype._attachContainer = function(container, parent) {
  var self = this;

   // Event handler
  domDelegate.bind(container, '.tjs-entry' ,'click', function(event) {
    self.trigger(event);
  });

  // Prevent default for mousedown events (so that selection does not get lost)
  domDelegate.bind(container, '.tjs-entry' ,'mousedown', function(event) {
    event.preventDefault();
  });
  // Attach to DOM
  parent.appendChild(container);
};


/**
 * Creates and attaches entries to the popup menu.
 *
 * @param {Array<Object>} entries an array of entry objects
 * @param {Object} container the parent DOM container
 * @param {String} className the class name of the entry container
 */
PopupMenu.prototype._createEntries = function(entries, container) {

  var entriesContainer = domify('<ul class="tjs-dropdown-menu">'),
      self = this;

  forEach(entries, function(entry) {
    self._createEntry(entry, entriesContainer);
  });

  // domClasses(entriesContainer).add('tjs-dropdown-menu');

  container.appendChild(entriesContainer);
};


/**
 * Creates a single entry and attaches it to the specified DOM container.
 *
 * @param  {Object} entry
 * @param  {Object} container
 */
PopupMenu.prototype._createEntry = function(entry, container) {

    if (!entry.id) {
      throw new Error ('every entry must have the id property set');
    }

    var entryContainer = domify('<li class="tjs-entry">'),
        entryClasses = domClasses(entryContainer),
        link = domify('<a>'),
        linkClasses = domClasses(link);

    entryContainer.appendChild(link);

    if (entry.content.className) {
      entryClasses.add(entry.content.className);
    }
    if (entry.content.linkClass) {
      linkClasses.add(entry.content.linkClass);
    }

    domAttr(entryContainer, DATA_REF, entry.id);

    // icon
    var icon = domify('<span class="tjs-icon">'),
        iconClasses = domClasses(icon);

    if (entry.content.icon) {
      iconClasses.add(entry.content.icon);
    }
    link.appendChild(icon);

    // label
    var label = domify('<span class="tjs-label">');
    link.appendChild(label);


    if (entry.content.entries) {
      // create a nested menu
      label.textContent = entry.content.label;
      entryClasses.add('tjs-dropdown');
      this._createEntries(entry.content.entries, entryContainer);
    } else {
      // create a normal entry
      if (entry.content.label) {
        label.textContent = entry.content.label;
      }

      if (entry.content.imageUrl) {
        entryContainer.appendChild(domify('<img src="' + entry.content.imageUrl + '" />'));
      }

      if (entry.content.active === true) {
        entryClasses.add('active');
      }

      if (entry.content.disabled === true) {
        entryClasses.add('disabled');
      }

    }

    container.appendChild(entryContainer);
};


module.exports = PopupMenu;

},{"182":182,"190":190,"191":191,"192":192,"193":193,"197":197,"95":95}],250:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: [ 'popupMenu' ],
  popupMenu: [ 'type', _dereq_(249) ]
};

},{"249":249}],251:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);

function DragRenderer(
    eventBus,
    utilityColumn) {

  eventBus.on('cell.render', function(event) {
    if (event.data.column === utilityColumn.getColumn() && !event.data.row.isFoot && !event.data.row.isHead) {
      domClasses(event.gfx).add('draggable');
    }
  });
}

DragRenderer.$inject = [
  'eventBus',
  'utilityColumn'
];

module.exports = DragRenderer;

},{"191":191}],252:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(193);
var domClasses = _dereq_(191);

var DRAG_THRESHOLD = 10;

function RowDrag(eventBus, sheet, elementRegistry, modeling) {

  this._sheet = sheet;
  this._elementRegistry = elementRegistry;
  this._utilityColumn = null;
  this._modeling = modeling;

  var self = this;

  eventBus.on('utilityColumn.added', function(event) {
    var column = event.column;
    self._utilityColumn = column;
  });

  this.dragDistance = 0;
  this.draggedElement = null;
  this.previousCoordinates = {
    x: 0,
    y: 0
  };
  this.highlightedBorder = null;
  this.moveAbove = false;

  eventBus.on('element.mousedown', function(event) {
    if(event.element.column === self._utilityColumn) {
      event.preventDefault();
      self.startDragging(event.element.row);
      self.setLastDragPoint(event.originalEvent);
    }
  });
  document.body.addEventListener('mouseup', function(event) {
    if(self.isDragging()) {
      self.stopDragging();
    }
  });
  document.body.addEventListener('mousemove', function(event) {
    if(self.isDragging()) {
      event.preventDefault();
      self.updateDragDistance(event);
      if(self.dragDistance > DRAG_THRESHOLD) {
        self.updateVisuals(event);
      }
    }
  });
}

RowDrag.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'modeling' ];

module.exports = RowDrag;

RowDrag.prototype.setLastDragPoint = function(event) {
  this.previousCoordinates.x = event.clientX;
  this.previousCoordinates.y = event.clientY;
};

RowDrag.prototype.updateVisuals = function(event) {

  if(!this.dragVisual) {
    this.dragVisual = this.createDragVisual(this.draggedElement);
  }

  var container = this._sheet.getContainer();
  container.appendChild(this.dragVisual);

  this.dragVisual.style.position = 'fixed';
  this.dragVisual.style.left = (this.previousCoordinates.x + 5) + 'px';
  this.dragVisual.style.top = (this.previousCoordinates.y + 5) + 'px';

  // clear the indicator for the previous run
  if(this.highlightedBorder) {
    domClasses(this.highlightedBorder).remove('drop');
    domClasses(this.highlightedBorder).remove('above');
    domClasses(this.highlightedBorder).remove('below');
    this.highlightedBorder = null;
  }

  // get the element we are hovering over
  var tr = event.target;
  while(tr && (tr.tagName || '').toLowerCase() !== 'tr') {
    tr = tr.parentNode;
  }
  if(tr) {
    // tr must be child of tbody
    if(this._sheet.getBody().contains(tr)) {
      // check if we hover over the top or the bottom half of the row
      var e = tr;
      var offset = {x:0,y:0};
      while (e)
      {
          offset.x += e.offsetLeft;
          offset.y += e.offsetTop;
          e = e.offsetParent;
      }
      if(event.clientY < offset.y + tr.clientHeight / 2) {
        domClasses(tr).add('drop');
        domClasses(tr).add('above');
        this.moveAbove = true;
      } else {
        domClasses(tr).add('drop');
        domClasses(tr).add('below');
        this.moveAbove = false;
      }
      this.highlightedBorder = tr;
    }
  }
};

RowDrag.prototype.updateDragDistance = function(event) {
  this.dragDistance +=
      Math.abs(event.clientX - this.previousCoordinates.x) +
      Math.abs(event.clientY - this.previousCoordinates.y);

  this.setLastDragPoint(event);
};

RowDrag.prototype.startDragging = function(element) {
  this.draggedElement = element;
  this.dragDistance = 0;

  this.dragVisual = null;
};

RowDrag.prototype.createDragVisual = function(element) {
  // get the html representation of the row
  var gfx = this._elementRegistry.getGraphics(element);

  // create a clone
  var clone = gfx.cloneNode(true);

  // fix the line number field width
  clone.firstChild.setAttribute('class', 'hit number');

  // put it in a table tbody
  var table = domify('<table><tbody></tbody></table>');
  table.setAttribute('class','dragTable');
  table.firstChild.appendChild(clone);

  // fade the original element
  domClasses(gfx).add('dragged');

  return table;
};

RowDrag.prototype.stopDragging = function() {
  if(this.highlightedBorder) {
    // make sure we drop it to the element we have previously highlighted
    var targetElement = this._elementRegistry.get(this.highlightedBorder.getAttribute('data-element-id'));
    this._modeling.moveRow(this.draggedElement, targetElement, this.moveAbove);
  }
  if(this.dragVisual) {
    this.dragVisual.parentNode.removeChild(this.dragVisual);
    // restore opacity of the element
    domClasses(this._elementRegistry.getGraphics(this.draggedElement)).remove('dragged');
    this._elementRegistry.getGraphics(this.draggedElement).style.opacity = '';
  }
  if(this.highlightedBorder) {
    domClasses(this.highlightedBorder).remove('drop');
    domClasses(this.highlightedBorder).remove('above');
    domClasses(this.highlightedBorder).remove('below');
    this.highlightedBorder = null;
  }

  this.draggedElement = null;
};

RowDrag.prototype.isDragging = function() {
  return !!this.draggedElement;
};

},{"191":191,"193":193}],253:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'rowDrag', 'dragRenderer' ],
  __depends__: [
    _dereq_(258)
  ],
  rowDrag: [ 'type', _dereq_(252) ],
  dragRenderer: [ 'type', _dereq_(251) ]
};

},{"251":251,"252":252,"258":258}],254:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(193);

/**
 * Adds a header to the table containing the table name
 *
 * @param {EventBus} eventBus
 */
function TableName(eventBus, sheet, tableName) {

  this.tableName = tableName;

  this.node = domify('<header><h3 class="tjs-table-name">'+this.tableName+'</h3></header>');

  var self = this;
  eventBus.on('sheet.init', function(event) {
    sheet.getContainer().insertBefore(self.node, sheet.getRootElement());
    eventBus.fire('tableName.init', {node: self.node.querySelector('h3')});
  });
  eventBus.on('sheet.destroy', function(event) {
    sheet.getContainer().removeChild(self.node);
    eventBus.fire('tableName.destroy', {node: self.node.querySelector('h3')});
  });
}

TableName.$inject = [ 'eventBus', 'sheet', 'config.tableName' ];

module.exports = TableName;

TableName.prototype.setName = function(newName) {
  this.tableName = newName;
  this.node.querySelector('h3').textContent = newName;
};

TableName.prototype.getName = function() {
  return this.tableName;
};

TableName.prototype.getNode = function() {
  return this.node.querySelector('h3');
};

},{"193":193}],255:[function(_dereq_,module,exports){
'use strict';

/**
 * Adds a dedicated column to the table dedicated to hold controls and meta information
 *
 * @param {EventBus} eventBus
 */
function UtilityColumn(eventBus, sheet) {

  // add the row control row
  this.column = null;
  var self = this;
  eventBus.on('sheet.init', function(event) {

    eventBus.fire('utilityColumn.add', event);

    self.column = sheet.addColumn({
      id: 'utilityColumn'
    });

    eventBus.fire('utilityColumn.added', {column: self.column});
  });
  eventBus.on('sheet.destroy', function(event) {

    eventBus.fire('utilityColumn.destroy', {column: self.column});

    sheet.removeColumn({
      id: 'utilityColumn'
    });

    eventBus.fire('utilityColumn.destroyed', {column: self.column});
  });
}

UtilityColumn.$inject = [ 'eventBus', 'sheet' ];

module.exports = UtilityColumn;


UtilityColumn.prototype.getColumn = function() {
  return this.column;
};

},{}],256:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(191);

function UtilityColumnRenderer(
    eventBus,
    utilityColumn) {

  eventBus.on('cell.render', function(event) {
    if (event.data.column === utilityColumn.getColumn() && !event.data.row.isFoot) {
      event.gfx.childNodes[0].textContent = event.data.content;
      domClasses(event.gfx).add(event.data.row.isHead ? 'hit' : 'number');
    }
  });
}

UtilityColumnRenderer.$inject = [
  'eventBus',
  'utilityColumn'
];

module.exports = UtilityColumnRenderer;

},{"191":191}],257:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(87);

var RuleProvider = _dereq_(55);

/**
 * LineNumber specific modeling rule
 */
function UtilityColumnRules(eventBus, utilityColumn) {
  RuleProvider.call(this, eventBus);

  this._utilityColumn = utilityColumn;
}

inherits(UtilityColumnRules, RuleProvider);

UtilityColumnRules.$inject = [ 'eventBus', 'utilityColumn' ];

module.exports = UtilityColumnRules;

UtilityColumnRules.prototype.init = function() {
  var self = this;
  this.addRule('cell.edit', function(context) {
    if (context.column === self._utilityColumn.getColumn()) {
      return false;
    }
  });

};

},{"55":55,"87":87}],258:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'utilityColumn', 'utilityColumnRules', 'utilityColumnRenderer' ],
  __depends__: [
    _dereq_(57)
  ],
  utilityColumn: [ 'type', _dereq_(255) ],
  utilityColumnRules: [ 'type', _dereq_(257) ],
  utilityColumnRenderer: [ 'type', _dereq_(256) ]
};

},{"255":255,"256":256,"257":257,"57":57}],259:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(182),
    inherits = _dereq_(87);

function Base() {
  Object.defineProperty(this, 'businessObject', {
    writable: true
  });
}

function Table() {
  Base.call(this);
}

inherits(Table, Base);

function Row() {
  Base.call(this);
}

inherits(Row, Base);

function Column() {
  Base.call(this);
}

inherits(Column, Base);


var types = {
  table: Table,
  row: Row,
  column: Column
};

/**
 * Creates a new model element of the specified type
 *
 * @method create
 *
 * @example
 *
 * var shape1 = Model.create('shape', { x: 10, y: 10, width: 100, height: 100 });
 * var shape2 = Model.create('shape', { x: 210, y: 210, width: 100, height: 100 });
 *
 * var connection = Model.create('connection', { waypoints: [ { x: 110, y: 55 }, {x: 210, y: 55 } ] });
 *
 * @param  {String} type lower-cased model name
 * @param  {Object} attrs attributes to initialize the new model instance with
 *
 * @return {Base} the new model instance
 */
module.exports.create = function(type, attrs) {
  var Type = types[type];
  if (!Type) {
    throw new Error('unknown type: <' + type + '>');
  }
  return assign(new Type(), attrs);
};


module.exports.Table = Table;
module.exports.Row = Row;
module.exports.Column = Column;

},{"182":182,"87":87}]},{},[1])(1)
});
//# sourceMappingURL=dmn-modeler.js.map