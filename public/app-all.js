/*
Copyright(c) 2012 Bebeca
*/
Ext.define('AM.view.Viewport', {
    extend: 'Ext.container.Viewport',
    layout: 'fit',
    items: [{
      xtype : 'neuronmapview',
      hidden : true
    },{
      xtype : 'neuronmaplist'
    }]
});
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
STATE = {
  N : 'normal',
  /* Rollover and click */
  A : 'activated',
  /* Rollover without click */
  R : 'rollover',
  /*
   * During Dragging
   */
  D : 'drag'
};

Ext.define('AM.view.world.Object', {
  mixins : {
    observable : 'Ext.util.Observable'
  },

  iid : 0,
  x : 0,
  y : 0,
  z : 0,
  // sprite than under managing
  s : null,
  // text on object
  t : null,
  state : STATE.N,

  /**
   * description of this object, will show at side of neuron
   */
  text : '',

  showText : true,

  // svg surface component
  drawComp : null,

  constructor : function(config) {
    this.iid = Ext.isEmpty(this.iid) ? IID.get() : this.iid;
    Ext.apply(this, config);
    this.mixins.observable.constructor.call(this, config);
    this.addEvents([ 'onStateChange', 'onMove' ]);
    this.on('onStateChange', this.updateState);
    this.callParent(config);
    this.draw();
  },

  appendText : function(x, y) {
    var me = this;
    if (me.showText) {
      x = (Ext.isEmpty(x) ? (me.x) : x) + 10;
      y = Ext.isEmpty(y) ? me.y : y;
      var txt = !Ext.isEmpty(me.text) ? me.iid + "-" + me.text : me.iid;
      if (!Ext.isEmpty(me.drawComp)) {
        if (Ext.isEmpty(me.t)) {
          me.t = me.drawComp.surface.add({
            type : 'text',
            text : txt,
            fill : 'black',
            font : '14px "Lucida Grande", Helvetica, Arial, sans-serif;',
            x : x,
            y : y,
            zIndex : 201
          // one level up
          });
        } else {
          me.t.setAttributes({
            text : txt,
            x : x,
            y : y
          });
        }
        me.t.redraw();
      }
    }
  },

  draw : function() {
    var me = this;
    if (!Ext.isEmpty(me.drawComp)) {
      if (Ext.isEmpty(me.s)) {
        me.s = me.drawComp.surface.add({
          draggable : true,
          type : 'circle',
          fill : '#ff0000',
          // path : [ 'M', me.x - this.width/2, me.y - this.height - 10, 'l',
          // this.width, '0 l', -this.width/2, this.height * 0.7, 'z'].join('
          // '),
          radius : this.radius,
          x : me.x,
          y : me.y,
          zIndex : 100
        });
        me.registerListeners();
      } else {
        me.s.setAttributes({
          x : me.x,
          y : me.y
        });
      }
      me.s.redraw();
      me.appendText();
    }
  },

  registerListeners : function() {
    var me = this;
    if (Ext.isEmpty(me.s))
      return;
    // add custom method to Ext.draw.SpriteDD, after drop (actually an invalid
    // drop because there is no drop zone)
    if (me.s.dd) {
      me.s.dd.afterInvalidDrop = function(target, e, id) {
        // console.log('after drag over');
        me.updateXY();
        me.fireEvent('onMove', me);
      };
    }
    me.s.on('mouseover', function(sprite) {
      // console.log('mouseover');
      if (me.state == STATE.N) {
        me.fireEvent('onStateChange', STATE.R, me);
      }
    });
    me.s.on('mouseout', function(sprite) {
      // console.log('mouseout');
      if (me.state == STATE.R) {
        me.fireEvent('onStateChange', STATE.N, me);
      }
    });
    me.s.on('click', function(sprite) {
      // console.log('click');
      me.fireEvent('onStateChange', STATE.A, me);
    });
  },

  updateState : function(state) {
    var me = this;
    me.state = state;
    if (state == STATE.N) {
      if (state == STATE.N) {
        me.s.setAttributes({
          fill : '#ff0000',
          stroke : 'none'
        }, true);
        me.s.redraw();
      }
    } else if (state == STATE.A || state == STATE.R) {
      me.s.setAttributes({
        fill : '#ffff00',
        stroke : '#00ff00',
        style : {
          strokeWidth : 1
        }
      }, true);
      me.s.redraw();
    }
  },

  /**
   * This is called after dragging to update x y and redraw synapse
   */
  updateXY : function() {
    // console.log('update xy');
    this.s.x += this.s.attr.translation.x;
    this.s.y += this.s.attr.translation.y;
    this.s.setAttributes({
      x : this.s.x,
      y : this.s.y,
      translation : {
        x : 0,
        y : 0
      }
    });
    this.x = this.s.x;
    this.y = this.s.y;
    this.appendText();
  },

  destroy : function() {
    if (this.s) {
      this.s.destroy();
      this.s = null;
    }
    if (this.t) {
      this.t.destroy();
      this.t = null;
    }
    this.callParent(arguments);
  },

  /**
   * provide custom stringify
   * 
   * @returns
   */
  toJSON : function() {
    return JSON.stringify({
      iid : this.iid,
      x : this.x,
      y : this.y,
      z : this.z,
      state : this.state
    });
  }
});
/**
 * Binding data point and view point
 */
Ext.define('AM.view.world.Point', {
  extend : 'AM.view.world.Object',

  /**
   * the point is what current object binding to
   */
  point : null,

  syncPos : function() {
    this.x = this.point.x;
    this.y = this.point.y;
    this.draw();
  }
});

Ext.define('AM.view.world.Line', {
  extend : 'AM.view.world.Object',

  endX : 0,

  endY : 0,
  /**
   * the line is what current object binding to
   */
  line : null,

  /**
   * Override
   */
  draw : function() {
    var me = this;
    if (!Ext.isEmpty(me.drawComp)) {
      var sPath = [ 'M', me.x, me.y, 'L', me.endX, me.endY ].join(' ');
      if (Ext.isEmpty(me.s)) {
        me.s = me.drawComp.surface.add({
          type : 'path',
          fill : 'none',
          stroke : 'blue',
          path : sPath,
          x : me.x,
          y : me.y
        });
        me.registerListeners();
      } else {
        me.s.setAttributes({
          path : sPath,
          x : me.x,
          y : me.y
        });
      }
      me.s.redraw();
    }
  },
  
  /**
   * Override
   */
  updateState : function(state) {
    var me = this;
    me.state = state;
    if (state == STATE.N) {
      if (state == STATE.N) {
        me.s.setAttributes({
          stroke : 'blue',
          style : {
            strokeWidth : 1
          }
        }, true);
        me.s.redraw();
      }
    } else if (state == STATE.A || state == STATE.R) {
      me.s.setAttributes({
        stroke : 'red',
        style : {
          strokeWidth : 3
        }
      }, true);
      me.s.redraw();
    }
  },

  syncPos : function() {
    this.x = this.line.start.x;
    this.y = this.line.start.y;
    this.endX = this.line.end.x;
    this.endY = this.line.end.y;
    this.draw();
  }
});

/**
 * World is used to display the object data
 */
Ext.define('AM.view.world.World', {
  extend : 'Ext.panel.Panel',
  alias : 'widget.world',
  title : 'World',

  layout : {
    type : 'border',
    border : 2
  },

  world : null,

  iidor : null,

  worldTick : null,

  interval : 10,

  offset : OP.add(0, 0),

  showText : true,
  
  objs : {},

  initComponent : function() {
    var me = this;
    this.addEvents('modeChanged', 'addClick');
    me.iidor = new Iid();
    me.world = World.create({
      x : 0,
      y : 0,
      resistance : 0.1,
      gForce : Utils.cls.create(World.Force, {
        value : 3,
        direction : OP.add(10, 0)
      })
    });
    me.world.on('onAdd', me.addObject, this);
    me.items = [ {
      xtype : 'toolbar',
      title : 'bar',
      region : 'north',
      items : [ {
        text : 'Add',
        listeners : {
          click : function() {
            me.fireEvent('pointAdd');
          }
        }
      } ]
    }, {
      xtype : 'draw',
      region : 'center',
      itemId : 'drawpanel',
      orderSpritesByZIndex : true,
      viewBox : false,
      neuronmapview : me,
      listeners : {
        click : function(e, t, opts) {
          // console.log('draw panel click');
          // only happen when user click on the neruon object
          if (e.target instanceof SVGRectElement) {
            var box = me.down('draw').getBox();
            me.offset = OP.add(-box.x, -box.y);
            if (me.mode == MODE.NEURON) {

            }
          }
        }
      }
    } ];
    this.callParent(arguments);
  },

  afterRender : function() {
    this.callParent(arguments);
    this.start();
  },

  start : function() {
    console.log('start');
    var me = this;
    if (Ext.isEmpty(this.worldTick)) {
      this.worldTick = Ext.TaskManager.start({
        interval : me.interval,
        run : function() {
          me.world.tick();
          me.syncPos();
        }
      });
    } else {
      Ext.TaskManager.start(this.worldTick);
    }
  },

  stop : function() {
    console.log('stop');
    if (this.worldTick) {
      Ext.TaskManager.stop(this.worldTick);
    }
  },
  
  syncPos : function(){
    for(var i in this.objs){
      var obj = this.objs[i];
      obj.syncPos();
    }
  },

  addObject : function(obj) {
    if (Ext.isEmpty(obj) || Ext.isEmpty(obj.obj))
      return;
    if (obj.obj instanceof World.Line) {
      this.addLine(obj);
    } else {
      this.addPoint(obj);
    }
  },

  addLine : function(obj) {
    if (Ext.isEmpty(obj) || Ext.isEmpty(obj.obj) || !(obj.obj instanceof World.Line))
      return;
    var me = this, drawComp = me.down('draw');
    var line = obj.obj;
    var ln = Ext.create('AM.view.world.Line', {
      drawComp : drawComp,
      line : line,
      iid : line.iid,
      x : line.start.x,
      y : line.start.y,
      endX : line.end.x,
      endY : line.end.y
    });
    me.objs[ln.iid] = ln;
    line.on({
//      onMove : function(l) {
//        ln.syncPos();
//      },
      onDestroy : function(l) {
        delete me.objs[ln.iid];
        ln.destroy();
        ln = null;
      }
    });
  },

  addPoint : function(obj) {
    if (Ext.isEmpty(obj) || Ext.isEmpty(obj.obj) || !(obj.obj instanceof World.Point)
        || !obj.obj.visible)
      return;
    var point = obj.obj;
    var me = this, drawComp = me.down('draw');
    var bno = Ext.create('AM.view.world.Point', {
      drawComp : drawComp,
      x : point.x,
      y : point.y,
      radius : 5,
      iid : point.iid,
      point : point,
      text : point.text,
      showText : this.showText
    });
    me.objs[bno.iid] = bno;
    me.iidor.set(point.iid);
    point.on({
//      onMove : function(p) {
//        bno.syncPos();
//      },
      onDestroy : function(p) {
        bno.destroy();
        delete me.objs[bno.iid];
        bno = null;
      }
    });
    bno.on({
      'onMove' : function(n) {
        point.x = n.x + me.offset.x;
        point.y = n.y + me.offset.y;
      }
    });
    return bno;
  },

  destroy : function() {
    this.stop();
    this.callParent(arguments);
  }
});
Ext.define('AM.view.neuronmap.FocusManager', {
  mixins : {
    observable : 'Ext.util.Observable'
  },
  activated : null,
  activateds : [],
  eventType : 'onStateChange',

  /**
   * Single or Multiple single : only one object can be focus multiple : many
   * objects can be focus at same time
   */
  focusMode : 'Single',
  
  constructor : function(config) {
    Ext.apply(this, config);
    this.callParent(arguments);
    this.addEvents([ 'onAdd', 'onFocus', 'onUnfocus' ]);
  },
  /**
   * add object to manager for maintenance focus
   * 
   * @param obj
   */
  addFocusable : function(obj) {
    if (obj && obj.on) {
      obj.on(this.eventType, this.setfocus, this);
    }
  },

  setfocus : function(en, obj) {
    var me = this;
    if (obj.state == STATE.A) {// one neuron is activated
      if (this.focusMode = 'Single') {
        if (!Ext.isEmpty(me.activated) && me.activated != obj) {
          // change last obj back to Normal
          me.activated.updateState(STATE.N);
        }
        // obj already state == Activated
        me.activated = obj;
      }
    }
  },

  unfocus : function(obj) {
    var me = this;
    if (this.focusMode = 'Single') {
      if(me.obj){
        me.obj.updateState(STATE.N);
        me.obj = null;
      }
    }else{
      if(obj){
        //TODO find obj and set state to N
      }else{
        //TODO remove all focus by set activateds to normal state
      }
    }
    
  }
});

Ext.define('AM.view.neuronmap.BrainCharts', {
  
  extend : 'Ext.panel.Panel',
  alias : 'widget.dbcharts',

  requires : [ 'Ext.form.*', 'Ext.data.*', 'Ext.chart.*',
      'Ext.grid.Panel', 'Ext.layout.container.Column' ],
  title : 'Brain Data',
  bodyPadding : 5,
  width : 870,
  height : 720,
  
  defaults : {
    split : true
  },
  
  neuronData : [],
  
  ds : null,

  fieldDefaults : {
    labelAlign : 'left',
    msgTarget : 'side'
  },

  layout : {
    type : 'vbox',
    align : 'stretch'
  },

  initComponent : function() {
    // use a renderer for values in the data view.
    function perc(v) {
      return v + '%';
    }

    var selectedStoreItem = false,
    // performs the highlight of an item in the bar series
    selectItem = function(storeItem) {
      var name = storeItem.get('company'), series = barChart.series
          .get(0), i, items, l;

      series.highlight = true;
      series.unHighlightItem();
      series.cleanHighlights();
      for (i = 0, items = series.items, l = items.length; i < l; i++) {
        if (name == items[i].storeItem.get('company')) {
          selectedStoreItem = items[i].storeItem;
          series.highlightItem(items[i]);
          break;
        }
      }
      series.highlight = false;
    };
    
    // create data store to be shared among the grid and bar series.
    this.ds = Ext.create('Ext.data.ArrayStore', {
      fields : [ {
        name : 'iid'
      }, {
        name : 'output',
        type : 'float'
      }, {
        name : 'normalized',
        type : 'float'
      }, {
        name : 'axons',
        type : 'float'
      }],
      data : this.generate()
    });

    // create a grid that will list the dataset items.
    var gridPanel = Ext.create('Ext.grid.Panel', {
      id : 'brain-data-form',
      flex : 0.60,
      store : this.ds,
      title : 'Neurons Data',
      collapsible : true,
      columns : [ {
        id : 'iid',
        text : 'IID',
        flex : 1,
        sortable : true,
        dataIndex : 'iid'
      }, {
        text : 'Output',
        width : 75,
        sortable : true,
        dataIndex : 'output',
        flex : 10,
        align : 'right'
      }, {
        text : 'Normalized',
        width : 75,
        sortable : true,
        align : 'right',
        dataIndex : 'normalized'
      }, {
        text : 'Num. of Axons',
        width : 90,
        sortable : true,
        align : 'right',
        dataIndex : 'axons'
      }],

      listeners : {
        selectionchange : function(model, records) {
          if (records[0]) {
            rec = records[0];
          }
        }
      }
    });

    // create a bar series to be at the top of the panel.
    var barChart = null;
    barChart = Ext.create('Ext.chart.Chart', {
      flex : 1,
      shadow : true,
      animate : true,
      store : this.ds,
      axes : [ {
        type : 'Numeric',
        position : 'left',
        fields : [ 'output', 'normalized'],
        minimum : 0,
        hidden : false
      }, {
        type : 'Category',
        position : 'bottom',
        fields : [ 'iid' ],
        label : {
          renderer : function(v) {
            return Ext.String.ellipsis(v, 15, false);
          },
          font : '9px Arial',
          rotate : {
            degrees : 270
          }
        }
      } ],
      series : [ {
        type : 'column',
        axis : 'left',
        highlight : true,
        style : {
          fill : '#456d9f'
        },
        highlightCfg : {
          fill : '#a2b5ca'
        },
        label : {
          contrast : true,
          display : 'insideEnd',
          field : 'output',
          color : '#000',
          orientation : 'vertical',
          'text-anchor' : 'middle'
        },
        listeners : {
          'itemmouseup' : function(item) {
            var series = barChart.series.get(0), index = Ext.Array
                .indexOf(series.items, item), selectionModel = gridPanel
                .getSelectionModel();

            selectedStoreItem = item.storeItem;
            selectionModel.select(index);
          }
        },
        xField : 'iid',
        yField : [ 'output', 'normalized']
      }]
    });

    // disable highlighting by default.
    barChart.series.get(0).highlight = false;

    // add listener to (re)select bar item after sorting or refreshing
    // the
    // dataset.
    barChart.addListener('beforerefresh', (function() {
      var timer = false;
      return function() {
        clearTimeout(timer);
        if (selectedStoreItem) {
          timer = setTimeout(function() {
            selectItem(selectedStoreItem);
          }, 900);
        }
      };
    })());
    
    this.items = [{
      xtype : 'container',
      flex :2, 
      layout : 'fit',
      margin : '0 0 3 0',
      items : [ barChart ]
    }, {
      xtype : 'container',
      layout : {
        type : 'hbox',
        align : 'stretch'
      },
      flex : 1,
      border : false,
      bodyStyle : 'background-color: transparent',

      items : [ gridPanel]
    }];
    this.callParent(arguments);
  },
  
  refresh :function(neurons) {
//    console.log('refresh neurons data');
    this.ds.loadData(this.generate(neurons));
  },
  
  generate : function(neurons){
    if(Ext.isEmpty(neurons)){
      return [];
    }else{
      var data = [];
      var i = 0;
      for(; i < neurons.length ; i++){
        var n = neurons[i];
        var neuronRow = [n.iid, n.output, n.getNormalizedOutput(), n.axons.length];
        data.push(neuronRow);
      }
      return data;
    }
  }
  
});
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

MODE = {
  NORMAL : 'normal',
  NEURON : 'neurontoolactivated',
  SYNAPSE : 'synapsetoolactivated',
  SYNAPSE_R : 'synapsereverttoolactivated',
  DELETE : 'delete',
  INPUT : 'input',
  OUTPUT : 'output'
};

Ext.define('AM.view.neuronmap.Brain.Neuron', {
  extend : 'AM.view.world.Object',

  radius : 10,

  dendrites : null,

  // persistent
  axons : null,

  groupedPreNeurons : null,

  constructor : function(config) {
    Ext.apply(this, config);
    this.groupedPreNeurons = new Ext.util.HashMap();
    this.axons = new Ext.util.HashMap();
    this.dendrites = new Ext.util.HashMap();
    this.callParent(config);
  },
  
  updateXY : function(){
    this.callParent(arguments);
    this.updateSynapse();
  },

  /**
   * Add synapse as Axon
   * 
   * @param preNeuron
   * @param postNeuron
   * @returns
   */
  addAxonSynapse : function(postNeuron, mode, iid) {
    var me = this;
    var syn = Ext.create('AM.view.neuronmap.Brain.Synapse', {
      drawComp : me.drawComp,
      preNeuron : this,
      postNeuron : postNeuron,
      isInhibit : mode == MODE.SYNAPSE_R,
      iid : iid
    });
    me.axons.add(syn.iid, syn);
    postNeuron.addDendriteSynapse(syn);
    me.updateSynapse();
    return syn;
  },

  addDendriteSynapse : function(synapse) {
    this.dendrites.add(synapse.iid, synapse);
    // neuron that has grouped synapses.
    var neuron = null;
    if (this.groupedPreNeurons.containsKey(synapse.preNeuron.iid)) {
      // neuron here is actually an array.
      neuron = this.groupedPreNeurons.get(synapse.preNeuron.iid);
      neuron.push(synapse);
    } else {
      neuron = this.groupedPreNeurons.add(synapse.preNeuron.iid, [ synapse ]);
    }
    // for performance concern, dont call updateSynapse which will update all
    // synapses in dendrite and axon
    synapse.updateLevel(neuron.length - 1);
  },

  // this remove the synapses from the array
  removeAxonSynapse : function(synapse) {
    this.axons.removeAtKey(synapse.iid);
  },
  
  removeDendriteSynapse :function(synapse){
    this.dendrites.removeAtKey(synapse.iid);
    var synapses = this.groupedPreNeurons.get(synapse.preNeuron.iid);
    synapses = Ext.Array.remove(synapses, synapse);
    this.groupedPreNeurons.replace(synapse.preNeuron.iid, synapses);
  },

  updateSynapse : function() {
    var me = this;
    me.dendrites.each(function(key, value) {
      value.updateXY(true);
    });
    
    me.groupedPreNeurons.each(function(key, value) {
      var dendrites = value;
      Ext.each(dendrites, function(syn, index) {
        syn.updateLevel(index);
      });
    });

    me.axons.each(function(key, value) {
      value.updateXY();
    });
  },

  destroy : function() {
    this.dendrites.each(function(key, syn) {
      syn.destroy();
    });
    this.dendrites = null;
    this.axons.each(function(key, syn) {
      syn.destroy();
    });
    this.axons = null;
    this.groupedPreNeurons = null;
    this.callParent(arguments);
  },

  toJSON : function() {
    return JSON.stringify({
      iid : this.iid,
      x : this.x,
      y : this.y,
      z : this.z,
      axons : this.axons.getValues(),
      state : this.state
    });
  }
});

Ext.define('AM.view.neuronmap.Brain.Synapse', {
  extend : 'AM.view.world.Object',
  arrow : null,
  arrowSideLength : 10,

  preNeuron : null,

  // persistent
  postNeuron : null,

  endX : 0,
  endY : 0,
  // use for set up curve height, this level is determine by queue number in
  // where is this synapse
  level : 0,
  levelStep : 10,
  curveWidth : 20,
  
  isInhibit : false,

  constructor : function(config) {
    Ext.apply(this, config);
    this.setXY();// no draw() call ,because parent class will do
    this.callParent(config);
  },

  /**
   * Draw Synapse, will be call when initialed and redraw
   */
  draw : function() {
    var me = this;
    if (!Ext.isEmpty(me.drawComp)) {
      var sPathObj = Utils.getCurvePath(OP.add(me.x, me.y), OP.add(me.endX,
          me.endY), me.level * me.levelStep, me.curveWidth);
      var sPath = sPathObj.path;
      // [ 'M', me.x, me.y, 'Q', ((me.x + me.endX)/2 + 100), ((me.y + me.endY)/2
      // + 100), 'T', me.endX, me.endY ].join(' ');
      var arrawStartP = sPathObj.points[2]; // the curve control point
      var arrawEndP = sPathObj.points[3]; // the curve control point
      var arrowPath = Utils.getTriPath(OP.add(arrawStartP.x, arrawStartP.y), OP
          .add(arrawEndP.x, arrawEndP.y), me.arrowSideLength).path;
      if (Ext.isEmpty(me.s)) {
        me.s = this.drawComp.surface.add({
          type : 'path',
          fill : 'none',
          stroke : 'blue',
          path : sPath,
          x : me.x,
          y : me.y
        });
        me.arrow = me.drawComp.surface.add({
          type : 'path',
          fill : me.isInhibit ? '#ff' : '#ffffff',
          stroke : 'blue',
          // path : [ 'M', (me.x + me.endX) / 2, (me.y + me.endY) / 2, 'L',
          // me.endX, me.endY ].join(' '),
          path : arrowPath,
          x : (me.x + me.endX) / 2,
          y : (me.y + me.endY) / 2
        });
        me.registerListeners();
      } else {
        me.s.setAttributes({
          path : sPath,
          x : me.x,
          y : me.y
        });
        me.arrow.setAttributes({
          path : arrowPath,
          x : (me.x + me.endX) / 2,
          y : (me.y + me.endY) / 2
        });
      }
      me.appendText(arrawStartP.x, arrawStartP.y);
      me.s.redraw();
      me.arrow.redraw();
    }
  },
  
  registerListeners : function() {
    var me = this;
    if (!Ext.isEmpty(me.s)){
      me.s.on('mouseover', function(sprite) {
        // console.log('mouseover');
        if (me.state == STATE.N) {
          me.fireEvent('onStateChange', STATE.R, me);
        }
      });
      me.s.on('mouseout', function(sprite) {
        // console.log('mouseout');
        if (me.state == STATE.R) {
          me.fireEvent('onStateChange', STATE.N, me);
        }
      });
      me.s.on('click', function(sprite) {
        // console.log('click');
        me.fireEvent('onStateChange', STATE.A, me);
      });
    }
    if(!Ext.isEmpty(me.arrow)){
      me.arrow.on('mouseover', function(sprite) {
        // console.log('mouseover');
        if (me.state == STATE.N) {
          me.fireEvent('onStateChange', STATE.R, me);
        }
      });
      me.arrow.on('mouseout', function(sprite) {
        // console.log('mouseout');
        if (me.state == STATE.R) {
          me.fireEvent('onStateChange', STATE.N, me);
        }
      });
      me.arrow.on('click', function(sprite) {
        // console.log('click');
        me.fireEvent('onStateChange', STATE.A, me);
      });
    }
    
  },

  updateState : function(state) {
    var me = this;
    me.state = state;
    if (state == STATE.N) {
      if (state == STATE.N) {
        me.s.setAttributes({
          stroke : 'blue',
          style : {
            strokeWidth : 1
          }
        }, true);
        me.s.redraw();
        me.arrow.setAttributes({
          stroke : 'blue',
          style : {
            strokeWidth : 1
          }
        }, true);
        me.arrow.redraw();
      }
    } else if (state == STATE.A || state == STATE.R) {
      me.s.setAttributes({
        stroke : 'red',
        style : {
          strokeWidth : 3
        }
      }, true);
      me.s.redraw();
      me.arrow.setAttributes({
        stroke : 'red',
        style : {
          strokeWidth : 3
        }
      }, true);
      me.arrow.redraw();
    }
  },

  setXY : function() {
    this.x = this.preNeuron ? this.preNeuron.x : this.x;
    this.y = this.preNeuron ? this.preNeuron.y : this.y;
    this.endX = this.postNeuron ? this.postNeuron.x : this.endX;
    this.endY = this.postNeuron ? this.postNeuron.y : this.endY;
  },

  updateXY : function(deferRender) {
    this.setXY();
    if (!deferRender){
      this.draw();
    }
  },

  updateLevel : function(index, deferRender) {
    var level = index > 0 ? (index + 1) / 2 : 0;
    this.level = index % 2 == 0 ? level : -level;
    if (!deferRender){
      this.draw();
    }
  },

  destroy : function() {
    var me = this;
    me.arrow.destroy();
    me.preNeuron.removeAxonSynapse(me);
    me.postNeuron.removeDendriteSynapse(me);
    this.callParent(arguments);
  },

  toJSON : function() {
    return JSON.stringify({
      iid : this.iid,
      x : this.x,
      y : this.y,
      z : this.z,
      isInhibit : this.isInhibit,
      postNeuron : {
        iid : this.postNeuron.iid
      }
    });
  }

});

Ext.define('Brain.Input', {
  extend : 'AM.view.neuronmap.Brain.Neuron',
  
  draw : function() {
    var me = this;
    if (!Ext.isEmpty(me.drawComp)) {
      if (Ext.isEmpty(me.s)) {
        me.s = me.drawComp.surface.add({
          draggable : true,
          type : 'circle',
          fill : '#0f00ff',
          radius : me.radius,
          x : me.x,
          y : me.y,
          zIndex : 200
        });
        me.registerListeners();
      } else {
        me.s.setAttributes({
          x : me.x,
          y : me.y
        });
      }
      me.s.redraw();
      me.appendText();
    }
  },
  
  updateState : function(state) {
    var me = this;
    me.state = state;
    if (state == STATE.N) {
      if (state == STATE.N) {
        me.s.setAttributes({
          fill : '#0f00ff',
          stroke : 'none'
        }, true);
        me.s.redraw();
      }
    } else if (state == STATE.A || state == STATE.R) {
      me.s.setAttributes({
        fill : '#0f00ff',
        stroke : '#ff0000',
        style : {
          strokeWidth : 1
        }
      }, true);
      me.s.redraw();
    }
  }
});

Ext.define('Brain.Output', {
  extend : 'AM.view.neuronmap.Brain.Neuron',

  draw : function() {
    var me = this;
    if (!Ext.isEmpty(me.drawComp)) {
      if (Ext.isEmpty(me.s)) {
        me.s = me.drawComp.surface.add({
          draggable : true,
          type : 'circle',
          fill : '#ff00ff',
          radius : me.radius,
          x : me.x,
          y : me.y,
          zIndex : 200
        });
        me.registerListeners();
      } else {
        me.s.setAttributes({
          x : me.x,
          y : me.y
        });
      }
      me.s.redraw();
      me.appendText();
    }
  },
  
  updateState : function(state) {
    var me = this;
    me.state = state;
    if (state == STATE.N) {
      if (state == STATE.N) {
        me.s.setAttributes({
          fill : '#ff00ff',
          stroke : 'none'
        }, true);
        me.s.redraw();
      }
    } else if (state == STATE.A || state == STATE.R) {
      me.s.setAttributes({
        fill : '#ff00ff',
        stroke : '#ff0000',
        style : {
          strokeWidth : 1
        }
      }, true);
      me.s.redraw();
    }
  }
});

Ext.define('AM.view.neuronmap.NeuronMap', {
//  requires : [ 'Ext.data.UuidGenerator' ],
  mixins : {
    fm : 'AM.view.neuronmap.FocusManager'
  },
  // DOM id
  id : 'neuron-map',
  itemId : 'neuronMap',
  extend : 'Ext.panel.Panel',
  alias : 'widget.neuronmapview',
  iider : null,

  layout : {
    type : 'border',
    border : 2
  },

  viewName : 'Neuron Map Designer',

  title : 'Untitle Map',

  mode : MODE.NORMAL,

  neurons : [],
  
  inputs : [],
  
  outputs : [],

  /** This is the neurons to be connected */
  activatedNeuron : null,
  
  // the neuron to be connected
  candidateNeuron : null,

  offset : null,

  saveWindow : null,
  
  settingWindow : null,
  
  groundWindow : null,
  
  synapseCache : [],
  
  brainTick : null,
  
  worldTick : null,
  
  brainBuilder : null,

  // store: 'Users'
  initComponent : function() {
    var me = this;
    this.mixins.fm.constructor.call(this);
    this.addEvents([ 'mapSave', 'mapListShow', 'modeChanged' ]);
    this.iider = new Iid();
    this.items = [ {
      xtype : 'toolbar',
      title : 'Brain Map Designer',
      itemId : 'brainMapMenu',
      items : [ {
        iconCls : 'show-list-btn',
        id : 'show-list-btn',
        text : 'Back to List',
        tooltip : 'Back to map list',
        listeners : {
          click : function() {
            me.fireEvent('mapListShow');
          }
        }
      }, '|', {
        iconCls : 'neuron-active-btn',
        id : 'neuron-active-btn',
        text : 'Neuron',
        tooltip : 'Active Neuron tool',
        toggleGroup : 'brainbuttons',
        listeners : {
          toggle : function(btn, pressed, opts) {
            if (pressed) {
              me.mode = MODE.NEURON;
            } else if (me.mode == MODE.NEURON) {
              me.mode = MODE.NORMAL;
            }
            me.fireEvent('modeChanged');
          }
        }
      }, {
        iconCls : 'synapse-active-btn',
        id : 'synapse-active-btn',
        text : 'Synapse',
        tooltip : 'Active Synapse tool',
        toggleGroup : 'brainbuttons',
        listeners : {
          toggle : function(btn, pressed, opts) {
            if (pressed) {
              me.mode = MODE.SYNAPSE;
            } else if (me.mode == MODE.SYNAPSE) {
              me.mode = MODE.NORMAL;
            }
            me.fireEvent('modeChanged');
          }
        }
      }, {
        iconCls : 'synapse-r-active-btn',
        id : 'synapse-r-active-btn',
        text : 'Inhibit Synapse',
        tooltip : 'Active Synapse tool',
        toggleGroup : 'brainbuttons',
        listeners : {
          toggle : function(btn, pressed, opts) {
            if (pressed) {
              me.mode = MODE.SYNAPSE_R;
            } else if (me.mode == MODE.SYNAPSE_R) {
              me.mode = MODE.NORMAL;
            }
            me.fireEvent('modeChanged');
          }
        }
      }, '|' ,{
        iconCls : 'input-btn',
        id : 'input-btn',
        text : 'Input',
        tooltip : 'Input Neuron',
        toggleGroup : 'brainbuttons',
        listeners : {
          toggle : function(btn, pressed, opts) {
            if (pressed) {
              me.mode = MODE.INPUT;
            } else if (me.mode == MODE.INPUT) {
              me.mode = MODE.NORMAL;
            }
            me.fireEvent('modeChanged');
          }
        }
      }, {
        iconCls : 'output-btn',
        id : 'output-btn',
        text : 'Output',
        tooltip : 'Output Neuron',
        toggleGroup : 'brainbuttons',
        listeners : {
          toggle : function(btn, pressed, opts) {
            if (pressed) {
              me.mode = MODE.OUTPUT;
            } else if (me.mode == MODE.OUTPUT) {
              me.mode = MODE.NORMAL;
            }
            me.fireEvent('modeChanged');
          }
        }
      }, '|' ,{
        iconCls : 'remove-btn',
        id : 'remove-btn',
        text : 'Remove',
        tooltip : 'Remove Synapse or Neuron',
        toggleGroup : 'brainbuttons',
        listeners : {
          toggle : function(btn, pressed, opts) {
            if (pressed) {
              me.mode = MODE.DELETE;
            } else if (me.mode == MODE.DELETE) {
              me.mode = MODE.NORMAL;
            }
          }
        }
      }, '->', {
        iconCls : 'run-btn',
        id : 'run-btn',
        text : 'Run',
        tooltip : 'Run',
        toggleGroup : 'runbrainbtn',
        listeners : {
          toggle : function(btn, pressed, opts) {
//          console.log('save'); AM.view.ground.Ground
            if (pressed) {
              btn.setText('Hide Ground');
              btn.setTooltip('Hide Ground');
              if (!me.groundWindow) {
                me.groundWindow = Ext.widget('ground', {
                  gene : me.toJson(),
                  width : 1000,
                  height : 600,
                  listeners : {
                    beforeclose : function(){
                      btn.toggle(false);
                      me.groundWindow = null;
                    }
                  }
                });
                me.add(me.groundWindow);
              }
              me.groundWindow.show();
            }else{
              btn.setText('Run');
              btn.setTooltip('Run Brain\'s Ground');
            }
          }
        }
      }, {
        iconCls : 'statistic-btn',
        id : 'statistic-btn',
        text : 'Statistic',
        tooltip : 'Brain\'s Statistic',
        toggleGroup : 'runbrainbtn',
        listeners : {
          toggle : function(btn, pressed, opts) {
//          console.log('save');
            if (pressed) {
              btn.setText('Hide Statistic');
              btn.setTooltip('Stop Statistic');
              if (!me.settingWindow) {
                me.settingWindow = Ext.widget('braindashboard', {
                  neuronsMapView : me,
                  listeners : {
                    beforeclose : function(){
                      btn.toggle(false);
                      me.settingWindow = null;
                    }
                  }
                });
                me.add(me.settingWindow);
              }
              me.buildBrain();
              me.settingWindow.show();
            }else{
              btn.setText('Statistic');
              btn.setTooltip('Brain\'s Statistic');
              me.stopBrain();
            }
          }
        }
      }, {
        iconCls : 'save-btn',
        id : 'save-btn',
        text : 'Save Map',
        action : 'save',
        tooltip : 'Save the map',
        listeners : {
          click : function(btn, opts) {
//            console.log('save');
            if (!me.saveWindow) {
              var form = Ext.widget('form', {
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
                items : [ {
                  xtype : 'textfield',
                  fieldLabel : 'Map Name',
                  allowBlank : true
                } ],

                buttons : [ {
                  text : 'Cancel',
                  handler : function() {
                    this.up('form').getForm().reset();
                    this.up('window').hide();
                  }
                }, {
                  text : 'Save',
                  handler : function() {
                    var form = this.up('form').getForm();
                    if (form.isValid()) {
                      me.fireEvent('mapSave', {
                        name : this.up('form').query('textfield')[0].value,
                        nJson : me.toJson()
                      });
                      form.reset();
                      me.saveWindow.hide();
                    }
                  }
                } ]
              });
              me.saveWindow = Ext.widget('window', {
                title : 'Save Map',
                closeAction : 'hide',
                layout : 'fit',
                resizable : true,
                modal : true,
                items : form
              });
              me.add(me.saveWindow);
            }
            me.saveWindow.show();
          }
        }
      } ],
      region : 'north',
    }, {
      xtype : 'draw',
      region : 'center',
      itemId : 'drawpanel',
      orderSpritesByZIndex : true,
      viewBox : false,
      /**
       * this is the array to store the object that get the focus usually, only
       * one get focuse, when it get focus, this can prevent user from adding
       * neuron when the mouse cusor is on existing another neuron
       */
      focusObjects : [],
      neuronmapview : this,
      listeners : {
        click : function(e, t, opts) {
          // console.log('draw panel click');
          // only happen when user click on the neruon object
          if (e.target instanceof SVGRectElement) {
            me.offset = me.offset ? me.offset : me.down('draw').getBox().y;
            if (me.mode == MODE.NEURON) {
              me.addNeuron(OP.add(e.getXY()[0], e.getXY()[1]), -me.offset);
            } else if(me.mode == MODE.SYNAPSE || me.mode == MODE.SYNAPSE_R){
              if(me.candidateNeuron){
                me.cancelConnect();
              }
              if(me.activatedNeuron){
//                me.removeFocus();
                me.unfocus();
              }
            }else if(me.mode == MODE.INPUT){
              me.addInput(OP.add(e.getXY()[0], e.getXY()[1]), -me.offset);
            }else if(me.mode == MODE.OUTPUT){
              me.addOutput(OP.add(e.getXY()[0], e.getXY()[1]), -me.offset);
            }
          }
        }
      }
    } ];
    this.on('modeChanged', function(){
//      me.removeFocus();
      me.unfocus();
      me.cancelConnect();
    });
    this.callParent(arguments);
  },

  addNeuron : function(xy, offset, iid) {
    var me = this, drawComp = me.down('draw');
    var bno = Ext.create('AM.view.neuronmap.Brain.Neuron', {
      drawComp : drawComp,
      x : xy.x,
      y : xy.y + (offset ? offset: 0),
      iid : iid
    });
    me.addFocusable(bno);
    bno.on('onStateChange' , me.neuronScHandler, this);
    this.neurons.push(bno);
    return bno;
  },
  
  /**
   * Neuron on State Change Handler
   * @param state
   * @param neuron
   */
  neuronScHandler : function(state, neuron){
    if(state == STATE.A){//one neuron is activated
      this.manageConnect(neuron);
      this.rmNeuronClick(neuron);
    }
  },
  
  addSynapse : function(preN, postN, mode, iid){
    var me = this;
    var syn = preN.addAxonSynapse(postN, mode, iid);
    me.addFocusable(syn);
    syn.on('onStateChange', me.synScHandler, me);
  },
  
  /**
   * Synapse on State Change Handler
   * @param state
   * @param syn
   */
  synScHandler : function(state, syn){
    if(this.mode ==MODE.DELETE && state == STATE.A){//one neuron is activated
      this.rmSynClick(syn);
    }
  },
  
  rmSynClick : function(syn){
    var me = this;
    if(me.mode ==MODE.DELETE){//one synapse is activated
      if(me.activated == syn){
        me.activated = null;
      }
      syn.destroy();
    }
  },
  
  rmNeuronClick : function(neuron){
    var me = this;
    if(me.mode ==MODE.DELETE){//one neuron is activated
      if(me.activated == neuron){
        me.activated = null;
      }
      if(me.candidateNeuron == neuron){
        me.candidateNeuron = null;
      }
      if(neuron instanceof Brain.Input){
        me.inputs = Ext.Array.remove(me.inputs, neuron);
      }else if(neuron instanceof Brain.Output){
        me.outputs = Ext.Array.remove(me.outputs, neuron);
      }else {
        me.neurons = Ext.Array.remove(me.neurons, neuron);
      }
      neuron.destroy();
    }
  },

  //TODO I hate this implementation, will seperate the logic for input and output,
  // keep it simple and clean
  manageConnect : function(neuron){
    var me = this;
    if(me && (me.mode == MODE.SYNAPSE || me.mode == MODE.SYNAPSE_R)){
      if(!Ext.isEmpty(me.candidateNeuron) && me.candidateNeuron != neuron){
        if(!(neuron instanceof Brain.Input)){//the neuron to connect must not be input
          if( me.candidateNeuron instanceof Brain.Input  && neuron instanceof Brain.Output) {
            //input can not connect to output directly
            Ext.Msg.alert('Message', 'You can not connect input to output directly');
          }else{
            // going to connect both
            me.addSynapse(me.candidateNeuron, neuron, me.mode);
          }
        }else{
          Ext.Msg.alert('Message', 'You can not connect neuron to Input');
        }
        me.candidateNeuron = null;
      }else if(!(neuron instanceof Brain.Output)) {//can not start connecting, reset state
        me.candidateNeuron = neuron;
      }
    }
  },
  
  cancelConnect : function(){
    this.candidateNeuron = null;
  },

  addInput : function(xy, offset, iid) {
    var me = this, drawComp = me.down('draw');
    var input = Ext.create('Brain.Input', {
      drawComp : drawComp,
      x : xy.x,
      y : xy.y + (offset ? offset: 0),
      iid : iid
    });
    input.on('onStateChange' , me.neuronScHandler, this);
    this.inputs.push(input);
    return input;
  },
  
  addOutput : function(xy, offset, iid) {
    var me = this, drawComp = me.down('draw');
    var output = Ext.create('Brain.Output', {
      drawComp : drawComp,
      x : xy.x,
      y : xy.y + (offset ? offset: 0),
      iid : iid
    });
    output.on('onStateChange' , me.neuronScHandler, this);
    this.outputs.push(output);
    return output;
  },
  
  startEngine : function(mapsdata, name) {
    this.clean();
    this.setTitle (this.viewName + ' : ' + name);
    ParseEngine(mapsdata, this.engAddN, this.engAddI, this.engAddO, this.engConnHandler, this.engFinish, this);
  },

  engAddN : function(neuron){
    //let IID has the correct offset
    this.iider.set(neuron.iid);
    var newNeuron = this.addNeuron(OP.add(neuron.x, neuron.y), 0, neuron.iid);
    return newNeuron;
  },
  
  engAddI : function(neuron){
    //let IID has the correct offset
    this.iider.set(neuron.iid);
    newNeuron = this.addInput(OP.add(neuron.x, neuron.y), 0, neuron.iid);
    return newNeuron;
  },
  
  engAddO : function(neuron){
    //let IID has the correct offset
    this.iider.set(neuron.iid);
    var newNeuron = this.addOutput(OP.add(neuron.x, neuron.y), 0, neuron.iid);
    return newNeuron;
  },
  
  engConnHandler : function(neuron, synapse){
    this.synapseCache.push({neuron : neuron, synapse : synapse});
  },
  
  engFinish : function(){
    //rebuild the synapse
    var me = this;
    Ext.each(me.synapseCache, function(sc){
      var results = me.findNeuron(sc.synapse.postNeuron);
      if (results && results.length > 0){
        var postN = results[0];
        me.iider.set(sc.synapse.iid);
        var mode = sc.synapse.isInhibit ? MODE.SYNAPSE_R : MODE.SYNAPSE;
        me.addSynapse(sc.neuron, postN, mode, sc.synapse.iid);
        //let IID has the correct offset
      }
    });
  },
  
  findNeuron : function(neuron){
    var all = this.neurons.concat(this.outputs);
    var results = Ext.Array.filter(all, function(item){
      if(item && item.iid == neuron.iid){
        return true;
      }
      return false;
    }, this);
    return results;
  },
  
  buildBrain : function(){
    var nJson = this.toJson();
    this.brainBuilder = new BrainBuilder(nJson);
    this.brainBuilder.build();
    gBrain.cortex = this.brainBuilder.cortex;// explore the cortex for global access
  },
  
  startBrain : function(interval, decayRate, synapseStrength, worldInterval, inputs){
    var me = this;
    this.worldTick = Ext.TaskManager.start({
      interval : worldInterval,
      run: function(){
        me.brainBuilder.cortex.set(inputs);
      }
    });
    this.brainTick = Ext.TaskManager.start({
      interval : interval,
      run: function(){
        me.brainBuilder.run.call(me.brainBuilder);
        if(me.settingWindow){
          me.settingWindow.refresh(me.brainBuilder.cortex.neurons);
        }
      }
    });
  },
  
  stopBrain : function(){
    if(this.worldTick){
      Ext.TaskManager.stop(this.worldTick);
    }
    if(this.brainTick){
      Ext.TaskManager.stop(this.brainTick);
    }
  },
  
  updateBrain : function(interval, decayRate, synapseStrength, worldInterval, inputs){
    var me = this;
    me.stopBrain();
    me.startBrain(interval, decayRate, synapseStrength, worldInterval, inputs);
  },
  
  clean : function() {
    // clean title
    this.setTitle(this.viewName);
    var drawComp = this.down('draw');
    drawComp.surface.removeAll(true);
    // destroy neurons, neuron will handle detail ifseft
    Ext.each(this.neurons, function(n) {
      n.destroy();
      n = null;
    });
    // destroy input and output, neuron will handle detail ifseft
    Ext.each(this.inputs, function(n) {
      n.destroy();
      n = null;
    });
    Ext.each(this.outputs, function(n) {
      n.destroy();
      n = null;
    });
    this.activatedNeuron = null;
    this.candidateNeuron = null;
    this.neurons = [];
    this.inputs = [];
    this.outputs = [];
    this.synapseCache = [];
    if(this.worldTick){
      Ext.TaskManager.stop(this.worldTick);
    }
    if(this.brainTick){
      Ext.TaskManager.stop(this.brainTick);
    }
    if(this.brainBuilder){
      this.brainBuilder = null;
    }
    this.iider.reset();
  },
  
  toJson : function(){
    var me = this;
    return Ext.JSON.encode({
      inputs : me.inputs,
      outputs : me.outputs,
      neurons : me.neurons
    });
  }
});
/**
 * The Grid of maps
 */
Ext.define('AM.view.neuronmap.NeuronMapList', {
  extend : 'Ext.grid.Panel',
  alias : 'widget.neuronmaplist',
  selType : 'rowmodel',

  rowEditor : Ext.create('Ext.grid.plugin.RowEditing', {
    clicksToEdit : 2
  }),

  store : 'NeuronMaps',

  initComponent : function() {
    var me = this;
    this.addEvents([ 'mapEdit', 'mapDelete', 'mapAdd' ]);

    this.columns = [ {
      header : 'Name',
      dataIndex : 'name',
      editor : {
        xtype : 'textfield',
        allowBlank : true
      },
      width : 100
    }, {
      header : 'Map Data',
      dataIndex : 'mapsdata',
      editor : {
        xtype : 'textfield',
        allowBlank : false
      },
      flex : 10
    }, {
      header : 'Update Time',
      dataIndex : 'updatetime',
      editable : false,
      draggable : false,
      resizable : false,
      renderer : Ext.util.Format.dateRenderer('m/d/Y'),
      flex : 1
    }, {
      xtype : 'actioncolumn',
      width : 20,
      draggable : false,
      resizable : false,
      sortable : false,
      hidable : false,
      menuDisabled : true,
      items : [ {
        icon : 'images/edit.png', // Use a URL in the icon config
        flex : 1,
        tooltip : 'Edit',
        handler : function(grid, rowIndex, colIndex) {
          me.fireEvent('mapEdit', {
            rowIndex : rowIndex,
            colIndex : colIndex
          });
        }
      }]
    }, {
      xtype : 'actioncolumn',
      width : 20,
      draggable : false,
      resizable : false,
      sortable : false,
      hidable : false,
      menuDisabled : true,
      items : [{
        icon : 'images/delete.png',
        tooltip : 'Delete',
        handler : function(grid, rowIndex, colIndex) {
          me.fireEvent('mapDelete', {
            rowIndex : rowIndex,
            colIndex : colIndex
          });
        }
      }]
    }];
    this.plugins = [ this.rowEditor ];
    this.tbar = [ '->', {
      xtype : 'button',
      text : 'Add map',
      listeners : {
        click : function(e, opt) {
          me.fireEvent('mapAdd');
        }
      }
    } ], this.callParent(arguments);
  }
});

Ext.define('AM.view.ground.Food', {
  extend : 'AM.view.world.Point',

});

Ext.define('AM.view.ground.Ground', {
  extend : 'Ext.window.Window',
  alias : 'widget.ground',
  title : 'Playground',

  layout : {
    type : 'border',
    border : 2
  },
  
  modal : true,
  autoShow : true,
  closeAction : 'destroy',
  
  height : 600,
  width : 1000,
  
  world : null,
  
  ant : null,
  
  iidor : null,
  
  worldTick : null,
  
  antTick : null,
  
  gene : null,
  
  offset : OP.add(0, 0),
  
  initComponent : function() {
    var me = this;
    this.addEvents('modeChanged');
    me.iidor = new Iid();
    me.world = World.create({x : 0, y : 0, resistance : 0.09});
    me.ant = me.world.add({
      type: 'ant', 
      x : 300, y : 300,
      gene : Ext.isEmpty(this.gene) ? JSON.stringify(gene) : this.gene,
      sex : Creature.SEX.M
    });

    me.items = [{
      xtype : 'toolbar',
      title : 'bar',
      region : 'north',
      items : [ {
        text : 'Left F',
        listeners : {
          click : function() {
            me.ant.lff();
          }
        }
      }, '|', {
        text : 'Right F',
        listeners : {
          click : function() {
            me.ant.rff();
          }
        }
      },
      {
        text : 'Left B',
        listeners : {
          click : function() {
            me.ant.lfb();
          }
        }
      }, '|', {
        text : 'Right B',
        listeners : {
          click : function() {
            me.ant.rfb();
          }
        }
      },'|', {
        text : 'Start',
        listeners : {
          click : function() {
            me.start();
          }
        }
      }, {
        text : 'Stop',
        listeners : {
          click : function() {
            me.stop();
          }
        }
      }, '->',  {
        text : 'Feed',
        toggleGroup : 'feedbuttons',
        listeners : {
          toggle : function(btn, pressed) {
            if (pressed) {
              me.mode = MODE.NEURON;
            }else{
              me.mode = MODE.NORMAL;
            } 
          }
        }
      }
      ]}, {
      xtype : 'draw',
      region : 'center',
      itemId : 'drawpanel',
      orderSpritesByZIndex : true,
      viewBox : false,
      neuronmapview : me,
      listeners : {
        click : function(e, t, opts) {
          // console.log('draw panel click');
          // only happen when user click on the neruon object
          if (e.target instanceof SVGRectElement) {
            var box = me.down('draw').getBox();
            me.offset = OP.add(-box.x, -box.y);
            if (me.mode == MODE.NEURON) {
              me.addFood(OP.add(e.getXY()[0], e.getXY()[1]), me.offset);
            }
          }
        }
      }
    } ];
    this.callParent(arguments);
  },
  
  afterRender : function(){
    var me = this;
    me.callParent(arguments);
    for(var i in me.world.points){
      var p = me.world.points[i];
      me.addViewPoint(p, 40);
    }

    me.start();
  },
  
  start : function(){
    console.log('start');
    var me = this;
    if(Ext.isEmpty(this.worldTick)){
      this.worldTick = Ext.TaskManager.start({
        interval : 100,
        run: function(){
          me.world.tick();
          me.ant.tick();
        }
      });
    }else{
      Ext.TaskManager.start(this.worldTick);
    }
    
//    if(isEmpty(this.antTick)){
//      this.antTick = Ext.TaskManager.start({
//        interval : 100,
//        run: function(){
//          me.ant.tick();
//        }
//      });
//    }else{
//      Ext.TaskManager.start(this.antTick);
//    }
  },
  
  stop : function(){
    console.log('stop');
    if(this.worldTick){
      Ext.TaskManager.stop(this.worldTick);
    }
    if(this.antTick){
      Ext.TaskManager.stop(this.antTick);
    }
  },
  
  addFood : function(xy, offset) {
    var me = this;
    var life = me.world.add({type: 'life', x : xy.x + offset.x, y : xy.y + offset.y});
    me.addViewPoint(life.body);
    return life;
  },
  
  addViewPoint : function(point) {
    var me = this, drawComp = me.down('draw');
    var bno = Ext.create('AM.view.world.Point', {
      drawComp : drawComp,
      x : point.x,
      y : point.y, 
      radius : 5,
      iid : point.iid,
      point : point,
      text : point.text
    });
    me.iidor.set(point.iid);
    point.on({
      onMove : function(p){
        bno.syncPos();
      },
      onDestroy : function(p){
        bno.destroy();
        bno = null;
      }
    });
    bno.on({
      'onMove': function(n){
        point.x = n.x + me.offset.x;
        point.y = n.y + me.offset.y;
      }
    });
    return bno;
  },
  
  destroy : function(){
    this.stop();
    this.callParent(arguments);
  }
});
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
/*
 * TODO we can use sencha sdk to generate all-class.js and app.jsb3, 
 */
//Ext.Loader.loadScript('./app/controller/NeuronMap.js');
//Ext.Loader.loadScript('./app/view/neuronmap/NeuronMap.js');
//Ext.Loader.loadScript('./app/view/Viewport.js');

//Ext.onReady(function(){
  Ext.application({
    name: 'AM',
    // automatically create an instance of AM.view.Viewport
    autoCreateViewport: true,

    controllers: [
        'NeuronMap',
        'World'
    ]
});



