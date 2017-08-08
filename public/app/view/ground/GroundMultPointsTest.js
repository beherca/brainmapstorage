Ext.define('AM.view.ground.GroundMultPointsTest', {
  extend : 'Ext.panel.Panel',
  alias : 'widget.groundmptest',
  title : 'Playground',

  layout : 'fit',
  
  points : [],
  
  iidor : null,
  
  initComponent : function() {
    var me = this;
    me.iidor = new Iid();
    me.items = [{
      xtype : 'draw',
      itemId : 'drawpanel',
      orderSpritesByZIndex : true,
      viewBox : false,
      flex : 1,
      neuronmapview : me,
      listeners : {
        click : function(e, t, opts) {
        }
      }
    } ];
    this.callParent(arguments);
  },
  
  afterRender : function(){
    var me = this;
    me.callParent(arguments);

    var world = World.create({x : 0, y : 0, resistance : 0.2});
    var pre = null;
    for(var i = 0; i < 2 ; i++){
      var p = this.addPoint(world);
      if(pre)
//      for(var k in this.points){
//        var cp = this.points[k];
        var link = world.link({pre : pre.point, post : p.point, elasticity : 0.9, unitForce : 0.9, distance : 50, maxEffDis : 2000, isDual: true, repeat : 12});
//      }
      this.points.push(p);
      pre = p;
    }
    Ext.TaskManager.start({
    interval : 100,
    run: function(){
      world.tick();
      console.log('world ticked');
      for(var i in me.points){
        me.points[i].syncPos();
      }
    }, 
    repeat : 500
    });
  },
  
  addPoint : function(world) {
    var me = this, drawComp = me.down('draw');
    
    var p = world.add({type: 'point', x : 800 * Math.random(), y : 600 * Math.random(), isCrashable : false});
    var bno = Ext.create('AM.view.ground.Point', {
      drawComp : drawComp,
      x : p.x,
      y : p.y,
      point : p,
      iid : me.iidor.get()
    });
    bno.on('onMove', function(n){
      n.point.x = n.x;
      n.point.y = n.y;
    });
    return bno;
  }

});