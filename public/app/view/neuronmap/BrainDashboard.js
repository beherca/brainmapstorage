/**
 * This is the dashboard to monitor the neurons and synapse data
 */
Ext.define('AM.view.neuronmap.BrainDashboard', {
  extend : 'Ext.window.Window',
  alias : 'widget.braindashboard',

  requires : [ 'Ext.form.Panel' ],

  title : 'Brain Dashboard',
  layout : {
    type : 'border',
    border : 2
  },
  modal : true,
  autoShow : true,
  closeAction : 'destroy',
  
  height : 600,
  width : 1000,

  defaults : {
    split : true
  },
  
  neuronsMapView : null,

  initComponent : function() {
    var me = this;
    this.items = [ {
      xtype : 'panel',
      title : 'Settings',
      region : 'west',
      collapsible : true,
      flex : 1,
      layout : {
        type : 'vbox',
        align : 'stretch'
      },
      bodyPadding : '10 10 10 10',
      fieldDefaults : {
        labelAlign : 'top',
        labelWidth : 100,
        labelStyle : 'font-weight:bold'
      },
      
      items : [{
        xtype : 'form',
        layout : {
          type : 'vbox',
          align : 'stretch'
        },
        border : false,
        bodyPadding : 10,

        fieldDefaults : {
          labelAlign : 'top',
          labelWidth : 100,
          labelStyle : 'font-weight:bold'
        },
        items :[{
          xtype : 'numberfield',
          itemId : 'intervalTime',
          fieldLabel : 'Cortex Interval Time',
          value : 500,
          step : 100,
          allowBlank : false
        },{
          xtype : 'numberfield',
          itemId : 'decayRate',
          fieldLabel : 'Neuron Decay Rate',
          value : 0.5,
          step : 0.1,
          tooltip : 'it is about the short term memory of the creature',
          allowBlank : false
        },{
          xtype : 'numberfield',
          itemId : 'step',
          fieldLabel : 'synapse strength step',
          value : 0.1,
          step : 0.1,
          tooltip : 'it is about how easy the creature would be excited',
          allowBlank : false
        }, {
          xtype : 'numberfield',
          itemId : 'wIntTime',
          fieldLabel : 'World Interval Time',
          value : 300,
          step : 100,
          allowBlank : false
        }, {
          xtype : 'textfield',
          itemId : 'inputs',
          fieldLabel : 'Inputs Array',
          allowBlank : true
        }],
        dockedItems: [{
          xtype: 'toolbar',
          layout : {
            type : 'hbox',
            align : 'top'
          },
          dock: 'bottom',
          ui: 'footer',
          defaults: {minWidth: 45},
          items: [
            {
              text : 'Reset',
              handler : function() {
                var form = me.down('form').getForm();
                form.reset();
              } 
            },{
              text : 'Pause',
              handler : function() {
                me.pause();
              }
            },{
              text : 'Update',
              handler : function() {
                me.updateSettings();
              }
            }
          ]
        }]
      }],
    }, {
      xtype : 'dbcharts',
      region : 'center',
      flex : 4
    }];
    this.callParent(arguments);
  },

  updateSettings : function(){
    var me = this;
    var form = me.down('form').getForm();
    if (form.isValid()) {
      var vals = form.getValues();
      var txts = Object.keys(vals);
      var interval = parseFloat(vals[txts[0]]);
      var decayRate = parseFloat(vals[txts[1]]);
      var synapseStrength = parseFloat(vals[txts[2]]);
      var worldInterval = parseFloat(vals[txts[3]]);
      var inputs = '[' + vals[txts[4]] + ']';
      try{
        inputs = eval(inputs);
        if(!(inputs instanceof Array)){
          inputs = [];
        }
      }catch(e){
        console.log('Input error');
        inputs = [];
      }
      if(me.neuronsMapView){
        me.neuronsMapView.updateBrain(interval, decayRate, synapseStrength, worldInterval, inputs);
      }
    }
  },
  
  pause : function(){
    if(this.neuronsMapView){
      this.neuronsMapView.stopBrain();
    }
  },
  
  refresh : function(neurons){
    var dbchart = this.query('.dbcharts')[0];
    if(dbchart){
      dbchart.refresh(neurons);
    }
  }
});
