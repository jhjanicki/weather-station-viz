////////////////////////////////////////////////////////////
//////////////////////// Set-up ////////////////////////////
////////////////////////////////////////////////////////////

//Quick fix for resizing some things for mobile-ish viewers
var mobileScreen = ($( window ).innerWidth() < 500 ? true : false);

//Scatterplot
var margin = {left: 50, top: 20, right: 20, bottom: 40},
	width = Math.min($("#chart").width(), 800) - margin.left - margin.right,
	height = width*2/3;
			
var svg = d3.select("#chart").append("svg")
			.attr("width", (width + margin.left + margin.right))
			.attr("height", (height + margin.top + margin.bottom));
			
var wrapper = svg.append("g").attr("class", "chordWrapper")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//////////////////////////////////////////////////////
///////////// Initialize Axes & Scales ///////////////
//////////////////////////////////////////////////////

var opacityCircles = 0.7; 

//Set the color for each region
var color = d3.scale.category20b()
					.domain(["WS01","WS02","WS03","WS04","WS05","WS06","WS07","WS08","WS09","WS10",
					 "WS11","WS12","WS13","WS14","WS15","WS16","WS17","WS18","WS19","WS20","WS21",
					 "WS22","WS23","WS24"])
					 .range(["#393b79","#5254a3","#6b6ecf","#9c9ede","#17becf","#9edae5","#1f77b4","#aec7e8",
					 "#637939","#8ca252", "#b5cf6b", "#cedb9c", "#8c6d31","#bd9e39", "#e7ba52", "#e7cb94",
					  "#843c39","#ad494a", "#d6616b", "#e7969c", "#7b4173", "#a55194", "#ce6dbd", "#de9ed6"]);
							 
//Set the new x axis range
var xScale = d3.scale.linear()
	.range([0, width])
	.domain(d3.extent(stations, function(d) { return d.AirTemp; }))
	.nice();
//Set new x-axis	
var xAxis = d3.svg.axis()
	.orient("bottom")
	.ticks(5)
	.scale(xScale);	
//Append the x-axis
wrapper.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(" + 0 + "," + height + ")")
	.call(xAxis);
		
//Set the new y axis range
var yScale = d3.scale.linear()
	.range([height,0])
	.domain([0,0.9])
	.nice();	
	
var yAxis = d3.svg.axis()
	.orient("left")
	.ticks(10)
	.scale(yScale);	
//Append the y-axis
wrapper.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + 0 + "," + 0 + ")")
		.call(yAxis);
		
//Scale for the bubble size
var rScale = d3.scale.sqrt()
			.range([mobileScreen ? 1 : 2, mobileScreen ? 10 : 16])
			.domain(d3.extent(stations, function(d) { return d.Buffer; }));

		
////////////////////////////////////////////////////////////	
/////////////////// Scatterplot Circles ////////////////////
////////////////////////////////////////////////////////////	

//Initiate the voronoi group element	
var circleGroup = wrapper.append("g")
	.attr("class", "circleWrapper"); 
	
//Place the country circles	
wrapper.selectAll("stations")
	.data(stations.sort(function(a,b) { return b.Buffer > a.Buffer; })) //Sort so the biggest circles are below
	.enter().append("circle")
		.attr("class", "stations")
		.style("opacity", opacityCircles)
		.style("fill", function(d) {return color(d.StationID);})
		.attr("cx", function(d) {return xScale(+d.AirTemp);})
		.attr("cy", function(d) {return yScale(d.P_Urban);})
		.attr("r", function(d) {return rScale(d.Buffer);})
		.on("mouseover", showTooltip)
		.on("mouseout", removeTooltip);

//////////////////////////////////////////////////////
///////////////// Initialize Labels //////////////////
//////////////////////////////////////////////////////

//Set up X axis label
wrapper.append("g")
	.append("text")
	.attr("class", "x title")
	.attr("text-anchor", "end")
	.style("font-size", (mobileScreen ? 8 : 12) + "px")
	.attr("transform", "translate(" + width + "," + (height+34) + ")")
	.text("air temperature");

//Set up y axis label
wrapper.append("g")
	.append("text")
	.attr("class", "y title")
	.attr("text-anchor", "end")
	.style("font-size", (mobileScreen ? 8 : 12) + "px")
	.attr("transform", "translate(-34, 0) rotate(-90)")
	.text("% urbanization");
	
///////////////////////////////////////////////////////////////////////////
///////////////////////// Create the Legend////////////////////////////////
///////////////////////////////////////////////////////////////////////////

if (!mobileScreen) {
	//Legend			
	var	legendMargin = {left: 5, top: 10, right: 5, bottom: 10},
		legendWidth = 160,
		legendHeight = 570;
		
	var svgLegend = d3.select("#legend").append("svg")
				.attr("width", (legendWidth + legendMargin.left + legendMargin.right))
				.attr("height", (legendHeight + legendMargin.top + legendMargin.bottom));			

	var legendWrapper = svgLegend.append("g").attr("class", "legendWrapper")
					.attr("transform", "translate(" + legendMargin.left + "," + legendMargin.top +")");
		
	var rectSize = 16, //dimensions of the colored square
		rowHeight = 22, //height of a row in the legend
		maxWidth = 125; //widht of each row
		  
	//Create container per rect/text pair  
	var legend = legendWrapper.selectAll('.legendSquare')  	
			  .data(color.range())                              
			  .enter().append('g')   
			  .attr('class', 'legendSquare') 
			  .attr("transform", function(d,i) { return "translate(" + 0 + "," + (i * rowHeight) + ")"; })
			  .on("mouseover", selectLegend(0.02))
			  .on("mouseout", selectLegend(opacityCircles));
	 
	//Append small squares to Legend
	legend.append('rect')                                     
		  .attr('width', rectSize) 
		  .attr('height', rectSize) 			  		  
		  .style('fill', function(d) {return d;});                                 
	//Append text to Legend
	legend.append('text')                                     
		  .attr('transform', 'translate(' + 25 + ',' + (rectSize/2) + ')')
		  .attr("class", "legendText")
		  .style("font-size", "11px")
		  .attr("dy", ".35em")		  
		  .text(function(d,i) { return color.domain()[i]; });  
}//if !mobileScreen
else {
	d3.select("#legend").style("display","none");
}

///////////////////////////////////////////////////////////////////////////
//////////////////// Hover function for the legend ////////////////////////
///////////////////////////////////////////////////////////////////////////
	
//Decrease opacity of non selected circles when hovering in the legend	
function selectLegend(opacity) {
	return function(d, i) {
		var chosen = color.domain()[i];
		
		console.log(chosen);
			
		wrapper.selectAll(".stations")
			.filter(function(d) { console.log(d.StationID);
				return d.StationID != chosen; })
			.transition()
			.style("opacity", opacity);
	  };
}//function selectLegend
	  
///////////////////////////////////////////////////////////////////////////
/////////////////// Hover functions of the circles ////////////////////////
///////////////////////////////////////////////////////////////////////////

//Hide the tooltip when the mouse moves away
function removeTooltip (d, i) {

	//Save the chosen circle (so not the voronoi)
	var element = d3.selectAll(".stations");
		
	//Fade out the bubble again
	element.style("opacity", opacityCircles);
	
	//Hide tooltip
	$('.popover').each(function() {
		$(this).remove();
	}); 
  
	//Fade out guide lines, then remove them
	d3.selectAll(".guide")
		.transition().duration(200)
		.style("opacity",  0)
		.remove();
		
}//function removeTooltip

//Show the tooltip on the hovered over slice
function showTooltip (d, i) {
	
	//Save the chosen circle (so not the voronoi)
	var element = d3.select(this);
	
	//Define and show the tooltip
	$(element).popover({
		placement: 'auto top',
		container: '#chart',
		trigger: 'manual',
		html : true,
		content: function() { 
			return "<span style='font-size: 11px; text-align: center;'>Station: " + d.StationID + "</span><br><span style='font-size: 11px; text-align: center;'>Buffer: "+d.Buffer+"</span>"; }
	});
	$(element).popover('show');

	//Make chosen circle more visible
	element.style("opacity", 1);
	
	//Append lines to bubbles that will be used to show the precise data points
	//vertical line
	wrapper.append("g")
		.attr("class", "guide")
		.append("line")
			.attr("x1", element.attr("cx"))
			.attr("x2", element.attr("cx"))
			.attr("y1", +element.attr("cy"))
			.attr("y2", (height))
			.style("stroke", element.style("fill"))
			.style("opacity",  0)
			.style("pointer-events", "none")
			.transition().duration(200)
			.style("opacity", 1);
	//horizontal line
	wrapper.append("g")
		.attr("class", "guide")
		.append("line")
			.attr("x1", +element.attr("cx"))
			.attr("x2", 0)
			.attr("y1", element.attr("cy"))
			.attr("y2", element.attr("cy"))
			.style("stroke", element.style("fill"))
			.style("opacity",  0)
			.style("pointer-events", "none")
			.transition().duration(200)
			.style("opacity", 1);
					
}//function showTooltip

