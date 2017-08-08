/*
Copyright(c) 2012 Bebeca
*/
/**
 * Internal Id for neuron and Synapse
 */
function Iid(){};
Iid.prototype = {
    iid : 0,

    get : function() {
      return this.iid++;
    },
    // set offset
    set : function(offset) {
      offset++;
      this.iid = (this.iid < offset) ? offset : this.iid;
    },

    // reset to
    reset : function() {
      this.iid = 0;
    }
};
Iid.constructor = Iid;
IID = new Iid();
/**
 * This is an iid generator
 * @param prefix the prefix that inherited from parent
 * @param obj the object that iider live in
 * @param props the properties of object
 */
Iider = {
  get : function(obj, props, prefix){
    prefix = prefix != null ? this.refine(prefix) :'root';
    var idElements = [prefix];
    if(Utils.isObject(obj)){
      for(var i in props){
        var prop = props[i];
        if(obj[prop] != null){
          var elem = this.refine(obj[prop]);
          if(elem != ''){
            idElements.push(elem);
          }
        }
      }
    }else{
      var elem = this.refine(obj.toString());
      if(elem != ''){
        idElements.push(elem);
      }
    }
    var suffix = [Date.now()/*, Math.random().toString().replace('.', '')*/]; 
    var iid = this.build(idElements.concat(suffix));
    return iid;
  },
  
  build : function(idElements){
    return idElements != null ? idElements.join('-') : '';
  },
  
  refine : function(str){
    return str != null ? str.replace(/[^A-Za-z0-9\/-]+/gi, '') : '';
  }
};

/**
 * Indexer to space elements
 */
function Indexer(){
  /**
   * Index on x axis
   */
  this.xi = {};
  this.yi = {};
  this.zi = {};
  this.maxx = 1000;
  this.maxy = 1000;
  this.maxz = 1000;
  this.minx = 0;
  this.miny = 0;
  this.minz = 0;
};

Indexer.prototype = {
  /**
   * Dimensions 
   */
  ds : {x : 'y', y : 'x'},
  /**
   * 
   * @param point
   * @param axis which axis of the point is changed
   * @returns
   */
  get : function(point, axis){
    var result = null;
    if(!Utils.isEmpty(this[axis + 'i'][point[axis]])){
      result = this[axis + 'i'][point[axis]][point[this.ds[axis]]];
    }
    return result;
  },
  
  /**
   * add function will remove the previous point in the index with current point\
   * without checking
   * @param point
   */
  add : function(point){
    var isValid = true;
    for(var d in this.ds){
      if(point[d] < this['min' + d] || point[d] > this['max' + d]){
        isValid = false;
        break;
      }
    }
    if(isValid){
      for(var d in this.ds){
        var d1 = (point[d]);
        var d2 = (point[this.ds[d]]);
        if(Utils.isEmpty(this[d + 'i'][d1])){
          this[d + 'i'][d1] = {};
        }
        this[d + 'i'][d1][d2] = point;
      }
    }
  },
  
  /**
   * remove the point from index
   * @param point
   */
  remove : function(point){
    for(var d in this.ds){
      if(!Utils.isEmpty(this[d + 'i'][point[d]])){
        //this.xi.[x = 100][y = 100]
        delete this[d + 'i'][point[d]][point[this.ds[d]]];
        //TODO delete consume a lot cpu
        /*if(Object.keys(this[d + 'i'][point[d]]).length == 0){
          delete this[d + 'i'][point[d]];
        }*/
      }
    }
  }
};

function Euclidean(){
  this._x = 0;
  this._y = 0;
  this._z = 0;
  this._ex = 0;
  this._ey = 0;
  this._ez = 0;
};

Euclidean.prototype = {
  get x(){
    return this._x;
  },
  
  set x(v){
    this._x = v;
  },
  
  get y(){
    return this._y;
  },
  
  set y(v){
    this._y = v;
  },
  
  get z(){
    return this._z;
  },
  
  set z(v){
    this._z = v;
  },
  
  get ex(){
    return this._ex;
  },
  
  set ex(v){
    this._ex = v;
  },
  
  get ey(){
    return this._ey;
  },
  
  set ey(v){
    this._ey = v;
  },
  
  get ez(){
    return this._ez;
  },
  
  set ez(v){
    this._ez = v;
  },

  get width(){
    return (this.ex - this.x);
  },
  
  
  get height(){
    return (this.ey - this.y);
  },
  
  get depth(){
    return (this.ez - this.z);
  },
  
  toJson : function(){
    return {
      x : this.x,
      y : this.y,
      z : this.z,
      ex : this.ex,
      ey : this.ey,
      ez : this.ez
    };
  }
};

Euclidean.prototype.constructor = Euclidean;


function Dims(dims, start){
  this.dims = dims ? dims : ['x', 'y', 'z'];
  this.currDim = start;
}

Dims.prototype = {
  next : function (){
    var currentIndex = this.dims.indexOf(this.currDim);
    var nextIndex = currentIndex + 1 >= this.dims.length ? 0 : currentIndex + 1;
    var dim = this.dims[nextIndex];
    this.currDim = dim;
    return dim;
  }, 
  
  all : function(){
    return this.dims;
  }
};

Dims.prototype.constructor = Dims;

/**
 * Enable event for core functions
 */
function Observable(){
  this._listeners = {};
  this.on = function(){
    var listeners;
    /*
     * Usage 1
     * this.on({
     *   onClick : {
     *     fn : function(){},
     *     scope : function(){}
     *   },
     *   onDestroy : function(){},
     * })
     */
    if(!Utils.isEmpty(arguments) && arguments.length == 1){
      listeners = arguments[0];
      for(var evtName in listeners){
        var eventHandler = listeners[evtName];
        this.addListener(evtName, eventHandler);
      }
    }
    /*
     * Usage 2 
     * this.obj.on('onClick', function(){}, [scope(default obj)], [repeat])
     */
    else if(!Utils.isEmpty(arguments) && arguments.length > 1){
      var evtName = arguments[0];
      var eventHandler = Utils.isEmpty(arguments[2]) ? {fn : arguments[1], scope : this} : {fn : arguments[1], scope : arguments[2]};
      /*
       * set repeat time for event handler, 
       * when repeat times reduce to zero, this handler will be destroy automatically
      */
      if(!Utils.isEmpty(arguments[3]) && arguments[3] > 0){
        eventHandler.repeat = arguments[3];
      }
      this.addListener(evtName, eventHandler);
    }
  };
  
  this.addListener = function(evtName, eventHandler, scope){
    if(this._listeners && this._listeners[evtName]){
      this._listeners[evtName].push(eventHandler);
    }else if(this._listeners && !this._listeners[evtName]){
      this._listeners[evtName] = [eventHandler];
    }
  };
  
  this.fireEvent = function(name, obj){
    var reglists = this._listeners[name];
    //collect all listeners return results if it has any, for RuleEngine to use
    var collectedResults = [];
    if(!Utils.isEmpty(reglists) && Array.isArray(reglists) && reglists.length > 0){
      for(var i in reglists){
        var listener = reglists[i];
        var result = null;
        if(typeof(listener) == 'object'){
          /*
           * Check whether current listener comes to the end of its life,
           * if yes, remove it
           */
          if(!Utils.isEmpty(listener.repeat)){
            if( listener.repeat > 0){
              listener.repeat += -1;
              result = listener.fn.call(listener.scope, obj, name, this);
            }else{
              /**
               * delete the handler for that listener
               */
              if(reglists.length > 1){//more than one
                //copy the list
                var newListeners = [].concat(reglists);
                newListeners.splice(i, i);
                this._listeners[name] = newListeners;
              }else{
                delete this._listeners[name];
              }
            }
          }else{
            result = listener.fn.call(listener.scope, obj, name, this);
          }
        }
        if(result != null){
          collectedResults.push(result);
        }
      }
    }
    return collectedResults;
  };
  
  /**
   * @param evtName the registered event name
   * @param func the function that is registered, if this is null, all listeners which
   * listen to this event will be deleted 
   * @returns the objects that is deleted
   */
  this.removeListener = function(evtName, fn){
    var removed = null;
    if(!Utils.isEmpty(evtName)){
      if(!Utils.isEmpty(fn)){
        var reglist = this._listeners[evtName];
        if(!Utils.isEmpty(reglist)){
          var ls = reglist.filter(function(obj){
            if(obj.fn === fn){
              return true;
            }
          });
          if(ls.length > 0){
            //found
            if(reglist.length > 1){
              var i = reglist.indexOf(ls[0]);
              removed = reglist.splice(i, i);
              this._listeners[evtName] = reglist;
            }else{
              delete this._listeners[evtName];
            }
          }
        }
      }else{
        delete this._listeners[evtName];
      }
    }
    return removed;
  },
  
  this.removeAllListeners = function(){
    this._listeners = {};
  };
  
  this.destroy = function(){
    this._listeners = null;
  };
  return this;
};

/**
 * Unblock looper example, equal to for(var i =start; i< end ; i + step){console.log(i)}
 * l = Utils.cls.create(Looper)
 * l.run({name : name, start : 0, end : 10, step : 1, function(i){console.log(i)}})
 * setInterval(l.tick, 1000); // in browser
 * process.tick(l.tick) // in nodejs
 * @returns
 */
function Looper(ticker){
  this.loopees = {};
  this.forceStop = false;
  this.ticker = ticker;
};

Looper.prototype =  {
  start : function(){
    this.forceStop = false;
    this.tick();
  },
  
  stop : function(){
    this.forceStop = true;
  },
  
  tick : function(){
    var me = this;
    for(var name in me.loopees){
      var loopee = me.loopees[name];
      if(loopee['index'] < loopee['end']){
        var i = loopee['index'];
        loopee['capsule'] = loopee['handler'](i, loopee['capsule']);
        loopee['index'] = i + loopee['step'];
      }else{
        me.remove(name);
      }
    }
    if(me.forceStop){
      me.forceStop = false;
    }else if(me.ticker){
      me.ticker(function(){
        me.tick();
      });
    }
  },
  
  /**
   * loopee : {
        name : name, 
        start :  start,
        end : end,
        step : step,
        handler : handler,
        callder : caller
      }
   */
  run : function(loopee){
    loopee['handler'] = loopee['handler'].bind(loopee['scope']);
    loopee['index'] = loopee['start'];
    loopee['capsule'] = null;
    this.loopees[loopee.name] = loopee;
  },
  
  /**
   * remove loopee
   * @param name loopee name
   */
  remove : function(name){
    delete this.loopees[name];
  },
  
  destroy : function(){
    this.loopees = null;
  }
};

Looper.prototype.constructor = Looper;
  


/**
 * Origin Point
 */
OP = {
  x : 0,
  y : 0,
  z : 0,
  add : function(x, y, z) {
    return {
      x : x,
      y : y,
      z : Utils.isEmpty(z) ? 0 : z
    };
  }
};

AXIS = {X : 'x', Y : 'y', Z : 'z'};

var Utils = {
  isEmpty : function(obj) {
    return obj == null /*implecit convert null, and undefined*/|| typeof obj === "undefined";
  },
  
  /**
   * set restrict true : Must be an object, not array, function ,regx, number, string and so on
   */
  isObject : function(obj, restrict){
    return !Utils.isEmpty(obj) && typeof obj === "object" 
      && (!restrict || (obj.constructor && obj.constructor === Object));
  },

  isFunction : function(obj){
    return typeof obj === "function" && obj.constructor && obj.constructor === Function;
  },

  isArray : function(arr) {
    return !Utils.isEmpty(arr) && arr.constructor == Array;
  },
  
  T : {
    EMPTY : 'empty',
    ARRAY : 'array',
    FUNC : 'function',
    INST : 'instance',
    STR : 'string',
    NUM : 'number',
    REGX : 'regx',
    DATE : 'date',
    BOOL : 'boolean',
    OBJ : 'object'
  },
  
  type : function(obj){
    if(obj == null){//empty means both null and undefined
      return Utils.T.EMPTY;
    }else if(typeof obj === 'string'){//string
      return Utils.T.STR;
    }else if(typeof obj === 'number'){//number
      return Utils.T.NUM;
    }else if(typeof obj === 'boolean'){//boolean
      return Utils.T.BOOL;
    }else if(typeof obj === 'function' && obj.constructor && obj.constructor === Function){//function 
      return Utils.T.FUNC;
    }else if (typeof obj === 'object'){//Object
      if(obj.constructor && obj.constructor === Array){//array
        return Utils.T.ARRAY;
      }else if(obj.constructor && obj.constructor === RegExp){//regular expression
        return Utils.T.REGX;
      }else if(obj.constructor && obj.constructor === Date){//date
        return Utils.T.DATE;
      }else if(obj.constructor && obj.constructor === Object /*equals to obj instanceof Object*/){//instance
        return Utils.T.OBJ;
      }else{
        return Utils.T.INST;
      }
    }
    return null;
  },
  
  deepcopy : function(from, options){
    var target = null;
    switch(Utils.type(from)){
      case Utils.T.OBJ :
        target = {};
        for(var key in from){
          var prop = from[key];
          if(prop != null){
            target[key] = Utils.deepcopy(prop);
          }
        }
        break;
      case Utils.T.INST :
        target = Utils.cls.create(from.constructor);
        for(var key in from){
          if(from.hasOwnProperty(key)){//exclude properties from prototype
            var prop = from[key];
            if(prop != null){
              target[key] = Utils.deepcopy(prop);
            }
          }
        }
        break;
      case Utils.T.ARRAY :
        target = [];
        from.forEach(function(obj){
          target.push(Utils.deepcopy(obj));
        });
        break;
      default : //either string, number, booean, function, come to here
        target = from;
        break;
    }
    return target;
  },
  
  /**
   * Tojson helper
   * the purpose of this function is to automatically call toJson of the object's property,
   * and if property is an array, it will loop the array and call toJson for each element.
   * this function has no intend to make any deep copy of target object 
   * @param options contain
   *  excludeEmpty :  if an object is null or an array contains no element, then exclude it 
   */
  tj : function(from, options){
    var target = {};
    options = options ? options : {};
    var excludeEmpty = options.excludeEmpty != null ? options.excludeEmpty : true;
    for(var key in from){
      if(from.hasOwnProperty(key)){
        var prop = from[key];
        switch(Utils.type(prop)){
          case Utils.T.INST :
            if(prop.toJson){
              target[key] = prop.toJson();
            }else{
              target[key] = prop;
            }
            break;
          case Utils.T.ARRAY :
            if(!excludeEmpty || prop.length > 0){
              var copy = [];
              prop.forEach(function(obj){
                //simple check
                if(obj.toJson){
                  copy.push(obj.toJson());
                }else{
                  copy.push(obj);
                }
              });
              target[key] = copy;
            }
            break;
          default : 
            if(!excludeEmpty || prop != null){
              target[key] = prop;
            }
            break;
        }
      }
    }
    return target;
  },

  round : function(value, accuracy){
    accuracy = Utils.isEmpty(accuracy) ? 0 : accuracy;
    var e = Math.pow(10, accuracy);
    var v = (parseInt (value * e))/e;
    if((v > 0 && v < 1/e) || (v < 0 && v > -1/e)){
      v = 0;
    }
    return v;
  },
  
  /**
   * Partial apply, include the listed part only
   * @param target target to apply values
   * @param from is where the values are from
   * @param options contain
   *         keepDup true to retain the existed value in target but not override it by from object
   *         solver the customized function to copy object
   *         includes copy specify properties only
   *         regx regular expression to include
   *         excludeEmpty true to exclude Empty
   * @returns new target
   */
  include : function(target, from, options){
    options = options ? options : {};
    var keepDup = options.keepDup;
    var solver = options.solver;
    var includes = options.includes;
    var regx = (options.regx && (options.regx instanceof RegExp)) ? options.regx : null;
    var excludeEmpty = options.excludeEmpty != null ? options.excludeEmpty : true;
    for(var key in from){
      if((includes && includes.indexOf(key) >= 0) || regx && regx.test(key)){
        var value = solver ? solver(from[key]) : from[key];
        if((Utils.isEmpty(target[key]) || !keepDup) //check duplicate
            && (!excludeEmpty || value != null)){ //check exclude empty
            target[key] = value;
        }
      }
    }
    return target;
  },
  
  /**
   * Partial apply, copy those properties in which is not the list
   * @param target target to apply values
   * @param from is where the values are from
   * @param options contain
   *         keepDup true to retain the existed value in target but not override it by from object
   *         solver the customized function to copy object
   *         excludes copy those properties in which is not the list
   *         regx regular expression to exclude
   *         excludeEmpty true to exclude Empty
   * @returns new target
   */
  exclude : function(target, from, options){
    options = options ? options : {};
    var keepDup = options.keepDup;
    var solver = options.solver;
    var excludes = options.excludes;
    var regx = (options.regx && (options.regx instanceof RegExp)) ? options.regx : null;
    var excludeEmpty = options.excludeEmpty != null ? options.excludeEmpty : true;
    for(var key in from){
      if(excludes && excludes.length > 0){
        if(excludes.indexOf(key) >= 0){
          continue;
        }
      }
      if(regx && regx.test(key)){
        continue;
      }
      var value = solver ? solver(from[key]) : from[key];
      if((Utils.isEmpty(target[key]) || !keepDup) //check duplicate
          && (!excludeEmpty || value != null)){ //check exclude empty
          target[key] = value;
      }
    }
    return target;
  },

  /**
   * 
   * @param target target to apply values
   * @param from is where the values are from
   * @param keepDup refer to whether to override the existed value in target
   * @returns
   */
  apply : function(target, from, keepDup, solver){
    if(keepDup){
      for(var key in from){
        var value = solver ? solver(from[key]) : from[key];
        if(Utils.isEmpty(target[key]) && value != null){
          target[key] = value;
        }
      }
    }else{
      for(var key in from){
        var value = solver ? solver(from[key]) : from[key];
        if(!Utils.isEmpty(from[key]) && value != null){
          target[key] = value;
        }
      }
    }
    return target;
  },
  
  /**
   * Build ascend queue of descend queue
   * @param ps
   * @param point
   * @param prop
   */
  buildQ : function(point, prop, ps, ascend){
    if(!ps || !point || !prop || point[prop] == null || isNaN(point[prop])){
      return;
    }
    //default as ascend sort
    if(ascend == null){
      ascend = true;
    }
    var len = ps.length;
    //point's property to compare with
    var pp = point[prop];
    //candidate point to compare with pp
    var cp = null;
    if(len == 0){
      ps.push(point);
    }else if(len == 1){
      cp = ps[0];
      var cpp = cp[prop];
      if(cpp < pp){
        ps.push(point);
      }else{
        ps.unshift(point);
      }
    }else if(len >= 2){
      var start = 0;// >= start
      var end = len - 1;// < end
      if(pp <= ps[start][prop]){
          //add to the begining
          ps.unshift(point);
      }else if(pp >= ps[end][prop]){
          //add to last one
          ps.push(point);
      }else{
        while(true){
          //number of elements in array ps
          var numofEl = end - start + 1;
          //the middle key of array;
          var mid = parseInt(numofEl / 2) + start;
          //the object in the array's middle
          var midp = ps[mid];
          //middle point property
          var mpp = midp[prop];
          if( mpp == pp){
            //add before middle point
            ps.splice(mid, 0, point);
            break;
          }else if(mpp > pp){
            if(numofEl < 3){
              ps.splice(mid, 0, point);
              break;
            }else{
              end = mid;
            }
          }else if(mpp < pp){
            if(numofEl < 3){
              ps.splice(mid + 1, 0, point);
              break;
            }else{
              start = mid;
            }
          }
        }
      }
    }else{
      //DO NOTHING
    }
  },
  
  /**
   * To get the curve path
   * 
   * @test Utils.getCurvePath({x : 0, y :0}, {x : 100, y :0}, 20, 40) "M 0 0 C 0
   *       20 30 20 50 20 S 100 20 100 0" Utils.getCurvePath({x : 0, y :0}, {x :
   *       100, y :0}, 20, 50) "M 0 0 C 0 20 25 20 50 20 S 100 20 100 0"
   *       Utils.getCurvePath({x : 0, y :0}, {x : 100, y :0}, 20, 60) "M 0 0 C 0
   *       20 20 20 50 20 S 100 20 100 0" Utils.getCurvePath({x : 0, y :0}, {x :
   *       100, y :0}, 20, 20) "M 0 0 C 0 20 40 20 50 20 S 100 20 100 0"
   *       Utils.getCurvePath({x : 0, y :0}, {x : 100, y :100}, 20, 20) "M 0 0 C
   *       0 20 40 70 50 70 S 100 70 100 100"
   * @param startP
   * @param endP
   * @param curveHeight
   * @param curveWidth
   * @returns
   */
  getCurvePath : function(startP, endP, curveHeight, curveWidth) {
    var me = this;
    var angle = - me.getAngle(startP, endP);
    var disXY = me.getDisXY(startP, endP);
    var midPoint = {
      x : disXY / 2,
      y : curveHeight
    };
    var oringPoints = [/* P0 */OP, /* P1 */{
      x : 0,
      y : curveHeight
    },
    /* P2 */{
      x : midPoint.x - curveWidth / 2,
      y : midPoint.y
    },
    /* P3 */{
      x : midPoint.x,
      y : midPoint.y
    },
    /* P4 */{
      x : disXY,
      y : curveHeight
    }, /* P5 */OP.add(disXY, 0) ];
    var points = [];
    Ext.each(oringPoints, function(point) {
      points.push(me.rotate(point, angle, OP, startP));
    });
    var path = [ "M", points[0].x, points[0].y, "C", points[1].x, points[1].y,
        points[2].x, points[2].y, points[3].x, points[3].y, "S", points[4].x,
        points[4].y, points[5].x, points[5].y ].join(' ');
    var pathObj = {
      path : path,
      points : points
    };
    // console.log('Synapse path:'+ path);
    return pathObj;
  },

  rotate : function(point, angle, originPoint, offset) {
    offset = offset ? offset : OP;
    originPoint = originPoint ? originPoint : OP;
    var relativeX = point.x - originPoint.x;
    var relativeY = point.y - originPoint.y;
    return {
      x : relativeX * Math.cos(angle) + relativeY * Math.sin(angle) + offset.x,
      y : relativeY * Math.cos(angle) - relativeX * Math.sin(angle) + offset.y
    };
  },

  /**
   * end Point to start
   * @param startP
   * @param endP
   * @param offset
   * @returns {Number}
   */
  getAngle : function(startP, endP, offset) {
    var disX = this.getDisX(startP, endP);
    var disY = this.getDisY(startP, endP);
    var angle = 0;
    angle = Math.atan2(disY, disX) + (Utils.isEmpty(offset) ? 0 : offset);
    // console.log(angle*180/3.14);
    return angle;
  },

  getDisX : function(startP, endP) {
    return endP.x - startP.x;
  },

  getDisY : function(startP, endP) {
    return endP.y - startP.y;
  },

  getDisXY : function(startP, endP) {
    var disX = this.getDisX(startP, endP);
    var disY = this.getDisY(startP, endP);
    return Math.sqrt(disX * disX + disY * disY);
  },

  /**
   * Desc : this is the util to generate triagle path
   * 
   * @param startP
   *          of angle
   * @param endP
   *          of angel
   * @param sideLength
   *          is the side length of triagle
   */
  getTriPath : function(startP, endP, sideLength) {
    var me = this;
    var pi = Math.PI;
    var angle = -this.getAngle(startP, endP, pi * 0.5);// anti-clockwise 90
    // degree as offset;
    // triangle has 3 points, 1 is p0 which is origin point, p1, p2 is the rest
    var cosLengh = Math.cos(pi / 6);
    var p1 = {
      x : sideLength * 0.5,
      y : sideLength * cosLengh
    };
    var p2 = {
      x : -sideLength * 0.5,
      y : sideLength * cosLengh
    };
    var origPoints = [ OP, OP.add(p1.x, p1.y), OP.add(p2.x, p2.y)];
    var points = [];
    Ext.each(origPoints, function(point) {
      points.push(me.rotate(point, angle, OP, startP));
    });
    var path = [ 'M', points[0].x, points[0].y, 'L', points[1].x, points[1].y,
        'L', points[2].x, points[2].y, 'z' ].join(' ');
    var pathObj = {
      path : path,
      points : points
    };
    // console.log('tri path' + path);
    return pathObj;
  }
};
/**
 * Inspired By John Resig
 * 1 inheritable : the child can reuse method and properties without re-define them
 * 2 isolate : each instance has their own copy of prototype properties, change of these properties will not impact prototype
 * 3 call parent in the method body
 * 4 you can pass the parameters to the parent if you like
 * Test Case
  C = Utils.cls.extend(Observable, {c :3, cf: function(){return this.c}, init : function(){console.log('init C')}})
  B = Utils.cls.extend(C, {a : 2, init : function(){console.log('init B'); this.callParent()}}) 
  b = Utils.cls.create(B)
 */
Utils.cls = {
  /**
   * @param parentClass 
   * @param configs configures of child class
   */
  extend : function(parentClass, configs){
    var me = this;
    //init some usefull constants
    var CLASS_ALIAS = 'alias';
    var hasCallParent = /xyz/.test(function(){xyz;}) ? /\bcallParent\b/ : /.*/;
    var hasSet = /^set\$(?=([A-Za-z]+$))/;//prefix is set$ and end with characters
    var hasGet = /^get\$(?=([A-Za-z]+$))/;//prefix is get$ and end with characters
    
    //keep useful informations
    var parentParent = parentClass.prototype;
    var parentInst = new parentClass();
    var constructorProps = {};
    
    //loop through user-define properties or functions
    for (var name in configs) {
      var configItem = configs[name];
      // all the functions will be copied to current class's prototype
      if(configItem != null && Utils.isFunction(configItem)){
        //Check if we're overwriting an existing function
        //and whether this function contains callParent
        if(!Utils.isEmpty(parentInst[name]) && hasCallParent.test(configItem)){
          parentInst[name] = (function(name, fn){
            return function() {
              /*  
               * in case call parent is call twice from 
               * one function like 
               * function a(){
               *   b();
               *   this.callParent();
               * },
               * 
               * function b(){
               *   this.callParent();
               * }
               * */
              var tmp = this.callParent;
              //replace the callParent method with correct parent method
              this.callParent = parentParent[name];
              //call the function, and at the same time, callParent is called
              var ret = fn.apply(this, arguments);
              //recover previous call parent
              this.callParent = tmp;
              return ret;
            };
          })(name, configItem);
        }else if(hasSet.test(name)){
          ///^set\$(?=([A-Za-z]+$))/.exec('set$abv') should return ["set$", "abv"]
          var regx = hasSet.exec(name);
          var proportyName = regx && regx.length > 1 ? regx[1] : null;
          if(proportyName){
            Object.defineProperty(parentInst, proportyName, {
              set : configItem,
              enumerable : false,
              configurable : true
            });
          }
        }else if(hasGet.test(name)){
          var regx = hasGet.exec(name);
          var proportyName = regx && regx.length > 1 ? regx[1] : null;
          if(proportyName){
            Object.defineProperty(parentInst, proportyName, {
              get : configItem,
              enumerable : false,
              configurable : true
            });
          }
        }else{//the function name in configs without callParent() or set$, get$ prefix
          parentInst[name] = configItem;
        }
      }else{
        //make deepcopy , so we can isolate the properties from prototype
        constructorProps[name] = Utils.deepcopy(configItem);
      }
    }
    
    //copy properties from parent Classs instance, 
    for(var name in parentInst){
      var p = parentInst[name];
      if(!Utils.isFunction(p)){
        //'cls' is a key word of class system, skip it 
        if(name !== CLASS_ALIAS){
          constructorProps[name] = Utils.deepcopy(p);
        }
      }
    }
    // set the properties in the constructor, so the properties change will not affect prototype
    //must use deep copy to copy the props config, otherwise, the prop will be changed during runtime
    var holder = {};
    //check null and replace all non-charactors case-insensitive but keep $
    var clsName = configs[CLASS_ALIAS] == null ? '' : configs[CLASS_ALIAS].replace(/[^A-Za-z$_]+/gi, '');
    var expName = (clsName == '') ? 'ChildClass' : clsName;
    var evalStr = 'holder["'+ expName +'"] = function ' + clsName + '(){ Utils.apply(this, Utils.deepcopy(constructorProps));}';
    var cls = null;
    try{
      eval(evalStr);
      cls = holder[expName];
      cls.prototype = parentInst;
      cls.prototype.constructor = cls;
    }catch(e){
      console.log(e);
    }
    return cls;//a function
  },
  
  /**
   * equal to new then call init()
   */
  create : function(classDef, valConfig, mixins){
    var instance = new classDef();
    if(mixins && Utils.isArray(mixins) && mixins.length > 0){
      mixins.forEach(function(cls){
        var mixin = new cls();
        //never override instance properties and function with mixin's
        Utils.apply(instance, mixin, true);
      });
    }
    if(!Utils.isEmpty(valConfig)){
      Utils.apply(instance, valConfig);
    }
    if(!Utils.isEmpty(instance.init) && Utils.isFunction(instance.init)){
      instance.init.call(instance, valConfig);
    }
    return instance;// an object
  }
};


/**
 * Utility to Set up rules
 */
var RulesEngine = Utils.cls.extend(Observable, {
  _scope : null,

  check : function(ruleName, config){
    var rs = this.fireEvent(ruleName, config);
    var isValid = true;
    rs.every(function(r){
      var result = r.result;
      var operator = r.opt;
      isValid = operator == '&&' ? isValid && result : isValid || result; 
    });
    return isValid;
  },
  
  /**
   * rule = {name : name, desc : desc, opt : opt, fn : fn}
   * @param rule
   */
  add : function(rule){
    var name = rule.name;
    var operator = rule.opt;
    var fn = rule.fn;
    this.on(name, function(obj, name, target){
      return {result : fn.apply(this.scope, obj, target), opt : operator};
    });
  },
  
  get$scope : function(){
    return this._scope;
  },
  
  set$scope : function(v){
    this._scope = v;
  }
});


/**
 * This class mainly work as data manipulation, 
 * to create a virtual world data, which is used 
 * for present visual world
 */
World = {
  create : function(config){
    return Utils.cls.create(World.World, config);
  }
};


World.Object = Utils.cls.extend(Observable, {
  alias : 'World_Object',
  _x : 0,
  _y : 0,
  _z : 0
});

World.Object.prototype.__defineSetter__('x', function(v){this._x = parseInt(v);});
World.Object.prototype.__defineSetter__('y', function(v){this._y = parseInt(v);});
World.Object.prototype.__defineSetter__('z', function(v){this._z = parseInt(v);});
World.Object.prototype.__defineGetter__('x', function(){return this._x;});
World.Object.prototype.__defineGetter__('y', function(){return this._y;});
World.Object.prototype.__defineGetter__('z', function(){return this._z;});

World.World = Utils.cls.extend(World.Object, {
  
  alias : 'World_World',
  
  iidor : new Iid(),
  links : {},
  points : {},
  
  indexer : null,
  
  //TODO
  boundary : null,
  /**
   * Global force apply to all
   */
  gForce : null,
  
  //resistant force, the smaller, swamper 
  resistance : 0.1, 
  //below is for the crash detector
  subW : {},
  minSubW : 0,
  bWSize : 20,
  worldCapacity : 4,
  
  init : function(config){
    Utils.apply(this, config);
    this.indexer = new Indexer(); 
  },
  
  //TODO this create sub new world to check crash
  newChild : function(){
    
  },
  
  add : function(config){
    var me = this;
    if(config.type == 'point'){
      var p = Utils.cls.create(World.Point, Utils.apply({world : this, iid : this.iidor.get()}, config));
      p.on({'onDestroy' : {fn : me.remove, scope : me}});
      //TODO lazy crash detect don't know why, this is just not working
      //p.on({'onMove' : {fn : me.detectCrash, scope : me}});
      this.points[p.iid] = p;
      if(!Utils.isEmpty(this.gForce) && p.isApplyGForce){
        this.gLink(p);
      }
      this.fireEvent('onAdd', {type : config.type, obj :p});
      return p;
    }else if(config.type == 'ant'){
      var ant = Utils.cls.create(Creature.Ant, Utils.apply({world : this, iid : this.iidor.get()}, config));
      ant.on({'onDestroy' : {fn : me.remove, scope : me}});
      this.points[ant.iid] = ant;
      this.fireEvent('onAdd', {type : config.type, obj :ant});
      return ant;
    }else if(config.type == 'life'){
      var life = Utils.cls.create(Creature.Life, Utils.apply({world : this, iid : this.iidor.get()}, config));
      life.on({'onDestroy' : {fn : me.remove, scope : me}});
      this.points[life.iid] = life;
      this.fireEvent('onAdd', {type : config.type, obj : life});
      return life;
    }else if(config.type == 'triangle'){
      var tri = Utils.cls.create(World.Triangle, Utils.apply({world : this, iid : this.iidor.get()}, config));
      tri.on({'onDestroy' : {fn : me.remove, scope : me}});
      this.points[tri.iid] = tri;
      this.fireEvent('onAdd', {type : config.type, obj : tri});
      return tri;
    }else if(config.type == 'circle'){
      var circle = Utils.cls.create(World.Circle, Utils.apply({world : this, iid : this.iidor.get()}, config));
      circle.on({'onDestroy' : {fn : me.remove, scope : me}});
      this.points[circle.iid] = circle;
      this.fireEvent('onAdd', {type : config.type, obj : circle});
      return circle;
    }else if(config.type == 'line'){
      var line = Utils.cls.create(World.Line, Utils.apply({world : this, iid : this.iidor.get()}, config));
      line.on({'onDestroy' : {fn : me.remove, scope : me}});
      this.points[line.iid] = line;
      this.fireEvent('onAdd', {type : config.type, obj : line});
      return line;
    }else if(config.type == 'polygon'){
      var polygon = Utils.cls.create(World.Polygon, Utils.apply({world : this, iid : this.iidor.get()}, config));
      polygon.on({'onDestroy' : {fn : me.remove, scope : me}});
      this.points[polygon.iid] = polygon;
      this.fireEvent('onAdd', {type : config.type, obj : polygon});
      return polygon;
    }
  },
  
  remove : function(obj){
    if(Utils.isEmpty(obj))return;
    obj.removeAllListeners();
    if(obj instanceof World.Point){
      delete this.points[obj.iid];
      this.fireEvent('onRemove', 'point', obj.iid);
    }else if(obj instanceof World.Link){
      delete this.links[obj.iid];
      this.fireEvent('onRemove', 'link', obj.iid);
    }
    obj = null;
  },
  
  tick : function(){
    for(var key in this.links){
      var l = this.links[key];
      l.calc();
    }
    for(var key in this.points){
      var p = this.points[key];
      p.move();
    }
  },
  
  link :  function(config){
//    console.log(Object.keys(this.links).length);
    var pre = config.pre;
    var post = config.post;
    var link = null;
    if(pre && post && pre != post 
        && Utils.isEmpty(pre.getIw(post)) 
        && Utils.isEmpty(post.getIw(pre))){
      link = Utils.cls.create(World.Link, Utils.apply({world : this, iid : this.iidor.get()}, config));
      pre.setIw(post, link);
      post.setIw(pre, link);
      link.on({'onDestroy' : {fn : this.remove, scope :this}});
      this.links[link.iid] = link;
      this.fireEvent('onAdd', {type : 'link', obj : link});
    }else{
      link = pre.getIw(post);
    }
    return link;
  },
  
  gLink : function(point){
    var config = {post : point,  unitForce : 1, elasticity : 0.8, maxEffDis : 2000, distance : 0,
        isDual: false, isBreakable : false};
    var link = Utils.cls.create(World.ForceLink, 
        Utils.apply({world : this, iid : this.iidor.get(), force : this.gForce}, config));
    link.on({'onDestroy' : {fn : this.remove, scope :this}});
    this.links[link.iid] = link;
    this.fireEvent('onAdd', {type : 'link', obj : link});
    return link;
  },
  
  surfaceLink : function(pre, post){
    // NOTES : about the repeat time and maxEffDis, they are experiment value, 
    // which help to stable the crash objects 
    var defaultSfc = { 
        unitForce : 1, elasticity : 0.01, 
        //TODO don't know how far is good , 10?
        distance : 1, 
        maxEffDis : 1/*see notes above*//*, 
        repeat : 10*//*see notes above*/};

    var preSfc = Utils.isEmpty(pre.surfaceLinkConfig) ? defaultSfc : pre.surfaceLinkConfig;
    var postSfc = Utils.isEmpty(post.surfaceLinkConfig) ? defaultSfc : post.surfaceLinkConfig;
    var mergeLink = {};
    for(var key in defaultSfc){
      mergeLink[key] = (preSfc[key] + postSfc[key])/2;
    }
    if(!pre.isCrashable && post.isCrashable){
      return this.link(Utils.apply(mergeLink, {pre : pre, post : post, isDual: false}));
    }else if(pre.isCrashable && !post.isCrashable){
      return this.link(Utils.apply(mergeLink, {pre : post, post : pre, isDual: false}));
    }else if(pre.isCrashable && post.isCrashable){
      return this.link(Utils.apply(mergeLink, {pre : post, post : pre, isDual: true}));
    }
  },
  
  getData : function(){
    var ps = {};
    for(var key in this.points){
      ps[key] = this.points[key].toJson();
    }
    return ps;
  },
  
  toJson : function(){
    return {iid : this.iid};
  }
});

World.Point = Utils.cls.extend(World.Object, {
  
  alias : 'World_Point',
  
  vx : 0,
  vy : 0,
  vz : 0,
  
  config : null,
  
  world : null,
  
  /**
   * Sub points
   */
  points : {},
  
  
  /**
   * True to anchor object to screen
   */
  isAnchor : false,
  
  /**
   * which group is this point belongs to, 
   * usually the object
   */
  group : null,
  
  weight : 1,
  
  visible : true,
  
  /**
   * Whether isCrashable with other points in the same group
   */
  isGroupCrash : false,
  
  isCrashable : true,
  /**
   * Define the circle crash-detect area with radius
   */
  crashRadius : 10,
  
  /**
   * for internal use, to check whether is in crashing
   */
  isCrashing : false,
  
  isPenetrated : false,
  
  /**
   * for internal use, to check whether is in moving
   */
  isMoving : false,
  
  /**
   * mark this point as destroyed and don't calculate in the link
   */
  destroyed : false,
  
  iid : 0,
  
  /**
   * description of this point
   */
  text : '',
  /**
   * link will destroy this point if set true
   */
  goneWithLink : false,
  
  /**
   * this is the configuration that define the surface feature of current point.
   * this configuration will be used by link which is created when the point crash other points
   */
  surfaceLinkConfig : null,
  
  /**
   * whether to apply global force
   */
  isApplyGForce : true,
  
  /**
   * record the object that currently interact with and the corresponding link.
   * this is to avoid adding duplicate link with the same object.
   * key : the iid
   * value : the link
   */
  interactWith : {},
  
  init : function(config){
    this.config = config;
    Utils.apply(this, config);
    this.world.indexer.add(this);
  },

  move : function(){
//    console.log('move to : x =' + this.x + '  y =' + this.y);
//    console.log('speed  : vx =' + this.vx + '  vy =' + this.vy);
    var me = this;
    var ds = {x : 'x', y : 'y', z : 'z'};
    for(var d in ds){
      if(me['v' + d] != 0){
        var len = Math.abs(me['v' + d]);
        var i = 0;
        var dir = me['v' + d] > 0 ? 1 : -1;
        var pos = 0;
        var testP = null;
        var isCrashed = false;
        while(i*dir < len){
          i += dir;
          pos = OP.add(parseInt(me.x), parseInt(me.y), parseInt(me.z));
          pos[d] += i;
          testP = me.world.indexer.get(pos, d);
          if(!Utils.isEmpty(testP)){
            pos[d] += -dir;
            isCrashed = true;
            break;
          }
        }
        me['old' + d] = me[d];
        this.world.indexer.remove(me);
        me[d] = pos[d];
        this.world.indexer.add(me);
        if(isCrashed && !Utils.isEmpty(testP)){
          if(!this.isCrashable && testP.isCrashable){
            if(!testP.isAnchor)
              testP['v' + d] = parseInt(testP['v' + d] > 0 ? -testP['v' + d] : testP['v' + d]);
          }else if(this.isCrashable && !testP.isCrashable){
            if(!this.isAnchor)
              this['v' + d] = parseInt(this['v' + d] > 0 ? -this['v' + d] : this['v' + d]);
          }else if(this.isCrashable && testP.isCrashable){
            var avg = Math.abs(this['v' + d] + testP['v' + d])/2;
            if(!this.isAnchor)
              this['v' + d] = parseInt(this['v' + d] > 0 ? -avg : avg);
            if(!testP.isAnchor)
              testP['v' + d] = parseInt(testP['v' + d] > 0 ? -avg : avg);
          }
          me.world.surfaceLink(me, testP);
        }
        me.isMoving = true;
//        me.fireEvent('onMove', me/*{obj : me, axis : d}*/);
      }
    }
  },
  
  link2 : function(post, config){
    return this.world.link(Utils.apply({pre : this, post : post}, config));
  },
  
  /**
   * This is a customized crash handler
   */
  crashHandler : function(point){
    if(Utils.isEmpty(this.getIw(point))){
      this.world.surfaceLink(this, point);
    }
  },
  
  /**
   * IW is short for get Interact With
   * set the link between this and the object that currently interact with
   */
  setIw : function(point, link){
    this.interactWith[point.iid] = link;
  },
  
  /**
   * IW is short for get Interact With
   * get the link between this and the object that currently interact with
   */
  getIw : function(point){
    return this.interactWith[point.iid];
  },
  
  /**
   * IW is short for get Interact With
   * get the link between this and the object that currently interact with
   */
  rmIw : function(point){
    if(!Utils.isEmpty(this.getIw(point))){
      delete this.interactWith[point.iid];
    }
  },
  
  /**
   * Check candidate point and its parent to see whether is the same group
   */
  isSameGroup : function(point){
    //search to the top of the inherent tree, if this is root, the group should be null
    if(!Utils.isEmpty(this.group)){
      return point.group == this || this.group.isSameGroup(point);
    }else {
      return point.group == this;
    }
  },
  
  destroy : function(){
    //for link to use, usually, the link with current point will not be update immediately 
    //after this point has been removed
    this.destroyed = true;
    this.fireEvent('onDestroy', this);
  },
  
  toJson : function(){
    var points = {};
    for(var key in this.points){
      points[key] = this.points[key].toJson();
    }
    return {
      iid : this.iid,
      x : this.x,
      y : this.y,
      z : this.z,
      text : this.text,
      visible : this.visible,
      points : points
    };
  }
});

World.Triangle = Utils.cls.extend(World.Point, {
  
  alias : 'World_Triangle',
  
  /**
   * Top point
   */
  top : null,
  /**
   * left point
   */
  left : null,
  /**
   * right point
   */
  right : null,
  
  /**
   * Side Top to right
   */
  sdTopRt : null,
  
  /**
   * Side Top to right
   */
  sdRtLf : null,
  
  /**
   * Side Top to right
   */
  sdLfTop : null,
  
  init : function(config){
    this.callParent(config);
    //make default value to config
    Utils.apply(config, {unitForce : 0.5, elasticity : 0.5, maxEffDis : 2000}, true);
    this.top = this.createPoint(config.top, 'top');
    this.left = this.createPoint(config.left, 'left');
    this.right = this.createPoint(config.right, 'right');
    this.genOnPoints(config);
  },
  
  createPoint : function(point, name){
    if(!(point instanceof World.Point)){
      point = this.world.add({
        type : 'point', 
        text : name,
        group : this,
        isGroupCrash : false,
        isApplyGForce : this.config.isApplyGForce,//oome in with config
        x : this.x + point.x, y : this.y + point.y, z : this.z + point.z,
      });
    }
    return point;
  },
  
  genOnPoints : function(config){
    this.sdTopRt = this.world.link({pre : this.top, post : this.right, 
      unitForce : config.unitForce, elasticity : config.elasticity, 
      distance : Utils.getDisXY(this.top, this.right), 
      maxEffDis : config.maxEffDis, 
      isDual: true});
    this.sdRtLf = this.world.link({pre : this.right, post : this.left, 
      unitForce : config.unitForce, elasticity : config.elasticity, 
      distance : Utils.getDisXY(this.right, this.left), 
      maxEffDis : config.maxEffDis, 
      isDual: true});
    this.sdLfTop = this.world.link({pre : this.left, post : this.top, 
      unitForce : config.unitForce, elasticity : config.elasticity, 
      distance : Utils.getDisXY(this.left, this.top), 
      maxEffDis : config.maxEffDis, 
      isDual: true});
  }
});

World.Circle = Utils.cls.extend(World.Point, {
  
  alias : 'World_Circle',
  
  radius : 10,
  /**
   * minimum is 3
   */
  edges : 3,
  
  //  World.Circle.prototype.constructor.call(World.Circle.prototype, config);
  init : function(config){
    this.text = 'center';
    this.callParent(config);
    //make default value to config
    Utils.apply(config, {unitForce : 0.5, elasticity : 0.5, maxEffDis : 2000}, true);
    Utils.apply(this, config);
    this.gen(config);
  },
  
  gen : function(config){
    var me = this;
    var edges = (this.edges > 2 ) ? this.edges : 3;
    var radiusStep = 2 * Math.PI / edges;
    var head = null;
    var prePoint = null;
    //distance to pre point, which is the same
    var dis2Pre = null;
    var radius = this.radius;
    for(var i = 0; i < edges ; i++){
      var angle = radiusStep * i;
      
      var px = radius * Math.cos(angle);
      var py = radius * Math.sin(angle);
      var pz = 0;
      var point = this.world.add({
        type : 'point', 
        group : me,
        isGroupCrash : false,
        isApplyGForce : this.config.isApplyGForce,//oome in with config
        x : me.x + px, y : me.y + py, z : me.z + pz,
      });
      this.points[point.iid] = point;
      head = !Utils.isEmpty(head) ? head : point;
      
      this.world.link({pre : me, post : point, 
        unitForce : config.unitForce, elasticity : config.elasticity, 
        distance : radius, 
        maxEffDis : config.maxEffDis, 
        isDual: !this.isAnchor});
      if(prePoint){
        dis2Pre = !Utils.isEmpty(dis2Pre) ? dis2Pre : Utils.getDisXY(prePoint, point);
        this.world.link({pre : prePoint, post : point, 
          unitForce : config.unitForce, elasticity : config.elasticity, 
          distance : dis2Pre, 
          maxEffDis : config.maxEffDis, 
          isDual: true});
      }
      prePoint = point;
    }
    this.world.link({pre : prePoint, post : head, 
      unitForce : config.unitForce, elasticity : config.elasticity, 
      distance : dis2Pre, 
      maxEffDis : config.maxEffDis, 
      isDual: true});
  }

});

World.Line = Utils.cls.extend(World.Point, {
  
  alias : 'World_Line',
  /**
   * Start Point
   */
  start : null,
  
  end :  null,
  
  /**
   * Line is bind to link, if link destroy, line should be destroy too
   * Whehter to build new link between start and end
   * usually in the polygen, this is set to false, because there are links between points in polygon
   */
  internalLink : null,
  
  init : function(config){
    this.callParent(config);
    this.isCrashable = false;
    this.isGroupCrash = false;
    this.visible = false;
    this.gen(config);
  },
  
  isCrashed : function(point){
    if(point.isCrashable && point.x > (this.start.x > this.end.x ? this.end.x : this.start.x) 
        && point.x <= (this.start.x > this.end.x ? this.start.x : this.end.x) 
        || this.start.x == this.end.x)
    {
      var angle = Utils.getAngle(this.start, this.end);
//    console.log(angle * 180 / Math.PI);
      var np = Utils.rotate(point, angle, this.start);
//      console.log('point ' + np.x + "-" + np.y);
      if(Math.abs(np.y) < (this.crashRadius + point.crashRadius)){
//        console.log('crashed');
        this.world.link({pre : this.start, post : point, 
          unitForce : 1, elasticity : 0.9, 
          distance : Utils.getDisXY(point, this.start), 
          maxEffDis : 3, 
          isDual: false});
        this.world.link({pre : this.end, post : point, 
          unitForce : 1, elasticity : 0.9, 
          distance : Utils.getDisXY(point, this.end), 
          maxEffDis : 3, 
          isDual: false});
        this.isCrashing = true;
        this.fireEvent('onCrashed', point, this);
      }else{
        this.isCrashing = false;
      }
    }
    
    return this.isCrashing;
  }, 

  gen : function(config){
    this.start = this.createPoint(config.start, 'start');
    this.start.on('onMove', this.updateCenterPt, this);
    this.end = this.createPoint(config.end, 'end');
    this.start.on('onMove', this.updateCenterPt, this);
    this.setLink();
    this.updateCenterPt();
  },
  
  setLink : function(){
    var dis = Utils.getDisXY(this.start, this.end);
    var config = this.config;
    this.internalLink = this.getLink();
    if(Utils.isEmpty(this.internalLink)){
      this.internalLink = this.world.link({pre : this.start, post : this.end, 
        unitForce : config.unitForce, elasticity : config.elasticity, 
        distance : dis,
        maxEffDis : config.maxEffDis, 
        isDual: true});
    }
    this.internalLink.on('onDestroy', this.destroy, this);
    return this.internalLink;
  },
  
  /**
   * check whether this.internalLink has assigned value by config
   * and check whether start has link to end
   */
  getLink : function(){
    var link = this.internalLink 
      ||this.start.getIw(this.end) || this.end.getIw(this.start);
    return link;
  },
  
  //once start or end point moved, we update the 
  updateCenterPt : function(){
    this.x = (this.start.x  + this.end.x) / 2;
    this.y = (this.start.y  + this.end.y) / 2;
    this.z = (this.start.z  + this.end.z) / 2; 
    this.isMoving = true;
    this.fireEvent('onMove', this);
  },
  
  crashHandler : function(point){
//    point.destroy();
  },
  
  createPoint : function(point, name){
    if(!(point instanceof World.Point)){
      point = this.world.add({
        type : 'point', 
        text : name,
        group : this,
        isGroupCrash : false,
        isCrashable : false,
        isApplyGForce : this.config.isApplyGForce,//oome in with config
        x : point.x, y : point.y, z : point.z,
      });
    }
    return point;
  },
  
  toJson : function(){
    return Utils.apply({
      start : this.start.toJson(),
      end : this.end.toJson()
    },
    this.callParent());
  }
});

World.Polygon = Utils.cls.extend(World.Point, {
  /**
   * keep location information of points
   */
  pointArray : null,
  
  /**
   * set 2 for 2d, set 3 for 3d
   */
  dimension : 2,
  
  init : function(config){
    this.callParent(config);
    this.visible = false;
    this.gen(config);
  },
  
  gen : function(config){
    if(!Utils.isEmpty(this.pointArray) && Utils.isArray(this.pointArray) && this.pointArray.length > 0){
      this.createPoints();
      this.createLinks();
      this.createBoundary();
    }
  },
  
  createBoundary : function(){
    var keys = Object.keys(this.points);
    var len = keys.length;
    var preP = null;
    var currentP = null;
    var headP = null;
    for(var ikeyArray = 0; ikeyArray < len; ikeyArray++){
      currentP = this.points[keys[ikeyArray]];
      if(preP){
        //IMPORTANT : create boundary
        this.line(preP, currentP);
      }else{
        headP = currentP;
      }
      preP = currentP;
    }
    this.line(preP, headP);
  },
  
  createLinks : function(){
    var keys = Object.keys(this.points);
    var len = keys.length;
    var preP = null;
    var currentP = null;
    for(var ikeyArray = 0; ikeyArray < len; ikeyArray++){
      currentP = this.points[keys[ikeyArray]];
      if(preP){
        this.link(preP, currentP);
        //trace back to the previouse points and link them
        var backLen = ikeyArray - this.dimension + 1;
        for(var isubKeyArray = 0; isubKeyArray < backLen; isubKeyArray++){
          var backTracP = this.points[keys[isubKeyArray]];
          this.link(currentP, backTracP);
        }
      }
      preP = currentP;
    }
  },
  
  /**
   * this create boundary by creating World.Line between two points
   */
  line :function(currentP, preP){
    this.world.add({
      type : 'line',
      start : preP,
      end : currentP,
      isApplyGForce : false,
      unitForce : 1, elasticity : 0.1, maxEffDis : 1
    });
  },
  
  link : function(currentP, backTracP){
    var dis = Utils.getDisXY(currentP, backTracP);
    return this.world.link({
      pre : currentP, post : backTracP, 
      unitForce : this.config.unitForce, 
      elasticity : this.config.elasticity, 
      distance : dis,
      maxEffDis : this.config.maxEffDis, 
      isDual: true});
  },
  
  createPoints : function(){
    var len = this.pointArray.length;
    for(var i = 0; i < len; i++){
      var currentP = this.createPoint(this.pointArray[i]);
      this.points[currentP.iid] = currentP;
    }
  },
  
  createPoint : function(point, name){
    if(!(point instanceof World.Point)){
      point = this.world.add({
        type : 'point', 
        text : name,
        group : this,
        isGroupCrash : false,
        isCrashable : this.isCrashable,
        isApplyGForce : this.isApplyGForce,//oome in with config
        x : point.x, y : point.y, z : point.z,
      });
    }
    return point;
  }
});

World.Force = Utils.cls.extend(Observable, {
  direction : null,
  /**
   * force value
   */
  value : 0,
  angle : 0,

  init : function(config){
    Utils.apply(this, config);
    this.calc();
  },
  
  setValue : function(value){
    this.value = value;
    this.calc();
    this.fireEvent('valueChange', value);
  },
  
  setDir : function(value){
    this.direction = value;
    this.calc();
    this.fireEvent('dirChange', value);
  },
  
  calc : function(){
    if(!Utils.isEmpty(this.value) && !Utils.isEmpty(this.direction)){
      this.angle = Utils.getAngle(OP, this.direction);
      this.fx = this.value * Math.cos(this.angle);
      this.fy = this.value * Math.sin(this.angle);
      this.fz = 0;
    }
  }
});

World.LinkType = {S : 'softLink', H : 'hardLink', B : 'bounceLink'};
/**
 * 
 * @param pre previous point
 * @param post post point
 * @returns {World.Link}
 */
World.Link = Utils.cls.extend(Observable, {
  iid : 0,
  world : null,
  /**
   * The points to follow when isDual set to false
   */
  pre : null,
  /**
   * Follower
   */
  post : null,
  distance : 10,
  
  /**
   * link will be broken when : realDistance - this.distance < minEffDis
   * minus number means that the link can be shrink to as far as 100 from point defined by this.distance
   */
  minEffDis : -100, 
  
  /**
   * link will be broken when : realDistance - this.distance > maxEffDis
   */
  maxEffDis : 100,

  isBreakable : true,
  isDual : true,
  
  unitForce : 2,
  //smaller harder
  elasticity : 0.9,
  
  type : World.LinkType.S,
  
  repeat : 0,
  
  repeatedCount : 0,
  
  fn : {x : Math.cos, y : Math.sin/*, z : Math.sin*/},
  
  init : function(config){
    Utils.apply(this, config);
  },
  
  calc : function() {
//    console.log('calc');
    var pre = this.pre;
    var post = this.post;
    if(Utils.isEmpty(pre) || Utils.isEmpty(post) || pre.destroyed || post.destroyed){
      this.destroy();
      return;
    }
    var linkType = this.type;
    var linkImpl = Utils.isFunction(this[linkType]) ? this[linkType] : {};
    if(this.checkBreakForce()){
      if(this.isBreakable){
        this.destroy();
      }
    }else{
      for(var key in this.fn){
        post['v' + key] = parseInt(post['v' + key] * this.world.resistance); 
      }
      for(var key in this.fn){
        pre['v' + key] = parseInt(pre['v' + key] * this.world.resistance); 
      }
      var postv = null;
      if(!post.isAnchor){
        postv = linkImpl.call(this, pre, post);
      }
      
      var prev = null;
      if(this.isDual && !pre.isAnchor){
        prev = linkImpl.call(this, post, pre);
      }
      Utils.apply(post, postv); 
      post.move();
      if(this.isDual){
        Utils.apply(pre, prev); 
        pre.move();
      }
    }
    if(this.repeat > 0 ){
      this.repeatedCount++;
      if(this.repeatedCount >= this.repeat){
        this.destroy();
      }
    }
  },
  
  checkBreakForce : function(){
    var realDisDiff = Utils.getDisXY(this.pre, this.post) - this.distance;
    var min = !Utils.isEmpty(this.minEffDis) ? realDisDiff < this.minEffDis : false;
    var max = !Utils.isEmpty(this.maxEffDis) ? realDisDiff > this.maxEffDis : false;
    
    return min|| max;
  },
  
  softLink : function(pre, post){
    var postv = {vx : post.vx, vy : post.vy, vz : post.vz}; // velocity of post
    var uf = this.unitForce ?  this.unitForce : 1;
    var w = post.weight ?  post.weight : 1;
    //TODO #3D# change required
    var angle = Utils.getAngle(post, pre);
    for (var key in this.fn){
      var axisDis = parseInt(this.distance * this.fn[key].call(this, angle));
      var dis = pre[key] - axisDis - post[key];
      postv['v' + key] = parseInt(
          post['v' + key] + 
          dis * uf/w * this.elasticity
          );
    }
    return postv;
  },
  
  bounceLink : function(pre, post){
    var postv = {vx : post.vx, vy : post.vy, vz : post.vz}; // velocity of post
    var uf = this.unitForce ?  this.unitForce : 1;
    var w = post.weight ?  post.weight : 1;
    //TODO #3D# change required
    var angle = Utils.getAngle(post, pre);
    for (var key in this.fn){
      var axisDis = parseInt(this.distance * this.fn[key].call(this, angle));
      postv['v' + key] = parseInt(
          post['v' + key]
          + ((pre[key] - axisDis - post[key])) * uf/w * this.elasticity
          );
    }
    return postv;
  },
  
  destroy : function(){
    //console.log('destroy ' + this.type + this.iid);
    if(this.pre){
      this.pre.rmIw(this.post);
      if(this.pre.goneWithLink){
        this.pre.destroy();
      }
    }
    if(this.post){
      this.post.rmIw(this.pre);
      if(this.post.goneWithLink){
        this.post.destroy();
      }
    }
    this.fireEvent('onDestroy', this);
  }
});

World.ForceLink = Utils.cls.extend(World.Link, {
  force : null,
  
  calc : function(){
    if(!Utils.isEmpty(this.force) && !Utils.isEmpty(this.post)){
      this.force.calc();
      this.pre = OP.add(this.post.x + this.force.fx, this.post.y + this.force.fy);
      this.callParent();
    }
  }
});

/**
 * This class mainly work as data manipulation, 
 * to create a virtual world data, which is used 
 * for present visual world
 */
Creature = {
    SEX : {
      M : 'male',
      F : 'female'
    }
};

Creature.Life = Utils.cls.extend(World.Point, {
  //default center dot, represent body
  body : null,
  brain : null,
  energyCapacity : 10000,
  energy : 10000,
  age : 0,
  init :function(config){
    Utils.apply(this, config);
    this.body = this.world.add({type: 'point', x : this.x, y : this.y, 
      crashable : true, crashRadius : 10, group : this
    });
  },
  
  destroy : function(){
    this.world.remove(this);
    this.body.destroy();
    this.callParent();
  }
});

Creature.Ant = Utils.cls.extend(Creature.Life, {
    gene : '',
    ra : null,//right antenna
    la : null,
    mouth : null,
    /**
     * the force that pull the feet
     * this represent the desire of ant, how fast it run, how fast it turn to its food
     * and this is reduce when energy weak
     */
    strength  : 10,
    /**
     * regiester all input handlers
     */
    sensers : [],
    /**
     * regiester all output handlers
     */
    actions : [],
    sex : Creature.SEX.M,
    
    init : function(config){
      Utils.apply(this, config);
      if(!Utils.isEmpty(this.gene)){
        var bb = new BrainBuilder(this.gene);
        this.brain = bb.build();// build cortex
        this.createBody();
        this.sensers = [this.actLOlf, this.actROlf, this.actLa, this.actRa];
        this.actions = [this.lff, this.lfb, this.rff, this.rfb/*, 
                        this.lbff, this.rbff*/];
      }
//      this._super(config);
    },
    
    createBody : function(){
      var me = this;
      //left antenna
      this.la = this.world.add({type: 'point', x : this.x + 20, y : this.y - 15, 
        crashable : true,
        crashRadius : 5, group : this, text:'left-a'
        });
      this.la.on({onCrash : function(){me.actLa.call(me);}});
      //right antenna
      this.ra = this.world.add({type: 'point', x : this.x + 20, y : this.y + 15, 
        crashable : true, 
        crashRadius : 5, group : this, text:'right-a'
        });
      this.ra.on({onCrash : function(){me.actRa.call(me);}});
      this.mouth = this.world.add({type: 'point', x : this.x +10, y : this.y, 
        crashable : true,
        crashRadius : 10, group : this, text : 'mouth'
        });
      this.mouth.on({onCrash : function(other, self){me.eat.call(me, other);}});
//      this.body = this.world.add({type: 'point', x : this.x - 20, y : this.y, 
//        crashable : true, crashRadius : 30, group : this, text : 'body'
//        });
//      this.lf = this.world.add({type: 'point', x : this.x - 40, y : this.y - 10, 
//        crashable : true, crashRadius : 20, group : this, text : 'lf'
//      });
//      this.rf = this.world.add({type: 'point', x : this.x - 40, y : this.y + 10, 
//        crashable : true, crashRadius : 20, group : this, text : 'rf'
//      });
//        
      this.world.link({
        pre : this.ra, 
        post : this.la, 
        elasticity : 0.8, 
        unitForce : 0.3, 
        distance : 50, 
        effDis : 2000, 
        isDual: true
      });
      this.world.link({
        pre : this.ra, 
        post : this.mouth, 
        elasticity : 0.9, 
        unitForce : 0.5, 
        distance : 30, 
        effDis : 2000, 
        isDual: true
      });
      this.world.link({
        pre : this.la, 
        post : this.mouth, 
        elasticity : 0.9, 
        unitForce : 0.5, 
        distance : 30, 
        effDis : 2000, 
        isDual: true
      });
//      this.world.link({
//        pre : this.mouth, 
//        post : this.body, 
//        elasticity : 0.9, 
//        unitForce : 0.5, 
//        distance : 50, 
//        effDis : 2000, 
//        isDual: true
//      });
//      this.world.link({
//        pre : this.body, 
//        post : this.lf, 
//        elasticity : 0.9, 
//        unitForce : 0.5, 
//        distance : 30, 
//        effDis : 2000, 
//        isDual: true
//      });
//      this.world.link({
//        pre : this.body, 
//        post : this.rf, 
//        elasticity : 0.9, 
//        unitForce : 0.5, 
//        distance : 30, 
//        effDis : 2000, 
//        isDual: true
//      });
//      this.world.link({
//        pre : this.rf, 
//        post : this.lf, 
//        elasticity : 0.8, 
//        unitForce : 0.3, 
//        distance : 50, 
//        effDis : 2000, 
//        isDual: true
//      });
    },
    
    /**
     * 
     * @param inputs 0 left antenna, 1 right antenna, 2-3 olfaction
     */
    set : function(inputs){
//      console.log('set :' + inputs);
      this.brain.set.call(this.brain, inputs);
    },
    
    think : function(){
      this.brain.updateWatch.call(this.brain);
      this.energy += -1;
    },
    
    act : function(){
      var outputs = this.brain.get();
//      console.log('act : ' + outputs);
      for(var i in outputs){
        var o = outputs[i];//return 0 or 1
        if(!!o){//1
          var a = this.actions[i];
          if(a){
            a.call(this);
          }
        }
      }
    },
    
    tick : function(){
      this.desire();
      this.think();
      this.act();
      if(this.energy < 0){
        this.die();
      }
    },
    
    /*-------------------Sensors below-------------------------- */
    /*
     * Activate left Antenna
     */
    actLa : function(){
      this.set([0, 0, 2, 0]);
    },
    
    actRa : function(){
      this.set([0, 0, 0, 2]);
    },
    
    actLOlf : function(inputs){
      this.set([2, 0, 0, 0]);
      
    },
    
    actROlf : function(inputs){
      this.set([0, 2, 0, 0]);
    },
    
    /**
     * it is the desire of this little ant, the ambitions of this little creature
     */
    desire : function(){
      var dis = -1;
      var target = null;
      for(var key in this.world.points){
        var o = this.world.points[key];
        if(o instanceof Creature.Life && o != this){
          var ndis = Utils.getDisXY(this.ra, OP.add(o.x, o.y));
          if(dis < 0 || ndis < dis){
            dis = ndis;
            target = o;
          }
        }
      }
      if(!Utils.isEmpty(target)){
        this.smell(target);
      }
    },
    
    hunger : function(){
      
    },
    
    fear : function(){
//      this.strength 
    },
    
    /*-------------------Actions below-------------------------- */
    smell : function(life){
      var rDis = Utils.getDisXY(this.ra, OP.add(life.x, life.y));
      var lDis = Utils.getDisXY(this.la, OP.add(life.x, life.y));
      if(rDis > lDis){
        /*
         * Follow the rule of the nature, the closer to the target, 
         * the easier to get fired.
         */
        this.actLOlf();
      }else{
        this.actROlf();
      }
    },
    
    eat : function(other){
      if(!Utils.isEmpty(other) && !Utils.isEmpty(other.group)
          && other.group != this
          && other.group instanceof Creature.Life){
        this.energy += other.group.energy / 1000;
        other.group.destroy();
      }
    },
    /**
     * Action : left foot Forwad
     */
    lff : function(){
//      console.log('lff');
      var crawlP = this.getCrawlPoint(this.la, this.ra, -Math.PI/2); //left forward point
      this.crawl(crawlP, this.la);
    },
    
    /**
     * Action : left foot backward
     */
    lfb : function(){
//      console.log('lfb');
      var crawlP = this.getCrawlPoint(this.la, this.ra, Math.PI/2); //left forward point
      this.crawl(crawlP, this.la);
    },
    
    /**
     * Action : left foot Forwad
     */
    lbff : function(){
//      console.log('lbff');
      var crawlP = this.getCrawlPoint(this.lf, this.rf, -Math.PI/2); //left forward point
      this.crawl(crawlP, this.lf);
    },
    
    /**
     * Action : left foot backward
     */
    rbff : function(){
//      console.log('rbff');
      var crawlP = this.getCrawlPoint(this.rf, this.lf, Math.PI/2); //left forward point
      this.crawl(crawlP, this.rf);
    },
    
    /**
     * Action : right foot Forwad
     */
    rff : function(){
//      console.log('rff');
      var crawlP = this.getCrawlPoint(this.ra, this.la, Math.PI/2); //left forward point
      this.crawl(crawlP, this.ra);
    },
    
    /**
     * Action : right foot backward
     */
    rfb : function(){
//      console.log('rfb');
      var crawlP = this.getCrawlPoint(this.ra, this.la, -Math.PI/2); //left forward point
      this.crawl(crawlP, this.ra);
    },
    
    getCrawlPoint : function(startP, endP, offset){
      var angle =  Utils.getAngle(startP, endP, offset);
      var px = startP.x + this.strength * Math.cos(angle);
      var py = startP.y + this.strength * Math.sin(angle);
      var point = this.world.add({type: 'point', x : px, y : py, 
        crashable : false, goneWithLink : true});
      return point;
    },
    
    crawl : function(pre, post){
      /*
       * every move require energy
       */
      this.energy += -1;
      this.world.link({
        pre : pre, 
        post : post, 
        elasticity : 0.9, 
        unitForce : 0.9, 
        distance : 0, 
        effDis : 2000, 
        isDual: false,
        repeat : 1
      });
    },
    
    die : function(){
      this.world.remove(this);
    }
});
function ParseEngine(json, addNeuron, addInput, addOutput, connectNeuron, onFinish, scope) {
  if (typeof (json) != 'string' || !addNeuron || !connectNeuron)
    return;
  var obj = null;
  try {
     obj = JSON.parse(json);
  } catch (e) {
    throw new Error('Invalid Map Json : ', e);
  }
  var neurons = obj.neurons;
  var inputs = obj.inputs;
  var outputs = obj.outputs;
  parse(neurons, addNeuron);
  parse(inputs, addInput);
  parse(outputs, addOutput);
  
  function parse (neurons, addNeuron){
    var i = 0;
    for (; i < neurons.length; i++) {
      var neuron = neurons[i];
      // the real neuron object return from implementation
      var implNeuron = addNeuron.apply(scope, [neuron]);
      if(neuron.axons && neuron.axons.length > 0){
        var k = 0;
        var axons = neuron.axons, 
        len = axons.length, synpase;
        for(;k < len; k++) {
          synpase = axons[k];
          try {
            synpase = JSON.parse(synpase);
          } catch (e) {
            throw new Error('Invalid Synapse Json : ', e);
          }
          connectNeuron.apply(scope, [implNeuron, synpase]);
        }
      }
    }
  }
  onFinish.apply(scope,[]);
};
/**
* @Author : Kai Li
* Copyright (c) 2012 Kai Li
* Contact:  beherca@gmail.com
* This work is to simulate the nature brain 
* All Right Reserved
*/

/**
 * global g_accuracy, back to 6 decimal
 */
g_accuracy = 6;
  
/**
 * Neuron Act like a differentiator, multi-synapses as inputs, and
 * multi-synapses as output
 * 
 * @returns
 */
function Neuron(iid, decayRate) {
  Observable.apply(this);
  /* default id as null, DO NOT CHANGE THIS */
  this.iid = Utils.isEmpty(iid)? 0 : iid;
  this.output = 0;
  this.axons = [];
  this.threshold = 1;
  /*
   * This decay Rate is for multiple output, output will be decay in a fixed
   * time
   */
  this.decayRate = Utils.isEmpty(decayRate) ? 0.5 : decayRate;
  this.isWatched = false;
  
  /*
   * cortex
   */
  this.cortex = null;
};
/**
 * Synapse is the connection between two neuron
 * 
 * @param soma
 *          is where the synapse from
 * @param postSynapse
 *          is where the synapse to
 * @returns
 */
function Synapse(soma, postSynapse, isInhibit, strength) {
  Observable.apply(this);
  this.iid = 0;
  this.soma = soma;
  this.postSynapse = postSynapse;
  /*
   * initial strength is 0.1 when this synapse fired, this variable will be
   * strengthen by adding 0.01(TBD), but always less than 1, in neurosciences,
   * strength is controlled by postSynapse, strength should not be the property
   * of axon's synapse's property, however, to simple the implementation, I put
   * it here
   * functionally, it means that whether this creature is easy to exited 
   */
  this.strength = strength;
  this.isInhibit = isInhibit;
};

/**
 * this is a array that pool all inputs, like cortex in the brain, which ship
 * all neurons, there will be cortexs for different level.
 * 
 * @returns
 */
function Cortex() {
  Observable.apply(this);
  /**
   * all neurons
   */
  this.neurons = [];
  /**
   * it contains neurons in entorhinal cortex, which is a interface between 
   * neocotex and hippocampus
   */
  this.ec = [];
  /**
   * this is watched neurons, watched neurons refers to the neuron that with
   * compute() once called we will loop through this array to update the decay
   * output, update interval would be 1/30 s(TBD) the neuron which has output as
   * 0 will be remove from this array, because it is inactivated
   */
  this.watchedNeurons = {};

  this.idCount = 0;

  this.inputs = [];

  this.outputs = [];
  
  /**
   * g_maxNeurons is the max number of neurons in current cortex
   */
  this.g_maxNeurons = 1000;
  /**
   * g_minWatchValue is the threshold for WatchedNeurons to determine whether the
   * neuron should be removed from watched list, less than this value mean that
   * neuron is in silent for a long enough time.
   */
  this.g_minWatchValue = 1/Math.pow(10, g_accuracy);

  /**
   * g_decayRate is rate to decay the activity of neurons
   */
  this.g_decayRate = 0.5;
  
  /**
   * for detail, please check out the description in Synapse Object
   */
  this.g_synapseStrength = 0.1;

};

/**
 * Hippocampus will loop through neurons within cortex and find the most
 * activated neurons and link them
 * 
 * @param
 * @returns
 */
function Hippocampus() {

};

/**
 * Sleep will reduce the strength of synapse connections
 * 
 * @returns
 */
Sleep = {
  forget : function() {

  }
};

function MotorCortex() {
  
};
/**
 * The basal ganglia are thus thought to facilitate movement by channelling
 * information from various regions of the cortex to the supplementary motor
 * area (SMA) The basal ganglia may also act as a filter, blocking the execution
 * of movements that are unsuited to the situation in computer, it is a engine
 * that drive all action of living thing. it will check all neurons in motor
 * cortex in certain interval (TBD, but must greater than cortex loop) and only
 * those fired neurons will allow to invoke actions.
 */
function BasalGanglia() {
};

/**
 * Engine is used to loop the activated neuron, we will never loop through all
 * neuron, only those activated.
 * 
 * @returns
 */
Engine = {
  go : function(neuron) {
    neuron.compute();// compute will handle compute the input and determine
    // whether to fire
  }
};

Cortex.prototype = {
  addNeuron : function(iid) {
    iid = Utils.isEmpty(iid) ? this.idCount++ : iid;
    var neuron = new Neuron(iid, this.g_decayRate);
    neuron.cortex = this;
    this.neurons.push(neuron);
    return neuron;
  },

  addInput : function(iid) {
    var neuron = this.addNeuron(iid);
    this.inputs.push(neuron);
    return neuron;
  },

  addOutput : function(iid) {
    var neuron = this.addNeuron(iid);
    this.outputs.push(neuron);
    return neuron;
  },

  set : function(inputs) {// inputs
    var i = 0;
    var len = this.inputs.length > inputs.length ? inputs.length
        : this.inputs.length;
    for (; i < len; i++) {
      var neuron = this.inputs[i];
      neuron.output = inputs[i];
      neuron.fire.call(neuron);
    }
  },

  get : function() {// return outputs
    var i = 0;
    var outputs = [];
    for (; i < this.outputs.length; i++) {
      var neuron = this.outputs[i];
      outputs.push(neuron.getNormalizedOutput.call(neuron));
    }
    return outputs;
  },

  addNeurons : function(numofNeurons) {
    if (numofNeurons && numofNeurons > 0
        && numofNeurons < (this.g_maxNeurons - this.neurons.length)) {
      var i = 0;
      for (; i < numofNeurons; i++) {
        this.addNeuron();
      }
      return this.neurons;
    } else {
      console.log('invalid neuron numbers');
    }
  },

  /**
   * this function is called by new activated neuron, which will register itself
   */
  addWatch : function(neuron) {
    if (neuron.iid != null && neuron.iid < this.g_maxNeurons
        && !this.watchedNeurons[neuron.iid]) {
      this.watchedNeurons[neuron.iid] = neuron;
      return true;
    }
    return null;
  },

  /**
   * this function will be call periods to exclude the silent neurons the
   * interval is TBD
   */
  updateWatch : function() {
    for (var key in this.watchedNeurons) {
      var neuron = this.watchedNeurons[key];
      if(!neuron) continue;
      //check whether neuron's output meet the watching stander 
      if (((neuron.output > 0 ? neuron.output : -neuron.output) - this.g_minWatchValue) < 0) {
        neuron.isWatched = false;
        delete this.watchedNeurons[key];
      } else {
        neuron.decay();
      }
    }
  },

  connect : function(soma, postSynapse, isInhibit) {
    if (soma && postSynapse) {
      var synapse = new Synapse(soma, postSynapse, isInhibit, this.g_synapseStrength);
      soma.addAxons.call(soma, synapse);
      return synapse;
    } else {
      console.log("invalid soma or postSynape");
    }
  },

  destroy : function() {
    this.watchedNeurons = null;
    for ( var i = 0; i < this.neurons.length; i++) {
      var n =this.neurons[i];
      n.destroy.call(n);
    }
    this.neurons = null;
    this.inputs = null;
    this.outputs = null;
  }
};

Neuron.prototype = {
  compute : function(synapse) {
    // once call, means that this should be watched
    if (!this.isWatched) {
      this.isWatched = this.cortex.addWatch(this);
    }
    this.output = Utils.round(synapse.getOutput.call(synapse) + this.output, g_accuracy);
    if (this.output > this.threshold) {// if the sum is bigger than threshold
      this.fire();
    }
  },

  addAxons : function(synapse) {
    this.axons.push(synapse);
  },

  fire : function() {
    var i = 0;
    for (; i < this.axons.length; i++) {
      var synapse = this.axons[i];
      // ###### IMPORTANT #####
      // synapse strength will be strength since soma fired
      synapse.fired.call(synapse);
      // ###### IMPORTANT #####
      var nextNeuron = synapse.postSynapse;
      if (nextNeuron) {
        nextNeuron.compute.call(nextNeuron, synapse);
      }
    }
  },

  getNormalizedOutput : function() {
    return this.output > this.threshold ? 1 : 0;
  },

  /**
   * this will slow the activity of neuron, simulate the water drop of neuron
   */
  decay : function() {
    this.output = Utils.round(this.output * this.decayRate, g_accuracy);
  },

  destory : function() {
    for ( var i = 0; i < this.axons.length; i++) {
      this.axons[i].destroy();
    }
    this.axons = null;
  }
};

Synapse.prototype = {
  // the strength will be improved since it is fired
  fired : function() {
    this.strength += 0.01;
  },

  // get output of this synapse, this represent that all output are from soma
  // immediatly
  // no latency.
  getOutput : function() {
    var out = Utils.round(this.soma.getNormalizedOutput.call(this.soma) * this.strength, g_accuracy);
    return this.isInhibit ? -out : out;
  },

  destory : function() {
    this.soma = null;
  }
};

function BrainBuilder(mapsdata) {
  this.synapseCache = [];
  this.cortex = null;
  this.mapsdata = mapsdata;
};

gBrain = {
  cortex : null, // cortex instance

  set : function(inputs) {
    if (Utils.isEmpty(this.cortex)) {
      return null;
    }
    if (!Utils.isEmpty(arguments)) {
      this.cortex.set(inputs);
    }
  },

  get : function() {
    if (Utils.isEmpty(this.cortex)) {
      return null;
    }
    return this.cortex.get();
  }
};

BrainBuilder.prototype = {
  build : function() {
    this.cortex = new Cortex();
    ParseEngine(this.mapsdata, this.engAddN, this.engAddI, this.engAddO,
        this.engConnHandler, this.engFinish, this);
    return this.cortex;
  },

  engAddN : function(neuron) {
    var newNeuron = this.cortex.addNeuron(neuron.iid);
    return newNeuron;
  },

  engAddI : function(neuron) {
    var newNeuron = this.cortex.addInput(neuron.iid);
    return newNeuron;
  },

  engAddO : function(neuron) {
    var newNeuron = this.cortex.addOutput(neuron.iid);
    return newNeuron;
  },

  engConnHandler : function(neuron, synapse) {
    this.synapseCache.push({
      neuron : neuron,
      synapse : synapse
    });
  },

  engFinish : function() {
    // rebuild the synapse
    var i = 0;
    var gsp = {};// grouped Synapse By PostNeuron iid
    for (; i < this.synapseCache.length; i++) {
      var sc = this.synapseCache[i];
      if (Utils.isEmpty(gsp[sc.synapse.postNeuron.iid])) {
        gsp[sc.synapse.postNeuron.iid] = [ sc ];
      } else {
        gsp[sc.synapse.postNeuron.iid].push(sc);
      }
    }
    for ( var iid in gsp) {
      var pn = this.findNeuron(iid); // post neuron
      if(pn){
        var snCachedObjs = gsp[iid]; // cached object in the synapseCache
        var k = 0;
        for (; k < snCachedObjs.length; k++) {
          var sco = snCachedObjs[k];
          var soma = sco.neuron; // pre synapse neuron, which is soma
          var sobj = sco.synapse;
          var s = this.cortex.connect(soma, pn, sobj.isInhibit);
          s.iid = sobj.iid;
        }
      }
    }
  },

  //TODO this will be enhance for performance concern, use bi-search
  findNeuron : function(iid) {
    var i = 0;
    var neurons = this.cortex.neurons;
    for (; i < neurons.length; i++) {
      var n = neurons[i];
      if (n.iid == iid) {
        return n;
      }
    }
    return null;
  },
  
  run : function(){
    this.cortex.updateWatch.apply(this.cortex);
  }
};

Brain = {};
Brain.Neuron = Neuron;
Brain.Synapse = Synapse;
Brain.Cortex = Cortex;
(function(module){
  if(module){
    module.exports.World = World;
    module.exports.OP = OP;
    module.exports.AXIS = AXIS;
    module.exports.Utils = Utils;
    module.exports.Brain = Brain;
    module.exports.Observable = Observable;
    module.exports.Iid = Iid;
    module.exports.Dims = Dims;
    module.exports.Iider = Iider;
    module.exports.Indexer = Indexer;
    module.exports.Looper = Looper;
    module.exports.RulesEngine = RulesEngine;
  }
})(typeof(module) === 'undefined' ? null : module);


