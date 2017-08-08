Ext.define('AM.view.ground.ShapeTest', {
  extend : 'Ext.panel.Panel',
  alias : 'widget.shapetest',
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
      }, {
        text : 'Right F',
        listeners : {
          click : function() {
            me.ant.rff();
          }
        }
      },'|', 
      {
        text : 'Left B',
        listeners : {
          click : function() {
            me.ant.lfb();
          }
        }
      }, {
        text : 'Right B',
        listeners : {
          click : function() {
            me.ant.rfb();
          }
        }
      },'|',  {
        text : 'Left Back F',
        listeners : {
          click : function() {
            me.ant.lbff();
          }
        }
      }, {
        text : 'Right Back F',
        listeners : {
          click : function() {
            me.ant.rbff();
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
    var bno = Ext.create('AM.view.ground.Point', {
      drawComp : drawComp,
      x : point.x,
      y : point.y, 
      radius : 5,
      iid : point.iid,
      point : point,
      text : point.text
    });
    me.iidor.set(point.iid);
    point.onMoved = function(p){
      bno.syncPos();
    },
    point.onDestroyed = function(p){
      bno.destroy();
      bno = null;
    };
    bno.on('onMove', function(n){
      point.x = n.x + me.offset.x;
      point.y = n.y + me.offset.y;
    });
    return bno;
  },
  
  destroy : function(){
    this.stop();
    this.callParent(arguments);
  }
});

var gene = {"inputs":[{"iid":8,"x":385,"y":117,"z":0,"axons":["{\"iid\":16,\"x\":385,\"y\":117,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":0}}","{\"iid\":33,\"x\":385,\"y\":117,\"z\":0,\"isInhibit\":true,\"postNeuron\":{\"iid\":2}}"],"state":"normal"},{"iid":9,"x":467,"y":119,"z":0,"axons":["{\"iid\":18,\"x\":467,\"y\":119,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":2}}","{\"iid\":32,\"x\":467,\"y\":119,\"z\":0,\"isInhibit\":true,\"postNeuron\":{\"iid\":0}}"],"state":"normal"},{"iid":10,"x":611,"y":114,"z":0,"axons":["{\"iid\":20,\"x\":611,\"y\":114,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":4}}","{\"iid\":36,\"x\":611,\"y\":114,\"z\":0,\"isInhibit\":true,\"postNeuron\":{\"iid\":6}}"],"state":"normal"},{"iid":11,"x":704,"y":114,"z":0,"axons":["{\"iid\":22,\"x\":704,\"y\":114,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":6}}","{\"iid\":38,\"x\":704,\"y\":114,\"z\":0,\"isInhibit\":true,\"postNeuron\":{\"iid\":4}}"],"state":"normal"}],"outputs":[{"iid":12,"x":502,"y":341,"z":0,"axons":[],"state":"normal"},{"iid":13,"x":500,"y":419,"z":0,"axons":[],"state":"normal"},{"iid":14,"x":597,"y":332,"z":0,"axons":[],"state":"normal"},{"iid":15,"x":597,"y":419,"z":0,"axons":[],"state":"normal"}],"neurons":[{"iid":0,"x":386,"y":188,"z":0,"axons":["{\"iid\":17,\"x\":386,\"y\":188,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":1}}","{\"iid\":24,\"x\":386,\"y\":188,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":14}}","{\"iid\":35,\"x\":386,\"y\":188,\"z\":0,\"isInhibit\":true,\"postNeuron\":{\"iid\":3}}"],"state":"normal"},{"iid":1,"x":378,"y":289,"z":0,"axons":["{\"iid\":25,\"x\":378,\"y\":289,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":14}}"],"state":"activated"},{"iid":2,"x":464,"y":192,"z":0,"axons":["{\"iid\":19,\"x\":464,\"y\":192,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":3}}","{\"iid\":26,\"x\":464,\"y\":192,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":12}}","{\"iid\":34,\"x\":464,\"y\":192,\"z\":0,\"isInhibit\":true,\"postNeuron\":{\"iid\":1}}"],"state":"normal"},{"iid":3,"x":469,"y":290,"z":0,"axons":["{\"iid\":27,\"x\":469,\"y\":290,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":12}}"],"state":"normal"},{"iid":4,"x":617,"y":198,"z":0,"axons":["{\"iid\":21,\"x\":617,\"y\":198,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":5}}","{\"iid\":28,\"x\":617,\"y\":198,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":13}}","{\"iid\":39,\"x\":617,\"y\":198,\"z\":0,\"isInhibit\":true,\"postNeuron\":{\"iid\":7}}"],"state":"normal"},{"iid":5,"x":620,"y":267,"z":0,"axons":["{\"iid\":29,\"x\":620,\"y\":267,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":13}}"],"state":"normal"},{"iid":6,"x":711,"y":192,"z":0,"axons":["{\"iid\":23,\"x\":711,\"y\":192,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":7}}","{\"iid\":30,\"x\":711,\"y\":192,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":15}}","{\"iid\":37,\"x\":711,\"y\":192,\"z\":0,\"isInhibit\":true,\"postNeuron\":{\"iid\":5}}"],"state":"normal"},{"iid":7,"x":720,"y":270,"z":0,"axons":["{\"iid\":31,\"x\":720,\"y\":270,\"z\":0,\"isInhibit\":false,\"postNeuron\":{\"iid\":15}}"],"state":"normal"}]};