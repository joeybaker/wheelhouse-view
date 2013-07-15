'use strict';
var Backbone = require('backbone')
  , _ = require('lodash')


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
    if (this.postRender) this.postRender()

    this._rendered = true
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
  , _callWithOptions: function(attr){
    return _.isFunction(this[attr]) ? this[attr].call(this, this.options) : this[attr]
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
  , removeInner: function(){
    this.$el.html('')
    this.undelegateEvents()
    this.stopListening()
    return this
  }
  // TODO: abstract out the item view, the collection container, and the itemView options
  , addOne: function(model){
    var name = _.keys(this.collectionItem)[0]
      , options = _.isFunction(this.collectionItem[name])
        ? _.defaults({model: model}, this.collectionItem[name].call(this, _.extend({model: model}, this.options)))
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

})
