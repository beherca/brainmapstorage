Ext.define('AM.controller.World', {
  extend : 'Ext.app.Controller',

//  models : [ 'NeuronMap' ],

//  stores : [ 'NeuronMaps' ],

  view : [ 'world.World'],

  refs : [ {
    ref : 'world',
    selector : 'world'// xtype
  }],

  init : function() {
    console.log('World Controller Start OK');
    this.control({
      'world' : {
        pointAdd : this.add,
        update : this.update,
        remove : this.listMap
      }
    });
  },
  
  add : function(){
    console.log('add');
  },
  
  update : function(){
    console.log('update');
  }

});