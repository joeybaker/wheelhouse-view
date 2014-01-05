'use strict';

var Backbone = require('backbone')
  , _ = require('lodash')
  , viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events', 'parent']
require('jquery-queue')

module.exports = Backbone.View.extend({
  views: []
  , children: {}
  , data: {}
  , _rendered: false
  // override default configure
  , _configure: function(options) {
    // 'parent' is added
    if (this.options) options = _.extend({}, _.result(this, 'options'), options)
    _.extend(this, _.pick(options, viewOptions))
    this.options = options
  }
  , render: function(){
    var data = this.model
      ? this.model.toJSON()
      : this.collection
        ? this.collection.toJSON()
        : {}

    if (window._user) _.extend(data, {_user: window._user})

    this.$el.html(this.template(_.extend(data, this._callWithOptions('data'))))

    this.children = {}
    if (this.collectionItem) this.addAll(_(this.collection.filter(this._callWithOptions('collectionFilter'))))
    this.renderViews()
    this._rendered = true

    if (this.postRender) this.postRender()
    this.trigger('rendered')

    // call the remove method on the remove event to unbind events
    this.once('remove', this._remove, this)

    return this
  }
  , renderViews: function(){
    // determine if views is not an array for backward compatibility
    if (_.isArray(this.views)) {
      _.each(this.views, function(options, index){
        this.renderSubView.call(this, index, options)
      }, this)
    }
    // TODO: deprecate this path
    else {
      _.each(this.views, function(options, name){
        // no need to pass the options because we're using the defaults
        this.renderView(name)
      }, this)
    }
  }
  , renderSubView: function(index, options){
    var view = this.children[index] = this._configView(index, options)
    return view.render()
  }
  // TODO: deprecate this in favor of renderSubView
  , renderView: function(name, options){
    var view = this._setupView(name, options)
    this.children[name] = view
    return view.render()
  }
  // TODO: create lodash mixin
  // like lodash `_.result()`, but can pass arguments
  // args can be a single argument, or an array for multiple arguments
  , _resultWithArgs: function(object, property, args, context){
    var value = object ? object[property] : undefined
    args = !_.isArray(args) ? [args] : args

    return _.isFunction(value) ? object[property].apply(context || object, args) : value;
  }
  , _callWithOptions: function(attr){
    return this._resultWithArgs(this, attr, this.options)
  }
  , _configView: function(index, options){
    // build the view config. Default to the passed in options, then to the options defined in the view array, then to the view's options object, then to defaults that every subview needs.
    var config = _.defaults(
      {}
      // if options is a function, call it with our requested options and the default options of the view
      , this._resultWithArgs(
        this.views
        , index
        , _.defaults({}, options, this.options)
        , this
      ) || {}
      // add in the view default options
      , _.omit(this.options, function(value){
        return _(viewOptions).indexOf(value) < 0
      })
      // add in defaults that sub views need.
      , {
        collection: this.collection
        , model: this.model
        , parent: this
      }
    )

    if (config.el) config.el = this.$(config.el)

    return new (require('views/' + config.view))(config)
  }
  // boilerplate to init a new child view from the `views` config object
  // TODO: deprecate this in favor of _configView
  , _setupView: function(name, options){
    var View = require('views/' + name)
      // get the original options for the view
      , origOptions = this._resultWithArgs(this.views, name, _.extend({}, this.options, options || {}), this)
      // get the options
      , opts = _.defaults(options || {}
        , origOptions
        , {
          collection: this.collection
          , model: this.model
        }
      )

    if (opts.el) opts.el = this.$(opts.el)
    opts.parent = this

    return new View(opts)
  }
  , _remove: function(){
    this.stopListening()
    // unbind all events
    // no need to rm dom elements b/c they should all be children of this element
    this._rendered = false

    if (_.size(this.children) || this.children.length)
      _.each(this.children, function(view){
        view.stopListening()
        view.trigger('remove')
      })
    if (this.collectionChildren && this.collectionChildren.length)
      _.each(this.collectionChildren, function(view){
        view.stopListening()
        view.trigger('remove')
      })
  }
  , remove: function(){
    this.$el.remove()
    this._remove()
    return this
  }
  , removeInner: function(){
    this.$el.html('')
    this._remove()
    return this
  }
  , addOne: function(model){
    var name = _.keys(this.collectionItem)[0]
      , options = _.isFunction(this.collectionItem[name])
        ? _.defaults({model: model}, this.collectionItem[name].call(this, _.extend(this.options, {model: model})))
        : _.extend({model: model}, this.collectionItem[name])
      , view = this._setupView(name, options)

    this.collectionChildren.push(view)
    return view
  }
  , addAll: function(collection){
    var list = this.$(this.collectionContainer)
      , listContent = document.createDocumentFragment()

    // if the collectionContainer wasn't defined, just use the el
    if (list.length === 0) list = this.$el

    collection = collection || this.collection

    // unbind all the events from children
    _.each(this.collectionChildren, function(child){
      child.stopListening()
    })
    // remove all the collectionChildren
    this.collectionChildren = []
    // render the children
    collection.each(function(model){
      listContent.appendChild(this.addOne(model).render().el)
    }, this)
    // clear the HTML and add our fragment
    list.html('')[0].appendChild(listContent)
  }
  // two ways to call this either save(attr, value) or save(event)
  , save: function(e, val){
    var attr = val ? e : e.target.name
      , value = val || e.target.value
      , orig = this.model.get(attr)

    // ensure this is a new value unless it's an object, in which case, just save it b/c a check is complex
    if (orig !== value || _.isObject(orig)) this.model.save(attr, value, {
      queue: _.result(this.model, 'url')
    })
  }
  , deferedSave: _.throttle(function(e){
    this.save(e)
  }, 2000, {trailing: true, leading: false})
  , textareaAutoresize: function(e){
    var el = e.target
      , offset = el.offsetHeight - el.clientHeight

    el.style.height = 'auto'
    el.style.height = (el.scrollHeight  + offset ) + 'px'
  }
})
