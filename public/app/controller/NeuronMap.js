Ext.define('AM.controller.NeuronMap', {
  extend : 'Ext.app.Controller',

  models : [ 'NeuronMap' ],

  stores : [ 'NeuronMaps' ],

  view : [ 'neuronmap.NeuronMap', 'neuronmap.NeuronMapList' ],

  refs : [ {
    ref : 'list',
    selector : 'neuronmaplist'
  }, {
    ref : 'designer',
    selector : 'neuronmapview'
  } ],

  init : function() {
    console.log('NeuronMap Controller Start OK');
    this.control({
      'neuronmapview' : {
        mapSave : this.saveMap,
        mapListShow : this.listMap
      },
      'neuronmaplist' : {
        mapAdd : this.addMap,
        mapDelete : this.deleteMap,
        mapEdit : this.editMap
      }
    });
  },
  
  editMap : function(evtData){
    var designer = this.getDesigner();
    designer.show();
    var store = this.getNeuronMapsStore();
    var record = store.getAt(evtData.rowIndex);
    if(record){
      designer.startEngine(record.get('mapsdata'), record.get('name'));
    }
    this.getList().hide();
  },
  
  deleteMap : function(evtData){
    var store = this.getNeuronMapsStore();
    var record = store.getAt(evtData.rowIndex);
    if(record) {
      store.remove(record);
      store.sync();
    }
  },

  listMap : function() {
    this.getList().show();
    this.getDesigner().hide();
  },

  addMap : function() {
    this.getList().hide();
    var designer = this.getDesigner();
    designer.clean();
    designer.show();
  },

  saveMap : function(data) {
//    console.log('saving map');
    var store = this.getNeuronMapsStore();
    var nJson = data.nJson;
//    console.log(nJson);
    store.add({
      name : data.name,
      mapsdata : nJson
    });
    store.sync();
  }
});