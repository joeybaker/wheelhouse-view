'use strict';
var Backbone = require('backbone')
  , _ = require('lodash')
require('jquery-queue')

module.exports = Backbone.View.extend({
  views: {}
  , children: {}
  , data: {}
  , _rendered: false
  // override default configure
  , _configure: function(options) {
    // 'parent' is added
    var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events', 'parent']
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

    this.undelegateEvents()
    this.$el.html(this.template(_.extend(data, this._callWithOptions('data'))))
    this.delegateEvents()

    this.renderViews()
    if (this.collectionItem) this.addAll(_(this.collection.filter(this._callWithOptions('collectionFilter'))))
    this._rendered = true
    this.trigger('rendered')
    
    if (this.postRender) this.postRender()

    return this
  }
  , renderViews: function(){
    _.each(this.views, function(opts, name){
      this.renderView(name)
    }, this)
  }
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
  // boilerplate to init a new child view from the `views` config object
  , _setupView: function(name, opts){
    var View = A.Views[name] = require('views/' + name)
      // get the options
      , origOptions = this.views[name]
      , options = _.defaults(
        opts || {}
        , _.isFunction(origOptions) ? origOptions.call(this, _.extend({}, this.options, opts || {})) : origOptions
        , {
          parent: this
          , collection: this.collection
          , model: this.model
        }
      )

    if (options.el) options.el = this.$(options.el)

    return new View(options)
  }
  , _remove: function(){
    this.stopListening()
    _.each(this.children, function(view){
      view.undelegateEvents()
      view.stopListening()
    })
    _.each(this.collecitonChildren, function(view){
      view.undelegateEvents()
      view.stopListening()
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
  // TODO: abstract out the item view, the collection container, and the itemView options
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
    var list = this.$(this.collectionContainer) || this.$el
      , listContent = document.createDocumentFragment()

    collection = collection || this.collection

    // unbind all the events from children
    _.each(this.collectionChildren, function(child){
      child.undelegateEvents()
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
  , save: function(e){
    var attr = e.target.name
      , value = e.target.value

    if (this.model.get(attr) !== value) this.model.save(attr, value, {
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
