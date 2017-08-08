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