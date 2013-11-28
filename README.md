wheelhouse-view
===============

Automagic for backbone views!

## Benefits

* no need to specify `View.render()` it's done for you, automatically passing in the collection as the context for the view, or the model if it's specified.
* need to render a whole collection? No problem!
* sub views!
* none of the default Backbone view attributes are overridden in a breaking way (with the exception of `render`), this just enhances the Backbone API.

## requirements
* browserify

## Usage

```js
// view.js
var View = require('wheelhouse-view')

module.exports = View.extend({
  el: 'body' // standard backbone el attr
  , template: require('template/path') // standard backbone template attr
  , events: {} // standard backbone events hash
  , views: [ // optional, useful if this view has subviews
    // sub views will be loaded by browserify's require()
    // the value can be an object or a function that returns an object that will be used as the view's options.
    {
      view: 'sub/view/name':
      , viewOption: 'some option you want to pass off to the child view'
    }
    , function(optionsOfThisView){
      return {
        view: 'another/sub/view'
      }
    }
  ]
  // collection attributes are optional, but can be used to output the view's collection
  , collectionContainer: '#list' // optional, if not specified, will use the view's el
  , collectionItem: {
    // same syntax as the views hash, but you can only have one key
    'path/to/list/item/view': {'viewOption': 'anything'}
  }
  , collectionFilter: function(options){
    // return a function that is passed to Backbone.Collection.filter
    return function(model) {
      return model.id !== null
    }
  }
  , postRender: function(){
    // completely optional. Ideally, you won't need this. But just in case there's something else you want to do to the poor view after it's been rendered.
  }
})

// router.js
var Backbone = require('backbone')
  , view = require('./view.js')

module.exports = Backbone.Router.extend({
  routes: {
    '/': 'home'
  }
  , home: function(){
    view.render()
  }
})

```

## Attributes

### `children`
Object that contains the all view's child views. Created for you after rendering.

### `collectionChildren`
Just like children, but separates out the `collectionItem` views if they were rendered.

### `collectionFilter(options)`
Return a function that will be used to filter the collection passed to `addAll`. Useful if you want to limit the models rendered to the collection.

### `views`
An array of sub views to render. Each array item is an object or a function that returns an object.

The object must contain a `view` key that is the path to the view. Views are assumed to be in a `views/` folder.

### `renderSubView(index[, options])` _replaces `renderView` in 0.2.0_
Useful if you need to manually render a view from the views array.
* `index` is the index of the view you want to render from the `views` array.
* `options` is optional, and will override any of the defaults setup in the `views` object.

### `renderView(name[, options])`  _deprecated in 0.2.0_
Useful if you need to manually render a view from the views object.
* `name` is the key from the name hash (and path to the view)
* `options` is optional, and will override any of the defaults setup in the `views` object

### `renderViews()`
Renders all the views in the `views` object. You probably don't need to call this.

### `addOne(model)`
Returns a `collectionItem` view that can be rendered.

### `addAll([collection])`
Renders the collection to the `collectionContainer` (or the view's `el` if that isn't specified), with the `collectionItem` view used for each item in the collection

### `removeInner()`
Like `remove()`, but leaves the view's `el` intact. Useful if you want to put something else into that DOM element. Triggers the `remove` event.

### `remove()`
Remove the `el` and detach all events. Triggers the `remove` event.

### `render()`
Renders the views specified in the `views` object, and renders out the collection if the `collectionItem` option has been specified.

### `postRender()`
Define a function that will be called after the view as rendered. Useful if you have custom logic, and a whole lot better than overriding the `render()` method.

### `parent`
Automatically created. A reference to the view's parent view, if it exists.

### `data`
Optional. Additional data to pass to the view. Can be an object or a function that returns an object.

### `save(jQueryEvent|[attr, value])`
Predefined method that can be used from an events hash to automatically save the value of that element to the model.

e.g. automatically save whenever an input's focus is lost:

```js
// view.js
  …
  events: {
    'blur [name]': 'save'
  }
```

```html
<input name="aModelAttribute" value="blank">
```

Or, you can manually call `save` with a attribute and value to save

```js
  this.save('color', 'red')
```

### `deferedSave(jQueryEvent)`
Same as `save()`, but only saves to the server every 2 seconds. Useful if you want your event to be `keyup`.

### `textareaAutoresize(jQueryEvent)`
Like it says on the tin. Pass it an event triggered from a textarea, and it will auto-resize to be the height of it's contents.

```js
…
  events: {
    'input textarea': 'textareaAutoresize'
  }

```

_via: [@phaistonian](http://phaistonian.pblogs.gr/expanding-textareas-the-easy-and-clean-way.html)_

## Tests
none yet. should be mocha tests.

## Changelog
### 0.2.4
* call the `_remove` method when the `remove` event is triggered
* set `_rendered` to `false` on `_remove`

### 0.2.0
* **breaking change** `views` must now be an array instead of an object

### 0.1.0 Init
