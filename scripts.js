// Variables globales
let datos = {}; // variable global con todos los datos por pais y año
let paisSeleccionado; // pais selecionado para mostrar detalle

// para controlar la transision
let contadorBarras = 0; // numero de veces que se esjecuta la funcion para graficar las barras
let tiempoTransition = 800; // tempo que se le da al delay en la transición

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

/* ############################################# TRANSFORMACIONES ########################################## */
// obtener el promedio anual por país
function getPromedioAnualPais(datos) {
  // aplicamos una transformacion a los datos
  // calculando el promedio anual 2013 - 2018
  datos.map((d) => {
    let listaValores = d.Datos.map((d) => d.Valor);
    d.Promedio = d3.mean(listaValores);
  });

  // ordenar los datos de manera desendente
  datos = datos.sort((a, b) => d3.descending(a.Promedio, b.Promedio));

  return datos;
} // fin getPromedioAnualPais

// funcion obtener historico de un pais
function getHistorico(pais) {
  let hist = [];
  pais.Datos.map((p) => {
    hist.push({
      date: new Date(p.Agno, 12, 31),
      valor: p.Valor,
    });
  });
  return hist;
} // fin funcion getHistorico

/* ################################# CONFIGURACIONES AREA DE DIBUJO ################################# */
// configuraciones de area para graficar
function getContenedorChartConfig(
  contenedor,
  w = 500,
  h = 450,
  mTop = 10,
  mBottom = 50,
  mLeft = 200,
  mRight = 70
) {
  let width = w;
  let height = h;

  let margin = {
    top: mTop,
    bottom: mBottom,
    left: mLeft,
    right: mRight,
  };
  // le quitamos los margenes de arriba y abajo, para dar un espaceado
  let bodyHeight = height - margin.top - margin.bottom;
  // le quitamos los margenes de izquierda y derecha, para dar un espaceado
  let bodyWidth = width - margin.left - margin.right;

  // escoger el contenedor donde se haran los gráficos
  let container = d3.select(contenedor);
  container.attr("width", width).attr("height", height);

  return { width, height, margin, bodyHeight, bodyWidth, container };
} // fin getContenedorChartConfig

/* ############################################# ESCALAS ########################################## */
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

// obtener escalas historico de pais
function getHistoricoScales(datos, config) {
  let { bodyWidth, bodyHeight } = config;
  let maxPromedio = d3.max(datos, (d) => d.valor); //obtener el valor maximo

  let yScale = d3
    .scaleLinear()
    .domain([0, maxPromedio + 10])
    .range([bodyHeight, 0]); // invertir para graficar bien

  let xScale = d3
    .scaleTime()
    .domain(d3.extent(datos, (d) => d.date))
    .range([0, bodyWidth]);

  return { xScale, yScale };
} // fin getHitoricoScales

/* ############################################# TOOLTIP ########################################## */
// funcion Mostrar tooltip
function mostarTooltip(d, pos) {
  d3.select(".tooltip_promedios")
    .style("top", pos[1] + "px")
    .style("left", pos[0] + "px")
    .text(d.Nombre + ": " + d.Promedio.toFixed(2) + " %")
    .style("display", "block");
} // fin funcion mostrarTooltip

/* ############################################# FUNCIONES PARA DIBUJAR BARRAS Y TENDENCIA ########################################## */
// funcion dibujarTendenciaPais
function dibujarTendenciaPais(datos, scales, config) {
  let { width, height, margin, bodyHeight, bodyWidth, container } = config; // es lo mismo que: 'let margin = config.margin; let container = config.container'
  let { xScale, yScale } = scales;

  let body = container
    .append("g")
    .style("transform", `translate(${margin.left}px, ${margin.top}px)`);

  //Define line generator
  var line = d3
    .line()
    .defined((d) => !!d.valor)
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.valor));

  //dibujar lineas
  body
  .append("path")
  .datum(datos)
  .attr("class", "line")
  .attr("d", line);

  //dibujar circulos
  body
    .selectAll("circle")
    .data(datos)
    .enter()
    // animacion en el fill
    .append("circle")

    .attr("r", 3 + "px")
    .attr("cx", (d) => xScale(d.date))
    .attr("cy", (d) => yScale(d.valor))  
    .attr("fill", "red");

  // colocar texto a los circulos
  body
    .selectAll(".text")
    .data(datos)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("font-size", 11 + "px")
    .attr("x", (d) => xScale(d.date))
    .attr("y", (d) => yScale(d.valor))
    .attr("dy", "-5")
    .text((d) => d.valor + "%");
} // fin funcion  dibujarTendenciaPais

// dibujar las barras
function dibujarBarrasPromedioChart(datos, scales, config) {
  contadorBarras += 1; // contar numero de veces que se llama a la función
  // solo hacer la trancisión la primera vez regulando el delay
  if (contadorBarras > 1) {
    tiempoTransition = 0;
  }

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
    .on("mouseenter", (d) => {
      // mostrar tooltip al entrar en la barra
      pos = [d3.event.clientX, d3.event.clientY];
      mostarTooltip(d, pos);
    })
    .on("mouseleave", (d) => {
      //ocultar tooltip al salir de la barra
      d3.select(".tooltip_promedios").style("display", "none");
    })
    .on("mouseover", function (d) {
      // colocar en naranja al salir si el pais no es el seleccionado
      let color = paisSeleccionado == d.Nombre ? "red" : "orange";
      this.style.fill = color;

      d3.select(this)
        .transition()
        .duration(300)
        .attr("height", yScale.bandwidth() + 5)
        .attr("width", xScale(d.Promedio) + 5);
    })
    .on("mouseout", function (d) {
      // colocar en azul si el pais no es el seleciionado
      let color = paisSeleccionado == d.Nombre ? "red" : "#2a5599";
      this.style.fill = color;
      // colocar barras del tamaño orignal
      d3.select(this)
        .transition()
        .duration(400)
        .attr("height", yScale.bandwidth())
        .attr("width", xScale(d.Promedio));
    })
    .on("click", function (d) {
      // redibujar el grafico
      dibujarBarrasPromedioChart(datos, scales, config);
      // seleccionar pais en variable global
      paisSeleccionado = d.Nombre;

      //colocar pais selecionado en rojo
      let color = paisSeleccionado == d.Nombre ? "red" : "#2a5599";
      this.style.fill = color;

      // obtener historico del pais
      let histPais = getHistorico(d);
      // dibujar el historico del pais(tendencia)
      dibujarTendencia(histPais);
    })

    //pintar barras
    .attr("height", yScale.bandwidth())
    .attr("y", (d) => yScale(d.Nombre))
    // animacion en el width
    .transition()
    .ease(d3.easeSin)
    .duration(tiempoTransition)
    .delay((d) => Math.sqrt(d.Promedio))

    .attr("width", (d) => xScale(d.Promedio))
    .attr("fill", "#2a5599");
} // fin funcion

/* ############################################# FUNCIONES PARA DIBUJAR AXES ############################################# */
// dibujar axes
function dibujarAxesChart(datos, scales, config, ticks) {
  let { xScale, yScale } = scales;
  let { container, margin, height } = config;
  let axisX = d3.axisBottom(xScale).ticks(ticks);

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

/* ############################################# FUNCION PARA LLAMAR GRAFICOS ########################################## */
// Dibujar lineas
function dibujarChart(datos) {
  let config = getContenedorChartConfig("#contenedor");
  let scales = getPromediosScales(datos, config);
  dibujarBarrasPromedioChart(datos, scales, config);
  dibujarAxesChart(datos, scales, config, 3);
} // fin funcion dibujarChart

// función dibujarTendencia
function dibujarTendencia(datos) {
  let config = getContenedorChartConfig(
    "#contenedor_detalle",
    500,
    450,
    10,
    50,
    70,
    70
  );
  config.container.selectAll("*").remove(); //borrar elementos del contenedor
  let scales = getHistoricoScales(datos, config);

  d3.select("#detalle").text("% " + paisSeleccionado); // cambiar titulo de detalle

  dibujarAxesChart(datos, scales, config, 5);
  dibujarTendenciaPais(datos, scales, config);
} // fin funcion dibujar tendencia

/* ############################################# MOSTRAR RESULTADOS ########################################## */
// Mostrar datos
function mostrarDatos() {
  //Obtener los datos del dataset
  let penetracion = datos.penetracion;

  // calcular promedio de penetración anual
  penetracion = getPromedioAnualPais(penetracion);

  // dibujar garaficos
  dibujarChart(penetracion);
} // fin mostrarDatos

// Primera llamada  carga los datos de manera global
// y muestra el grafico de barras.
cargarDatos().then(mostrarDatos);
