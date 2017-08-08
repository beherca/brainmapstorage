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