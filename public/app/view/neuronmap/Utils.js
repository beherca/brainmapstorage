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
