import createGraph from "ngraph.graph";
var createLayout = require('ngraph.forcelayout');

var ngraph = createGraph();
var dagre = require("dagre");

async function SortMap(data, layoutType) {

  if (layoutType === 'layered') {
    dagre_layout(data)  //layered
  }
  else {
    ngraph_layout(data);  // forced
  }
  console.log(data)
  return data;


}



function getGravityAndGap(tableCount) {
  let result = {
    gap: 10,
    gravity: -1000,
  }

  // return {
  //   gap : 10 ,
  //   gravity: -1000,
  // }
  if (tableCount < 5) {
    result.gap = 2;
    result.gravity = -100;
  }
  else if (tableCount < 10) {
    result.gap = 5;
    result.gravity = -100;
  }
  else if (tableCount < 20) {
    result.gap = 6;
    result.gravity = -200;
  }
  else if (tableCount < 30) {
    result.gap = 7;
    result.gravity = -400;
  }
  else if (tableCount < 40) {
    result.gap = 8;
    result.gravity = -600;
  }
  else if (tableCount < 50) {
    result.gap = 9;
    result.gravity = -800;
  }
  else if (tableCount > 100) {
    result.gap = 9;
    result.gravity = -1200;
  }
  // else if ( tableCount< 40){
  //   result.gap = 8;
  //   result.gravity = -600;
  // }


  result.gravity -= 300;
  result.gap += 1;
  return result;
}


function ngraph_layout(data) {
  // var graph = new dagre.graphlib.Graph();
  console.log(ngraph)
  let g = ngraph;
  //  g.setNo
  data.nodes.map((item) => {
    g.addNode(item.id, { label: item.data.label, width: item.elkjsData.width, height: item.elkjsData.height })
    return null
  });
  data.edges.map((item) => {
    g.addLink(item.source, item.target);
    return null
  });


  let optionsValue = getGravityAndGap(data.nodes.length);
  console.log(data.nodes.length, optionsValue);
  // TODO: handle single table spacing
  var layout = createLayout(g, {
    timeStep: 0.5,
    dimensions: 2,
    gravity: optionsValue.gravity,  //100 - 500
    theta: 0.8,
    springLength: 80,
    springCoefficient: 2.8,
    dragCoefficient: 0.9
  });

  let GAP = optionsValue.gap; //5 -10



  for (var i = 0; i < 300; ++i) {
    layout.step();
  }

  // data.nodes.map((item, index) => {
  //   var nodeToPin = g.getNode(item.id);
  //   // layout.pinNode(nodeToPin, true); // now layout will not move this node

  // })



  data.nodes.map((item, index) => {
    let node = layout.getNodePosition(item.id)

    item.position = { x: node.x * GAP, y: node.y * GAP };


    return null
  });

  return data;
}

function ngraph_layout_get_sorted_layout(graphData) {
  let g = ngraph;
  let optionsValue = getGravityAndGap(graphData.nodes.length);

  var layout = createLayout(g, {
    timeStep: 0.5,
    dimensions: 2,
    gravity: optionsValue.gravity,  //100 - 500
    theta: 0.8,
    springLength: 80,
    springCoefficient: 2.8,
    dragCoefficient: 0.9
  });

  for (var i = 0; i < 1000; ++i) {
    layout.step();
  }
  return layout;
}

function ngraph_layout_sort_node(graphData, options) {
  // let g = ngraph;
  let optionsValue = getGravityAndGap(graphData.nodes.length);
  let GAP = optionsValue.gap; //5 -10
  // TODO: handle single table spacing
  var layout = ngraph_layout_get_sorted_layout(graphData);
  let nodes = graphData.nodes;
  for (let i = 0; i < nodes.length; i++) {
    let node = layout.getNodePosition(nodes[i].id)
    nodes[i].position = {
      x: node.x * GAP,
      y: node.y * GAP
      // ,isPosAlreadySet: true // set value that this node is already sorted
    }

  }

  return graphData;

}

/* data = {node: [] , edges: []  } */
function ngraph_layout_add_node(graphData, newNode,options) {
  // var graph = new dagre.graphlib.Graph();
let defaultOptions = {
  sort: true  , 
  ...options
}

  //  return ; 
  let g = ngraph;
  g.addNode(newNode.id, { label: newNode.data.label, width: newNode.elkjsData.width, height: newNode.elkjsData.height })

  // graphData.edges.map((item) => {
  //   // console.log(item)
  //   g.addLink(item.source, item.target);
  //   // g.setNode(item.id, {label: item.data.label, width: item.elkjsData.width, height: item.elkjsData.height  } )
  //   return null
  // });
  //&& !newNode.position.isPosAlreadySet
  if (defaultOptions.sort) {
    let optionsValue = getGravityAndGap(graphData.nodes.length);
    let GAP = optionsValue.gap; //5 -10
    // console.log( data.nodes.length, optionsValue );
    // TODO: handle single table spacing
    var layout = ngraph_layout_get_sorted_layout(graphData );
    let node = layout.getNodePosition(newNode.id)
    newNode.position = {
      x: node.x * GAP,
      y: node.y * GAP
      // ,isPosAlreadySet: true // set value that this node is already sorted
    };

  }


  graphData.nodes.push(newNode);
  return graphData;
}


/* data = {node: [] , edges: []  } */
function ngraph_layout_remove_node(graphData, oldNode,) {
  // var graph = new dagre.graphlib.Graph();

  //  return ; 
  let g = ngraph;

  g.removeNode(oldNode.id,);

  // graphData.edges.map((item) => {
  //   // console.log(item)
  //   g.addLink(item.source, item.target);
  //   // g.setNode(item.id, {label: item.data.label, width: item.elkjsData.width, height: item.elkjsData.height  } )
  //   return null
  // });


  // let optionsValue = getGravityAndGap(graphData.nodes.length);
  // console.log( data.nodes.length, optionsValue );
  // TODO: handle single table spacing

  /* remove node from graphData */
  let oldNodeIndex;
  for (let i = 0; i < graphData.nodes.length; i++) {
    if (graphData.nodes[i].id === oldNode.id) {
      oldNodeIndex = i;
      break;
    }
  }
  graphData.nodes.splice(oldNodeIndex, 1)

  return graphData;
}


function ngraph_layout_remove_all_node(graphData,) {
  let g = ngraph;

  for (let i = 0; i < graphData.nodes.length; i++) {
    g.removeNode(graphData.nodes[i].id);
  }
  graphData.nodes.splice(0, graphData.nodes.length);

  return graphData;
}

















function dagre_layout(data) {
  var g = new dagre.graphlib.Graph();

  // Set an object for the graph label
  // g.setGraph({});
  g.setGraph({ rankdir: "LR", ranker: "longest-path", align: "DL" });
  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(function () { return {}; });




  data.nodes.map((item) => {
    // console.log( item)
    g.setNode(item.id, { label: item.data.label, width: item.elkjsData.width, height: item.elkjsData.height })
    return null
  });
  data.edges.map((item) => {
    // console.log(item)
    g.setEdge(item.source, item.target);
    // g.setNode(item.id, {label: item.data.label, width: item.elkjsData.width, height: item.elkjsData.height  } )
    return null
  });

  dagre.layout(g, {});


  data.nodes.map((item, index) => {
    let node = g.node(item.id)
    // console.log(item)
    // console.log(node)
    // x: item.x + ( Math.random() * 200),
    item.position = { x: node.x, y: node.y };
    // g.setNode(item.id, {label: item.data.label, width: item.elkjsData.width, height: item.elkjsData.height  } )
    return null
  });

  return data

}



export default {


  sort: SortMap,
  addNode: ngraph_layout_add_node,
  removeNode: ngraph_layout_remove_node,
  removeAllNode: ngraph_layout_remove_all_node,
  sortNode: ngraph_layout_sort_node,
  

}
// export { ngraph_layout_add_node }
