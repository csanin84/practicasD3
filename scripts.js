// variable global con todos los datos con los datos de las rutas
let datos = {};

// ubicación de fichero
let path = "./datos/";
let name = "europa_y_norteamerica_enc.json";
let url = path + name;

// cargar datos en la variable global "datos"
function cargarDatos() {
  let valores = d3.json(url);
  return valores.then((penetracion) => {
    datos.penetracion = penetracion.Datos.Metricas;
    return datos;
  });
} // fin funcion cargarDatos

// obtener el promedio anual por país
function getPromedioAnualPais(datos) {
  // aplicamos una transformacion a los datos
  // calculando el promedio anual 2013 - 2018
  let aux = datos.map((d) => {
    let listaValores = d.Datos.map((d) => d.Valor);
    d.Promedio = d3.mean(listaValores);
  });

  // ordenar los datos de manera desendente
  datos = datos.sort((a, b) => d3.descending(a.Promedio, b.Promedio));

  return datos;
} // fin getPromedioAnualPais

// configuraciones de area para graficar
function getContenedorChartConfig() {
  let width = 400;
  let height = 300;

  let margin = {
    top: 10,
    bottom: 50,
    left: 200,
    right: 70,
  };
  // le quitamos los margenes de arriba y abajo, para dar un espaceado
  let bodyHeight = height - margin.top - margin.bottom;
  // le quitamos los margenes de izquierda y derecha, para dar un espaceado
  let bodyWidth = width - margin.left - margin.right;

  // escoger el contenedor donde se haran los gráficos
  let container = d3.select("#contenedor");
  container.attr("width", width).attr("height", height);

  return { width, height, margin, bodyHeight, bodyWidth, container };
} // fin getContenedorChartConfig

// obtener escalas
function getPromediosScales(datos, config) {
  let { bodyWidth, bodyHeight } = config;
  let maxPromedio = d3.max(datos, (d) => d.Promedio); // obtener el promedio maximo anual

  let xScale = d3.scaleLinear().domain([0, maxPromedio]).range([0, bodyWidth]);

  let yScale = d3
    .scaleBand()
    .domain(datos.map((d) => d.Nombre))
    .range([0, bodyHeight])
    .padding(0.2);

  return { xScale, yScale };
} // fin getPromediosScales

// funcion Mostrar tooltip
function mostarTooltip(d, pos){
  console.log(pos);
  d3.select(".tooltip_promedios")    
    .style("top", pos[1]+"px")
    .style("left", pos[0]+"px") 
    .text(d.Promedio.toFixed(2) + " %")  
    .style("display", "block");

}// fin funcion mostrarTooltip

// dibujar las barras
function dibujarBarrasPromedioChart(datos, scales, config) {
  let { width, height, margin, bodyHeight, bodyWidth, container } = config; // es lo mismo que: 'let margin = config.margin; let container = config.container'
  let { xScale, yScale } = scales;
  let body = container
    .append("g")
    .style("transform", `translate(${margin.left}px, ${margin.top}px)`);

  let bars = body.selectAll(".bar").data(datos);

  bars
    .enter()
    .append("rect") 
    //eventos
    .on("mouseenter", d => {
      pos = [d3.event.pageX, d3.event.pageY];
      mostarTooltip(d, pos);
    })
    .on("mouseleave", d => {
      d3.select(".tooltip_promedios")
        .style("display", "none");
    })
    
    .on("click", () => console.log("Hola"))
    
    .attr("height", yScale.bandwidth()) 
    .attr("y", (d) => yScale(d.Nombre))
    // animacion en el width
    .transition()
    .ease(d3.easeSin)
    .duration(2000)
    .delay( d => Math.sqrt(d.Promedio))
    
    .attr("width", (d) => xScale(d.Promedio))
    .attr("fill", "#2a5599");

    

 
} // fin funcion

// dibujar axes
function dibujarAxesChart(datos, scales, config) {
  let { xScale, yScale } = scales;
  let { container, margin, height } = config;
  let axisX = d3.axisBottom(xScale).ticks(3);

  container
    .append("g")
    .style(
      "transform",
      `translate(${margin.left}px, ${height - margin.bottom}px)`
    )
    .call(axisX);

  let axisY = d3.axisLeft(yScale);

  container
    .append("g")
    .style("transform", `translate(${margin.left}px, ${margin.top}px)`)
    .call(axisY);
} // fin drawAxesAirlinesChart

// Dibujar lineas
function dibujarChart(datos) {
  let config = getContenedorChartConfig();
  let scales = getPromediosScales(datos, config);
  dibujarBarrasPromedioChart(datos, scales, config);
  dibujarAxesChart(datos, scales, config);
} // fin funcion dibujarChart

// Mostrar datos
function mostrarDatos() {
  //Obtener los datos del dataset
  let penetracion = datos.penetracion;
  // mostrar en consola
  console.log(penetracion);

  // calcular promedio de penetración anual
  penetracion = getPromedioAnualPais(penetracion);

  dibujarChart(penetracion);
} // fin mostrarDatos

cargarDatos().then(mostrarDatos);
