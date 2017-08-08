Ext.define('AM.view.ground.GroundTest', {
  extend : 'Ext.panel.Panel',
  alias : 'widget.groundtest',
  title : 'Playground',

  layout : 'fit',
  
  initComponent : function() {
    var me = this;
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
    var preNeuron = me.addNeuron(OP.add(500, 200), 40, 1);
    var postNeuron = me.addNeuron(OP.add(600, 200), 40, 2);
    preNeuron.on('onMove', function(n){
      pre.x = n.x;
      pre.y = n.y;
    });
    postNeuron.on('onMove', function(n){
      post.x = n.x;
      post.y = n.y;
    });
    var world = World.create({x : 0, y : 0});
    //pre Point and post Point which will be attached to Neurons
    var pre = world.add({type: 'point', x : 500, y : 200});
    var post = world.add({type: 'point', x : 600, y : 200});
    var link = world.link({pre : pre, post : post, unitForce : 0.1, distance : 0, maxEffDis : 2000, isDual: true});
    
    Ext.TaskManager.start({
    interval : 100,
    run: function(){
      world.tick();
      console.log('world ticked');
      me.setXy(preNeuron, pre,  preNeuron.draw);
      me.setXy(postNeuron, post,  postNeuron.draw);
    }, 
    repeat : 500
    });
  },
  
  setXy : function(n, p, callback){
    var xy = OP.add(p.x, p.y);
    Utils.apply(n, xy);
    callback.call(n);
  },
  
  addNeuron : function(xy, offset, iid) {
    var me = this, drawComp = me.down('draw');
    var bno = Ext.create('AM.view.world.Object', {
      drawComp : drawComp,
      x : xy.x,
      y : xy.y + (offset ? offset: 0),
      iid : iid
    });
    return bno;
  },

});