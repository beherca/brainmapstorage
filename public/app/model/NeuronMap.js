Ext.define('AM.model.NeuronMap', {
  extend : 'Ext.data.Model',
  //why use _id?
  idProperty : '_id',
  
  fields : [ {
    name : '_id',
    type : 'string'
  }, {
    name : 'name',
    type : 'string'
  }, {
    name : 'mapsdata',
    type : 'string'
  }, {
    name : 'updatetime',
    type : 'date'
  }, {
    name : 'archived',
    type : 'boolean'
  } ]
});