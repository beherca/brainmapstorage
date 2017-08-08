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