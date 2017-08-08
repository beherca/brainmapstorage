Ext.define('AM.store.NeuronMaps', {
    extend: 'Ext.data.Store',

    autoLoad: true,
    autoSync: false,
    
    fields: ['_id', 'name', 'mapsdata', 'updatetime', 'archived'],
    
    proxy: {
        type: 'rest',
        url: '/neuronmaps',
        model: 'AM.model.NeuronMap',
        reader: {
            type: 'json',
            root: 'data',
            successProperty: 'success'
        }
    }
});